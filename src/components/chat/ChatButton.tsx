"use client";

import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageSquare, Send, User, ChevronLeft, Loader2, Eye } from "lucide-react";
import { useSession } from "next-auth/react";
import { getChatUsers, getMessages, sendMessage, markAsRead, getGodModeMessages, getUnreadCount } from "@/lib/chat";

export function ChatButton() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const fetchUnread = async () => {
       const res = await getUnreadCount();
       if (res && typeof res.count === 'number') {
           setUnread(res.count);
       }
    };
    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Sheet>
      {/* @ts-expect-error asChild type mismatch */}
      <SheetTrigger asChild>
        <button className="text-slate-500 hover:text-blue-600 dark:hover:text-blue-500 transition-colors relative">
          <MessageSquare className="w-5 h-5" />
          {unread > 0 && (
             <span className="absolute -top-1 -right-1 block h-3 w-3 rounded-full bg-red-500 ring-2 ring-white" />
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] p-0 flex flex-col bg-slate-50">
         <ChatPanelContent />
      </SheetContent>
    </Sheet>
  );
}

function ChatPanelContent() {
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === 'admin' || session?.user?.role === 'owner';
  
  const [users, setUsers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("direct");
  const [activeChat, setActiveChat] = useState<{ id: string, name: string, type: 'user'|'group' } | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMsg, setInputMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getChatUsers().then(res => {
       if (res.success) setUsers(res.data);
    });
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    const fetchMsgs = async () => {
       if (activeChat) {
          if (activeChat.type === 'user') {
            const res = await getMessages(activeChat.id, undefined);
            if (res.success) setMessages(res.data);
            markAsRead(activeChat.id);
          } else {
            const res = await getMessages(undefined, activeChat.id);
            if (res.success) setMessages(res.data);
          }
       } else if (activeTab === 'godmode' && isAdmin) {
          const res = await getGodModeMessages();
          if (res.success) setMessages(res.data);
       }
    };
    fetchMsgs();
    interval = setInterval(fetchMsgs, 5000); // poll every 5s
    return () => clearInterval(interval);
  }, [activeChat, activeTab, isAdmin]);

  useEffect(() => {
     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim() || !activeChat) return;

    const msg = inputMsg;
    setInputMsg(""); // optimistic clear

    const res = await sendMessage(
       msg, 
       activeChat.type === 'user' ? activeChat.id : undefined,
       activeChat.type === 'group' ? activeChat.id : undefined
    );

    if (res.success && res.message) {
       // manually append optimistic
       setMessages(prev => [...prev, {
         ...res.message,
         sender: { id: session?.user?.id, first_name: session?.user?.first_name, last_name: session?.user?.last_name }
       }]);
    }
  };

  if (activeChat) {
     return (
       <div className="flex flex-col h-full bg-white">
         <div className="flex items-center p-4 border-b">
            <Button variant="ghost" size="icon" onClick={() => setActiveChat(null)} className="mr-2">
               <ChevronLeft className="w-5 h-5 text-slate-500" />
            </Button>
            <div className="font-bold text-slate-800">
               {activeChat.type === 'group' ? "Général" : activeChat.name}
            </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
            {messages.map(m => {
               const isMe = m.sender_id === session?.user?.id;
               return (
                  <div key={m.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                     <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-medium text-slate-400">
                           {m.sender?.first_name || 'Utilisateur'} • {new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                     </div>
                     <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-sm ${
                        isMe ? 'bg-blue-600 text-white rounded-tr-sm' : 'bg-white text-slate-800 border shadow-sm rounded-tl-sm'
                     }`}>
                        {m.content}
                     </div>
                  </div>
               );
            })}
            <div ref={messagesEndRef} />
         </div>
         <form onSubmit={handleSend} className="p-3 bg-white border-t flex gap-2">
            <Input 
               value={inputMsg} 
               onChange={e => setInputMsg(e.target.value)} 
               placeholder="Tapez un message..." 
               className="rounded-full shadow-sm"
            />
            <Button type="submit" size="icon" className="rounded-full bg-blue-600 hover:bg-blue-700 shrink-0">
               <Send className="w-4 h-4 text-white" />
            </Button>
         </form>
       </div>
     );
  }

  return (
    <div className="flex flex-col h-full bg-slate-50">
       <SheetHeader className="p-5 pb-0 bg-white border-b border-slate-100">
         <SheetTitle className="text-xl font-bold flex items-center gap-2 mb-4 text-slate-800">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Messagerie Interne
         </SheetTitle>
         <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full grid-cols-3 bg-slate-50 rounded-lg p-1">
               <TabsTrigger value="direct" className="rounded-md">Direct</TabsTrigger>
               <TabsTrigger value="general" className="rounded-md">Général</TabsTrigger>
               {isAdmin && <TabsTrigger value="godmode" className="rounded-md flex items-center gap-1 text-purple-600"><Eye className="w-3.5 h-3.5"/> God Mode</TabsTrigger>}
            </TabsList>
         </Tabs>
       </SheetHeader>

       <div className="flex-1 overflow-y-auto border-t bg-white relative">
          
          {activeTab === "direct" && (
             <div className="p-2 flex flex-col gap-1">
                {users.map(u => (
                   <button 
                     key={u.id}
                     onClick={() => setActiveChat({ id: u.id, name: `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email, type: 'user' })}
                     className="flex items-center w-full p-3 rounded-xl hover:bg-slate-50 transition-colors text-left"
                   >
                     <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-200 to-slate-300 flex items-center justify-center shrink-0 mr-3">
                        <User className="w-5 h-5 text-slate-500" />
                     </div>
                     <div className="flex flex-col">
                        <span className="font-semibold text-slate-800 text-sm">
                           {`${u.first_name || ''} ${u.last_name || ''}`.trim() || u.email}
                        </span>
                        <span className="text-[11px] text-slate-400 capitalize">{u.role}</span>
                     </div>
                   </button>
                ))}
                {users.length === 0 && <div className="p-8 text-center text-slate-400 text-sm">Aucun utilisateur disponible pour le moment.</div>}
             </div>
          )}

          {activeTab === "general" && (
             <div className="p-4 flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-2"><MessageSquare className="w-8 h-8"/></div>
                <div>
                   <h3 className="font-bold text-slate-800">Canal Général</h3>
                   <p className="text-sm text-slate-500 max-w-[250px] mx-auto mt-2">Discutez avec tous les membres du bureau.</p>
                </div>
                <Button onClick={() => setActiveChat({ id: "general", name: "Général", type: "group" })} className="bg-blue-600 hover:bg-blue-700 mt-4 rounded-xl px-8">
                   Rejoindre le chat
                </Button>
             </div>
          )}

          {activeTab === "godmode" && isAdmin && (
             <div className="p-4 bg-slate-50 min-h-full">
                <div className="bg-purple-100 text-purple-800 text-xs font-bold px-3 py-2 rounded-lg mb-4 flex items-center gap-2">
                   <Eye className="w-4 h-4 shrink-0" />
                   Vue globale sur l'intégralité des échanges de l'organisation. Ces messages sont en lecture seule.
                </div>
                <div className="space-y-4">
                   {messages.map(m => (
                      <div key={m.id} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
                         <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-600">
                               De: {m.sender?.first_name || 'Utilisateur'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                               {new Date(m.created_at).toLocaleString()}
                            </span>
                         </div>
                         <div className="flex items-center gap-1 mb-2">
                             <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500 font-medium whitespace-nowrap">
                                À: {m.group_room ? `Canal ${m.group_room}` : m.receiver?.first_name || 'Inconnu'}
                             </span>
                         </div>
                         <p className="text-sm text-slate-800 bg-slate-50 p-2 rounded-lg break-words">
                            {m.content}
                         </p>
                      </div>
                   ))}
                   {messages.length === 0 && <div className="text-center text-slate-400 py-8 text-sm">Flux de messages vide.</div>}
                </div>
             </div>
          )}

       </div>
    </div>
  );
}
