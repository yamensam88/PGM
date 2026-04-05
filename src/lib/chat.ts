"use server";

import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Automatically pings presence for the logged in user
export async function pingPresence() {
   const session = await getServerSession(authOptions);
   if (!session?.user?.id) return;
   try {
     await prisma.user.update({
       where: { id: session.user.id },
       data: { last_active_at: new Date() }
    });
   } catch (e) {
     // silent fail
   }
}

// Send a message (to a specific user or group)
export async function sendMessage(content: string, receiverId?: string, groupRoom?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organization_id) {
    return { success: false, error: "Non autorisé" };
  }

  try {
    const message = await prisma.internalMessage.create({
      data: {
        organization_id: session.user.organization_id,
        sender_id: session.user.id,
        receiver_id: receiverId || null,
        group_room: groupRoom || null,
        content: content.trim()
      }
    });
    return { success: true, message };
  } catch (error: any) {
    console.error("Erreur sendMessage:", error);
    return { success: false, error: "Erreur lors de l'envoi du message" };
  }
}

// Get history of messages with a specific user or group
export async function getMessages(receiverId?: string, groupRoom?: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organization_id) {
    return { success: false, error: "Non autorisé", data: [] };
  }

  try {
    const whereClause: any = {
      organization_id: session.user.organization_id,
    };

    if (groupRoom) {
      whereClause.group_room = groupRoom;
    } else if (receiverId) {
      whereClause.OR = [
        { sender_id: session.user.id, receiver_id: receiverId },
        { sender_id: receiverId, receiver_id: session.user.id }
      ];
    }

    const messages = await prisma.internalMessage.findMany({
      where: whereClause,
      orderBy: { created_at: 'asc' },
      include: {
         sender: { select: { id: true, first_name: true, last_name: true, role: true } },
         receiver: { select: { id: true, first_name: true, last_name: true, role: true } }
      }
    });

    return { success: true, data: messages };
  } catch (error: any) {
    return { success: false, error: "Erreur lecture messages", data: [] };
  }
}

// Get all users in the organization to chat with
export async function getChatUsers() {
   const session = await getServerSession(authOptions);
   if (!session?.user?.id || !session?.user?.organization_id) {
     return { success: false, data: [] };
   }

   try {
     const users = await prisma.user.findMany({
        where: { organization_id: session.user.organization_id, id: { not: session.user.id } },
        select: { id: true, first_name: true, last_name: true, role: true, email: true, last_login_at: true, last_active_at: true },
        orderBy: { first_name: 'asc' }
     });
     return { success: true, data: users };
   } catch {
     return { success: false, data: [] };
   }
}

// GOD MODE: Get all latest messages in the organization
export async function getGodModeMessages() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organization_id) {
    return { success: false, error: "Non autorisé", data: [] };
  }
  
  if (session.user.role !== 'admin' && session.user.role !== 'owner') {
    return { success: false, error: "Accès God Mode refusé", data: [] };
  }

  try {
    const messages = await prisma.internalMessage.findMany({
      where: { organization_id: session.user.organization_id },
      orderBy: { created_at: 'desc' },
      take: 100, // Limit to recent
      include: {
         sender: { select: { id: true, first_name: true, last_name: true, role: true } },
         receiver: { select: { id: true, first_name: true, last_name: true, role: true } }
      }
    });

    return { success: true, data: messages.reverse() };
  } catch (error: any) {
    return { success: false, error: "Erreur God Mode", data: [] };
  }
}

// Mark messages as read (e.g. from a specific sender to ME)
export async function markAsRead(senderId: string) {
   const session = await getServerSession(authOptions);
   if (!session?.user?.id || !session?.user?.organization_id) return;
   try {
      await prisma.internalMessage.updateMany({
         where: { 
            receiver_id: session.user.id, 
            sender_id: senderId, 
            is_read: false 
         },
         data: { is_read: true }
      });
   } catch (e) {
      // silent fail
   }
}

export async function getUnreadCount() {
   const session = await getServerSession(authOptions);
   if (!session?.user?.id || !session?.user?.organization_id) return { count: 0 };
   try {
      const count = await prisma.internalMessage.count({
         where: { receiver_id: session.user.id, is_read: false }
      });
      return { count };
   } catch {
      return { count: 0 };
   }
}

// GOD MODE: Get all recent login history (Audit)
export async function getConnectionLogs() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || !session?.user?.organization_id) return { success: false, data: [] };
  
  if (session.user.role !== 'admin' && session.user.role !== 'owner') {
    return { success: false, data: [] };
  }

  try {
     const logs = await prisma.sessionLog.findMany({
        where: { organization_id: session.user.organization_id },
        orderBy: { created_at: 'desc' },
        take: 100,
        include: {
           user: { select: { first_name: true, last_name: true, email: true, role: true } }
        }
     });
     return { success: true, data: logs };
  } catch {
     return { success: false, data: [] };
  }
}
