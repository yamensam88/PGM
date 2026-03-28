/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { sendWelcomeEmail } from "@/lib/emails";

/**
 * Server Action: SaaS B2B Client Registration
 */
export async function registerOrganization(formData: FormData) {
  try {
    const companyName = formData.get("companyName") as string;
    const adminFirstName = formData.get("adminFirstName") as string;
    const adminLastName = formData.get("adminLastName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!companyName || !adminFirstName || !adminLastName || !email || !password) {
      throw new Error("Veuillez remplir tous les champs.");
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("Cet email est déjà utilisé sur la plateforme.");

    const organization = await prisma.organization.create({
      data: {
        name: companyName,
        subscription_plan: 'pro',
        subscription_status: 'trialing'
      }
    });

    const hashedPassword = await bcrypt.hash(password, 10);
    const orgAdmin = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        first_name: adminFirstName,
        last_name: adminLastName,
        role: "owner",
        organization_id: organization.id
      }
    });

    // Send the welcome email
    sendWelcomeEmail(email, adminFirstName, companyName).catch(e => console.error("Could not send welcome email", e));

    return { success: true };
  } catch (error: any) {
    console.error("Erreur registerOrganization:", error);
    return { success: false, error: error.message || "Erreur de création." };
  }
}

/**
 * Server Action: Super-Admin toggle organization status
 */
export async function toggleSaaSClientStatus(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.organization_id;
    if (!orgId) throw new Error("Non autorisé.");

    // Security check: Must be Super Admin (Master Org)
    const masterOrg = await prisma.organization.findFirst({ orderBy: { created_at: 'asc' } });
    if (masterOrg?.id !== orgId) {
      throw new Error("Action réservée au Super Admin.");
    }

    const targetOrgId = formData.get("orgId") as string;
    const action = formData.get("action") as string; // 'suspend' or 'activate'

    if (!targetOrgId || !action) throw new Error("Paramètres manquants.");

    const newStatus = action === 'suspend' ? 'suspended' : 'active';

    await prisma.organization.update({
      where: { id: targetOrgId },
      data: { subscription_status: newStatus }
    });

    revalidatePath("/super-admin");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur toggleSaaSClientStatus:", error);
    return { success: false, error: error.message || "Erreur de mise à jour." };
  }
}

/**
 * Server Action: Update Billing Interval (Monthly / Annual)
 */
export async function updateBillingInterval(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    const orgId = session?.user?.organization_id;
    if (!orgId) throw new Error("Non autorisé.");

    const plan = formData.get("plan") as string;
    if (plan !== "pro-monthly" && plan !== "pro-annual") {
       throw new Error("Plan invalide.");
    }

    await prisma.organization.update({
      where: { id: orgId },
      data: { subscription_plan: plan }
    });

    revalidatePath("/dispatch/settings/billing");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateBillingInterval:", error);
    return { success: false, error: error.message };
  }
}

/**
 * Server Action: Create Driver & User
 */
export async function createDriver(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const password = formData.get("password") as string;
    let firstName = formData.get("firstName") as string;
    let lastName = formData.get("lastName") as string;
    const baseCost = Number(formData.get("cost") || 150);

    if (!email || !password) throw new Error("Email et mot de passe sont requis.");

    // Auto-generate names from email if missing
    if (!firstName || !lastName) {
      const parts = email.split('@')[0].split(/[._-]/);
      firstName = firstName || (parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Chauffeur');
      lastName = lastName || (parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : 'Standard');
    }

    // Check if email is already taken
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new Error("Cet email est déjà utilisé par un autre compte.");

    // 1. Create a User for authentication
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: "driver",
        organization_id: orgId
      }
    });

    // 2. Create the associated Driver profile
    await prisma.driver.create({
      data: {
        organization_id: orgId,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone || null,
        status: "active",
        daily_base_cost: baseCost
      }
    });

    revalidatePath("/dispatch/drivers");
    revalidatePath("/dispatch/hr");
    revalidatePath("/dispatch/runs");
    return { success: true };
    
  } catch (error: any) {
    console.error("Erreur createDriver:", error);
    return { success: false, error: error.message || "Erreur lors de la création." };
  }
}

/**
 * Server Action: Create Employee (Salarié)
 */
export async function createEmployee(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const jobTitle = formData.get("jobTitle") as string;
    const employmentType = formData.get("employmentType") as string;
    const hireDateStr = formData.get("hireDate") as string;
    const dailyCostStr = formData.get("dailyCost") as string;
    const monthlyNetSalaryStr = formData.get("monthlyNetSalary") as string;
    
    const paidLeaveBalanceStr = formData.get("paidLeaveBalance") as string;
    const justifiedAbsencesStr = formData.get("justifiedAbsences") as string;
    const unjustifiedAbsencesStr = formData.get("unjustifiedAbsences") as string;
    
    if (!firstName || !lastName || !jobTitle || !employmentType || !hireDateStr) {
       throw new Error("Tous les champs sont requis.");
    }

    const dailyCost = dailyCostStr ? Number(dailyCostStr) : 150;
    const monthlyNetSalary = monthlyNetSalaryStr ? Number(monthlyNetSalaryStr) : null;

    const hireDate = new Date(hireDateStr);

    let createdEmail = null;
    let createdPassword = null;
    let userId = null;

    const customEmail = formData.get("driverEmail") as string;
    const customPassword = formData.get("driverPassword") as string;

    // Logique spécifique si c'est un Chauffeur
    if (jobTitle === "Chauffeur") {
       if (customEmail && customEmail.trim() !== "") {
          createdEmail = customEmail.trim();
          // Verify if custom email already exists
          if (await prisma.user.findUnique({ where: { email: createdEmail } })) {
             throw new Error("Cet email est déjà pris. Veuillez en choisir un autre.");
          }
       } else {
          createdEmail = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}@chauffeur.transportos.com`;
          // Handle duplicate emails in this fallback format
          let uniqueEmail = createdEmail;
          let counter = 1;
          while (await prisma.user.findUnique({ where: { email: uniqueEmail } })) {
             uniqueEmail = `${firstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${lastName.toLowerCase().replace(/[^a-z0-9]/g, '')}${counter}@chauffeur.transportos.com`;
             counter++;
          }
          createdEmail = uniqueEmail;
       }

       if (customPassword && customPassword.trim() !== "") {
          createdPassword = customPassword.trim();
       } else {
          createdPassword = "TransferOS2026!";
       }

       const hashedPassword = await bcrypt.hash(createdPassword, 10);
       const user = await prisma.user.create({
         data: {
           email: createdEmail,
           password_hash: hashedPassword,
           first_name: firstName,
           last_name: lastName,
           role: "driver",
           organization_id: orgId
         }
       });
       userId = user.id;
    }

    // Create the generic profile in the Drivers table used for HR
    await prisma.driver.create({
      data: {
        organization_id: orgId,
        user_id: userId,
        first_name: firstName,
        last_name: lastName,
        job_title: jobTitle,
        employment_type: employmentType,
        hire_date: hireDate,
        email: createdEmail,
        phone: phone || null,
        status: "active",
        daily_base_cost: dailyCost,
        monthly_net_salary: monthlyNetSalary,
        paid_leave_balance: paidLeaveBalanceStr ? Number(paidLeaveBalanceStr) : 0,
        justified_absences: justifiedAbsencesStr ? Number(justifiedAbsencesStr) : 0,
        unjustified_absences: unjustifiedAbsencesStr ? Number(unjustifiedAbsencesStr) : 0,
      } as any // Bypass strict typescript generated schema if needed 
    });

    revalidatePath("/dispatch/hr");
    revalidatePath("/dispatch/runs");
    revalidatePath("/dispatch/drivers");
    revalidatePath("/dispatch/dashboard");
    
    if (jobTitle === "Chauffeur") {
      return { success: true, isDriver: true, email: createdEmail, password: createdPassword };
    } else {
      return { success: true, isDriver: false };
    }

  } catch (error: any) {
    console.error("Erreur createEmployee:", error);
    return { success: false, error: error.message || "Erreur lors de l'ajout du salarié." };
  }
}

/**
 * Server Action: Update Employee (Salarié)
 */
export async function updateEmployee(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const driverId = formData.get("driverId") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const phone = formData.get("phone") as string;
    const email = formData.get("email") as string; // Optional custom email update for Driver profile
    const jobTitle = formData.get("jobTitle") as string;
    const employmentType = formData.get("employmentType") as string;
    const hireDateStr = formData.get("hireDate") as string;
    
    const paidLeaveBalanceStr = formData.get("paidLeaveBalance") as string;
    const justifiedAbsencesStr = formData.get("justifiedAbsences") as string;
    const unjustifiedAbsencesStr = formData.get("unjustifiedAbsences") as string;
    
    const status = formData.get("status") as string || "active";
    const departureDateStr = formData.get("departureDate") as string;
    const departureReason = formData.get("departureReason") as string;
    const departureComments = formData.get("departureComments") as string;

    if (!driverId || !firstName || !lastName || !jobTitle || !employmentType || !hireDateStr) {
       throw new Error("Tous les champs obligatoires doivent être remplis.");
    }

    const hireDate = new Date(hireDateStr);
    const departureDate = departureDateStr ? new Date(departureDateStr) : null;

    // Fetch existing driver to find linked user
    const existingDriver = await prisma.driver.findFirst({
       where: { id: driverId, organization_id: orgId }
    });

    if (!existingDriver) throw new Error("Salarié introuvable.");

    let newEmail = email ? email.trim() : null;

    await prisma.$transaction(async (tx) => {
       // Update User if it exists and email has changed
       if (existingDriver.user_id && newEmail && newEmail !== existingDriver.email) {
          // Check if new email already explicitly taken by someone else
          const emailCheck = await tx.user.findFirst({
             where: { email: newEmail, id: { not: existingDriver.user_id } }
          });
          if (emailCheck) {
             throw new Error("Cet email est déjà utilisé par un autre compte utilisateur.");
          }
          await tx.user.update({
             where: { id: existingDriver.user_id },
             data: {
                first_name: firstName,
                last_name: lastName,
                email: newEmail
             }
          });
       } else if (existingDriver.user_id) {
          // Just update names
          await tx.user.update({
             where: { id: existingDriver.user_id },
             data: {
                first_name: firstName,
                last_name: lastName,
             }
          });
       }

       // Update Driver
       await tx.driver.update({
          where: { id: driverId },
          data: {
             first_name: firstName,
             last_name: lastName,
             email: newEmail || null,
             phone: phone || null,
             job_title: jobTitle,
             employment_type: employmentType,
             hire_date: hireDate,
             paid_leave_balance: paidLeaveBalanceStr ? Number(paidLeaveBalanceStr) : 0,
             justified_absences: justifiedAbsencesStr ? Number(justifiedAbsencesStr) : 0,
             unjustified_absences: unjustifiedAbsencesStr ? Number(unjustifiedAbsencesStr) : 0,
             status: status,
             departure_date: departureDate,
             departure_reason: departureReason || null,
             departure_comments: departureComments || null,
          } as any
       });
    });

    revalidatePath("/dispatch/hr");
    revalidatePath("/dispatch/runs");
    revalidatePath("/dispatch/drivers");
    
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateEmployee:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour." };
  }
}

/**
 * Server Action: Create Admin/HR/Dispatch User
 */
export async function createAdminUser(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const role = formData.get("role") as string; // admin, dispatcher, hr

    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!firstName || !lastName || !role || !email || !password) {
      throw new Error("Veuillez remplir les champs obligatoires.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        organization_id: orgId,
        email: email.trim(),
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role: role,
        status: "active"
      }
    });

    revalidatePath("/dispatch/settings");
    
    return { 
      success: true, 
      email: email.trim(), 
      password: password 
    };
  } catch (error: any) {
    console.error("Erreur createAdminUser:", error);
    // Generic duplicate check
    if (error.code === 'P2002') {
       return { success: false, error: "Un utilisateur avec ce nom/email existe déjà." };
    }
    return { success: false, error: error.message || "Erreur lors de la création de l'utilisateur." };
  }
}

/**
 * Server Action: Delete Admin/HR/Dispatch User
 */
export async function deleteAdminUser(userId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    if (session.user.id === userId) {
       throw new Error("Vous ne pouvez pas supprimer votre propre compte.");
    }

    const targetUser = await prisma.user.findFirst({
       where: { id: userId, organization_id: orgId }
    });

    if (!targetUser) throw new Error("Utilisateur introuvable.");

    await prisma.user.delete({
       where: { id: userId }
    });

    revalidatePath("/dispatch/settings");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteAdminUser:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression." };
  }
}

/**
 * Server Action: Delete Driver
 */
export async function deleteDriver(driverId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    // Fetch the driver to ensure it belongs to the org, and to get user_id
    const driver = await prisma.driver.findFirst({
       where: { id: driverId, organization_id: orgId }
    });

    if (!driver) {
       throw new Error("Chauffeur introuvable.");
    }

    // Delete in transaction
    await prisma.$transaction(async (tx) => {
       // Explicitly delete related records to bypass referential integrity Restrict
       // This allows wiping out fake accounts and all their simulated data
       await tx.eventsLog.deleteMany({ where: { driver_id: driverId } });
       await tx.incident.deleteMany({ where: { driver_id: driverId } });
       await tx.financialEntry.deleteMany({ where: { driver_id: driverId } });
       await tx.hrEvent.deleteMany({ where: { driver_id: driverId } });
       await tx.hrDocument.deleteMany({ where: { driver_id: driverId } });
       
       // Daily runs must be deleted, but because FuelLogs and FinancialEntries 
       // point to them with SetNull, we can safely delete Many runs directly.
       await tx.dailyRun.deleteMany({ where: { driver_id: driverId } });

       // Delete the driver profile
       await tx.driver.delete({
          where: { id: driverId }
       });
       
       // If there's an associated User account, delete it too
       if (driver.user_id) {
          await tx.user.delete({
             where: { id: driver.user_id }
          });
       }
    });

    revalidatePath("/dispatch/runs");
    revalidatePath("/dispatch/hr");
    revalidatePath("/dispatch/drivers");
    
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteDriver:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression du chauffeur." };
  }
}

/**
 * Server Action: Update Driver Net Salary (HR)
 */
export async function updateDriverNetSalary(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const driverId = formData.get("driverId") as string;
    const netSalaryStr = formData.get("netSalary") as string;
    
    if (!driverId) throw new Error("ID du chauffeur manquant.");

    // If empty string, set to null to fallback to auto-estimation
    const netSalary = (netSalaryStr && netSalaryStr.trim() !== "") ? Number(netSalaryStr) : null;

    if (netSalary !== null && (isNaN(netSalary) || netSalary < 0)) {
       throw new Error("Salaire net invalide.");
    }

    await prisma.driver.update({
       where: { id: driverId, organization_id: orgId },
       data: { monthly_net_salary: netSalary } as any
    });

    revalidatePath("/dispatch/hr");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateDriverNetSalary:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour." };
  }
}

/**
 * Server Action: Update Driver Global Cost (HR)
 */
export async function updateDriverGlobalCost(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const driverId = formData.get("driverId") as string;
    const globalCostStr = formData.get("globalCost") as string;
    
    if (!driverId || !globalCostStr) throw new Error("Données manquantes.");

    const globalCost = Number(globalCostStr);
    if (isNaN(globalCost) || globalCost < 0) {
       throw new Error("Coût global invalide.");
    }

    // Convert back to daily base cost based on the 25.33 ratio
    const newDailyCost = globalCost / 25.33;

    await prisma.driver.update({
       where: { id: driverId, organization_id: orgId },
       data: { 
          daily_base_cost: newDailyCost,
          hourly_cost: globalCost // We use the unused hourly_cost field to store the EXACT monthly global cost inputted by the user to avoid 9-cents rounding errors
       } as any
    });

    revalidatePath("/dispatch/hr");
    revalidatePath("/dispatch/dashboard"); // Since cost impacts dash
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateDriverGlobalCost:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour." };
  }
}

/**
 * Server Action: Update Driver Bonus Amount (HR)
 */
export async function updateDriverBonusAmount(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const driverId = formData.get("driverId") as string;
    const amountStr = formData.get("amount") as string;
    
    if (!driverId || !amountStr) throw new Error("Données manquantes.");

    const base_bonus_amount = Number(amountStr);
    if (isNaN(base_bonus_amount) || base_bonus_amount < 0) {
       throw new Error("Montant invalide.");
    }

    await prisma.driver.update({
       where: { id: driverId, organization_id: orgId },
       data: { base_bonus_amount } as any
    });

    revalidatePath("/dispatch/hr");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateDriverBonusAmount:", error);
    return { success: false, error: error.message || "Erreur." };
  }
}

/**
 * Server Action: Toggle Monthly Bonus (HR)
 */
export async function toggleMonthlyBonus(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const driverId = formData.get("driverId") as string;
    const action = formData.get("action") as string; // grant, refuse, revoke
    const month = Number(formData.get("month")); // 0-based
    const year = Number(formData.get("year"));
    const amountStr = formData.get("amount") as string;

    if (!driverId || !action || isNaN(month) || isNaN(year)) throw new Error("Données manquantes.");

    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0, 23, 59, 59);

    await prisma.$transaction(async (tx) => {
       const existingEvents = await tx.hrEvent.findMany({
          where: {
             driver_id: driverId,
             event_type: 'bonus',
             start_date: { gte: startDate, lte: endDate }
          }
       });

       if (existingEvents.length > 0) {
          await tx.hrEvent.deleteMany({
             where: { id: { in: existingEvents.map((e: any) => e.id) } }
          });
       }

       if (action === "grant") {
          await tx.hrEvent.create({
             data: {
                organization_id: orgId,
                driver_id: driverId,
                event_type: 'bonus',
                start_date: startDate, 
                status: 'granted',
                notes: amountStr || "0"
             } as any
          });
       } else if (action === "refuse") {
          await tx.hrEvent.create({
             data: {
                organization_id: orgId,
                driver_id: driverId,
                event_type: 'bonus',
                start_date: startDate,
                status: 'refused',
                notes: "0"
             } as any
          });
       }
    });

    revalidatePath("/dispatch/hr");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur toggleMonthlyBonus:", error);
    return { success: false, error: error.message || "Erreur." };
  }
}

/**
 * Server Action: Finish Daily Run
 * Uses Prisma Transactions to ensure atomicity.
 */
export async function finishRun(formData: FormData) {
  console.log("▶ [finishRun] Réception du formData:", Object.fromEntries(formData));
  
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.organization_id) {
        throw new Error("Non autorisé. Veuillez vous connecter.");
    }
    const orgId = session.user.organization_id;

    const runId = formData.get("runId") as string;
    const km_start_input = formData.get("km_start");
    const km_start = km_start_input ? Number(km_start_input) : null;
    const km_end = Number(formData.get("km_end"));
    const stops_done = Number(formData.get("stops_done"));
    const failed_stops = Number(formData.get("failed_stops") || 0);
    const advised_parcels_direct = Number(formData.get("advised_parcels_direct") || 0);
    const advised_parcels_relay = Number(formData.get("advised_parcels_relay") || 0);
    const advised_parcels = advised_parcels_direct + advised_parcels_relay;
    const packages_returned = Number(formData.get("packages_returned") || 0);
    const return_notes = formData.get("return_notes") as string || undefined;
    const proof_of_return_photo_url = formData.get("proof_of_return_photo_url") as string || undefined;

    // Validation métier stricte
    if (!runId) throw new Error("ID de tournée manquant.");
    if (km_start !== null && isNaN(km_start)) throw new Error("Kilométrage de départ invalide.");
    if (isNaN(km_end)) throw new Error("Kilométrage de fin invalide.");
    if (stops_done < 0 || failed_stops < 0 || advised_parcels < 0) {
      throw new Error("Les quantités (stops, colis) doivent être positives ou nulles.");
    }

    // Optional Fuel Section
    const fuel_price = formData.get("fuel_price") ? Number(formData.get("fuel_price")) : undefined;
    const fuel_liters = formData.get("fuel_liters") ? Number(formData.get("fuel_liters")) : undefined;
    const fuel_receipt_file = formData.get("fuel_receipt") as File | null;

    // 1. Fetch related data to perform calculations
    console.log(`▶ [finishRun] Récupération de la tournée ${runId}`);
    const run = await prisma.dailyRun.findUnique({
      where: { 
          id: runId,
          organization_id: orgId 
      },
      include: {
        rate_card: true,
        driver: true,
        vehicle: true,
        organization: true
      }
    });

    if (!run) throw new Error("Tournée introuvable ou non autorisée.");
    if (run.status === "completed") throw new Error("Cette tournée est déjà clôturée.");
    
    const final_km_start = km_start !== null ? km_start : (run.km_start !== null ? Number(run.km_start) : null);
    if (final_km_start !== null && km_end < final_km_start) {
      throw new Error(`Le kilométrage de fin (${km_end}) ne peut être inférieur au kilométrage de départ (${final_km_start}).`);
    }

    // 2. Formulate Cost & Revenue based on fetched parameters
    const base_flat = Number(run.rate_card?.base_daily_flat || 0);
    const price_stop = Number(run.rate_card?.unit_price_stop || 0);
    const price_parcel = Number(run.rate_card?.unit_price_package || 0);
    const bonus_relay = Number(run.rate_card?.bonus_relay_point || 0);
    
    // NOTE MÉTIER: En V1, le prix par colis est calculé sur les colis assignés à la tournée 
    // (packages_loaded + packages_relay), pas sur les seuls colis effectivement livrés.
    const billed_parcels = (run.packages_loaded || 0) + (run.packages_relay || 0);
    
    const revenue_calculated = 
      base_flat + 
      (price_stop * stops_done) + 
      (price_parcel * billed_parcels) + 
      (bonus_relay * (run.packages_relay || 0));
    
    console.log(`▶ [finishRun] Calcul revenue_calculated: ${revenue_calculated}€`);

    // Determine if this is the first run of the day for the vehicle/driver
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const priorDriverRuns = await prisma.dailyRun.count({
      where: { driver_id: run.driver_id, date: { gte: startOfDay, lte: endOfDay }, id: { not: runId }, status: 'completed' }
    });
    const cost_driver = priorDriverRuns > 0 ? 0 : Number(run.driver.daily_base_cost || 0);
    console.log(`▶ [finishRun] Calcul cost_driver (Prorata): ${cost_driver}€`);

    // Cost Fleet: default_run_cost + fuel_amount + ( (km_end - km_start) * cost_per_km )
    const priorVehicleRuns = await prisma.dailyRun.count({
      where: { vehicle_id: run.vehicle_id, date: { gte: startOfDay, lte: endOfDay }, id: { not: runId }, status: 'completed' }
    });
    const base_fleet_cost = priorVehicleRuns > 0 ? 0 : (Number(run.vehicle.fixed_monthly_cost || 0) + Number(run.vehicle.rental_monthly_cost || 0) + Number(run.vehicle.insurance_monthly_cost || 0)) / 30; // Approximation daily
    
    const cost_per_km = Number(run.vehicle.internal_cost_per_km || 0);
    const km_diff = Math.max(0, km_end - (final_km_start !== null ? final_km_start : km_end)); // fallback to 0 if km_start missing
    const variable_fleet_cost = km_diff * cost_per_km;

    let final_fuel_amount = 0;
    let actual_fuel_price = 1.80; // default assumption
    
    if (fuel_liters && fuel_liters > 0) {
       // If driver entered price, use it, else fallback to global setting
       const orgSettings = run.organization?.settings_json as { fuel_price_per_liter?: number } | null;
       actual_fuel_price = fuel_price && fuel_price > 0 ? fuel_price : (orgSettings?.fuel_price_per_liter || 1.80);
       
       final_fuel_amount = fuel_liters * actual_fuel_price;
       console.log(`▶ [finishRun] Calcul auto du gasoil: ${fuel_liters}L x ${actual_fuel_price}€/L = ${final_fuel_amount}€`);
    }

    const cost_fleet = base_fleet_cost + variable_fleet_cost + final_fuel_amount;
    console.log(`▶ [finishRun] Calcul cost_fleet: ${cost_fleet}€ (base: ${base_fleet_cost}, variable: ${variable_fleet_cost}, fuel: ${final_fuel_amount})`);

    // 3. Execute Transaction
    console.log(`▶ [finishRun] Début de la transaction Prisma...`);
    await prisma.$transaction(async (tx) => {
      
      // A. Create Fuel/Financial Entry if provided
      if (final_fuel_amount > 0) {
        console.log(`▶ [finishRun] Création FuelLog et FinancialEntry pour ${final_fuel_amount}€`);
        // 1. Generate Fuel Log
        let receiptUrl = null;
        if (fuel_receipt_file && fuel_receipt_file.size > 0) {
           receiptUrl = `/uploads/${run.organization_id}/${runId}/${fuel_receipt_file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
        }

        await tx.fuelLog.create({
          data: {
            organization_id: run.organization_id,
            vehicle_id: run.vehicle_id,
            run_id: runId,
            total_cost: final_fuel_amount,
            liters: fuel_liters || 0,
            price_per_liter: actual_fuel_price,
            fueled_at: new Date(),
            receipt_url: receiptUrl,
          }
        });
        // 2. Generate Financial Ledger Entry
        await tx.financialEntry.create({
          data: {
            organization_id: run.organization_id,
            vehicle_id: run.vehicle_id,
            run_id: runId,
            entry_type: 'cost',
            category: 'fuel_cost',
            amount: final_fuel_amount,
            entry_date: new Date(),
            description: `Fuel end of run ${runId}`
          }
        });
      }

      // B. Update the Daily Run using updateMany for optimistic locking / atomic race condition check
      console.log(`▶ [finishRun] Mise à jour de la DailyRun ${runId}`);
      const base_and_variable_fleet_cost = base_fleet_cost + variable_fleet_cost;
      
      const updateResult = await tx.dailyRun.updateMany({
        where: { id: runId, status: { not: "completed" } },
        data: {
          km_start: final_km_start !== null ? final_km_start : undefined,
          km_end,
          stops_completed: stops_done,
          stops_failed: failed_stops,
          packages_advised: advised_parcels,
          packages_advised_direct: advised_parcels_direct,
          packages_advised_relay: advised_parcels_relay,
          packages_returned: packages_returned,
          packages_delivered: Math.max(0, (run.packages_loaded || 0) + (run.packages_relay || 0) - advised_parcels - packages_returned),
          notes: return_notes || null,
          status: "completed",
          return_time: new Date(),
          revenue_calculated,
          cost_driver,
          cost_vehicle: base_and_variable_fleet_cost,
          cost_fuel: final_fuel_amount,
          margin_net: revenue_calculated - cost_driver - base_and_variable_fleet_cost - final_fuel_amount,
        }
      });

      if (updateResult.count === 0) {
        throw new Error("Cette tournée a déjà été clôturée ou a été modifiée concurremment.");
      }

      // C. Create Full Financial Entries Ledger for this Run
      console.log(`▶ [finishRun] Création du Ledger Financier (CA, Chauffeur, Véhicule)`);
      await tx.financialEntry.createMany({
        data: [
          {
            organization_id: run.organization_id,
            vehicle_id: run.vehicle_id,
            driver_id: run.driver_id,
            client_id: run.client_id,
            run_id: runId,
            entry_type: 'revenue',
            category: 'delivery_revenue',
            amount: revenue_calculated,
            entry_date: new Date(),
            description: `Chiffre d'Affaires - Tournée ${run.run_code || runId}`
          },
          {
            organization_id: run.organization_id,
            vehicle_id: run.vehicle_id,
            driver_id: run.driver_id,
            run_id: runId,
            entry_type: 'cost',
            category: 'driver_cost',
            amount: cost_driver,
            entry_date: new Date(),
            description: `Coût Chauffeur - Tournée ${run.run_code || runId}`
          },
          {
            organization_id: run.organization_id,
            vehicle_id: run.vehicle_id,
            run_id: runId,
            entry_type: 'cost',
            category: 'vehicle_wear_cost',
            amount: base_and_variable_fleet_cost,
            entry_date: new Date(),
            description: `Coût Véhicule (fixe + km) - Tournée ${run.run_code || runId}`
          }
        ]
      });

      // C. Insert logic to Events Log
      console.log(`▶ [finishRun] Création de l'EventsLog`);
      await tx.eventsLog.create({
        data: {
          organization_id: run.organization_id,
          run_id: runId,
          event_type: 'run_completed',
          metadata_json: { 
            km_end, 
            stops_completed: stops_done, 
            revenue_calculated, 
            cost_vehicle: base_fleet_cost + variable_fleet_cost, 
            cost_fuel: final_fuel_amount,
            cost_driver,
            margin_net: revenue_calculated - cost_driver - (base_fleet_cost + variable_fleet_cost) - final_fuel_amount
          }
        }
      });

    });

    console.log(`▶ [finishRun] Succès. Revalidation des chemins.`);
    // Revalidate layout to update dispatch dashboard
    revalidatePath("/dispatch/dashboard");
    revalidatePath(`/driver/runs/${runId}/finish`);
    
    return { success: true, message: "Tournée clôturée et calculs de marges appliqués." };
  } catch (err: any) {
    console.error("▶ [finishRun] Erreur interceptée :", err);
    return { success: false, error: err.message || "Une erreur interne est survenue." };
  }
}

/**
 * Server Action: Delete Daily Run (For cleaning faux runs)
 */
export async function deleteRun(runId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const run = await prisma.dailyRun.findFirst({
       where: { id: runId, organization_id: orgId }
    });

    if (!run) {
       throw new Error("Tournée introuvable.");
    }

    await prisma.$transaction(async (tx) => {
       await tx.eventsLog.deleteMany({ where: { run_id: runId } });
       await tx.incident.deleteMany({ where: { run_id: runId } });
       await tx.financialEntry.deleteMany({ where: { run_id: runId } });
       await tx.fuelLog.deleteMany({ where: { run_id: runId } });
       
       await tx.dailyRun.delete({ where: { id: runId } });
    });

    revalidatePath("/dispatch/runs");
    revalidatePath("/dispatch/dashboard");
    revalidatePath("/dispatch/hr");
    
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteRun:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression." };
  }
}

/**
 * Server Action: Report Incident
 */
export async function reportIncident(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.organization_id) {
      throw new Error("Non autorisé.");
  }
  const orgId = session.user.organization_id;

  const runId = formData.get("runId") as string;
  const type = formData.get("type") as string;
  const severity = formData.get("severity") as string;
  const description = formData.get("description") as string;
  const proof_url = formData.get("proof_url") as string | undefined;
  
  const gps_lat = formData.get("gps_lat") ? parseFloat(formData.get("gps_lat") as string) : undefined;
  const gps_lng = formData.get("gps_lng") ? parseFloat(formData.get("gps_lng") as string) : undefined;

  const run = await prisma.dailyRun.findUnique({
    where: { 
        id: runId,
        organization_id: orgId
    },
    select: { organization_id: true }
  });

  if (!run) throw new Error("Run not found or unauthorized");

  await prisma.incident.create({
    data: {
      organization_id: run.organization_id,
      run_id: runId,
      incident_type: type,
      severity,
      description,
      photo_evidence_url: proof_url || null,
      gps_latitude: gps_lat,
      gps_longitude: gps_lng,
      ai_validation_flag: false,
      resolution_status: "open",
    }
  });

  revalidatePath("/dispatch/dashboard");
  revalidatePath(`/driver/runs/${runId}/incident`);
  
  return { success: true };
}

/**
 * Server Action: Start Daily Run
 */
export async function startRun(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.organization_id) {
        throw new Error("Non autorisé.");
    }
    const orgId = session.user.organization_id;

    const runId = formData.get("runId") as string;
    const vehicle_id = formData.get("vehicle_id") as string;
    const km_start = Number(formData.get("km_start"));
    const packages_loaded = Number(formData.get("packages_loaded"));
    const packages_relay = Number(formData.get("packages_relay"));

    if (!runId || !vehicle_id || isNaN(km_start) || isNaN(packages_loaded) || isNaN(packages_relay)) {
      throw new Error("Veuillez remplir correctement tous les champs obligatoires.");
    }

    const run = await prisma.dailyRun.findUnique({
      where: { id: runId, organization_id: orgId },
      include: { driver: true }
    });

    if (!run) throw new Error("Tournée introuvable.");
    if (run.status !== "planned") throw new Error("Cette tournée ne peut pas être démarrée.");

    await prisma.$transaction(async (tx) => {
      const updateResult = await tx.dailyRun.updateMany({
        where: { id: runId, status: "planned" },
        data: {
          vehicle_id,
          km_start,
          packages_loaded,
          packages_relay,
          status: "in_progress",
          departure_time: new Date(),
        }
      });

      if (updateResult.count === 0) {
        throw new Error("Impossible de démarrer cette tournée. Elle est déjà en cours ou clôturée.");
      }

      await tx.eventsLog.create({
        data: {
          organization_id: orgId,
          run_id: runId,
          driver_id: run.driver_id,
          vehicle_id,
          event_type: "run_started",
          metadata_json: { km_start, packages_loaded, packages_relay }
        }
      });
    });

    revalidatePath("/dispatch/dashboard");
    revalidatePath("/driver");
    revalidatePath(`/driver/runs/${runId}/start`);

    return { success: true };
  } catch (err: any) {
    console.error("▶ [startRun] Erreur interceptée :", err);
    return { success: false, error: err.message || "Une erreur interne est survenue." };
  }
}

/**
 * Server Action: Create Daily Run
 */
export async function createRun(formData: FormData) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.organization_id) {
      throw new Error("Non autorisé.");
  }
  const orgId = session.user.organization_id;

  const driver_id = formData.get("driver_id") as string;
  const vehicle_id = formData.get("vehicle_id") as string;
  const client_id = formData.get("client_id") as string;
  const zone_id = formData.get("zone_id") as string;
  const rate_card_id = formData.get("rate_card_id") as string || undefined;
  const date_input = formData.get("date") as string;
  
  const direct_parcels = Number(formData.get("direct_parcels") || 0);
  const colis_collected = Number(formData.get("colis_collected") || 0);

  const packages_delivered = Number(formData.get("packages_delivered") || 0);
  const packages_returned = Number(formData.get("packages_returned") || 0);
  const packages_relay = Number(formData.get("packages_relay") || 0);
  const km_start = Number(formData.get("km_start") || 0);
  const km_end = Number(formData.get("km_end") || 0);
  const fuel_liters = Number(formData.get("fuel_liters") || 0);
  const fuel_price_str = formData.get("fuel_price");
  const fuel_price = fuel_price_str ? Number(fuel_price_str) : null;
  const fuel_receipt = formData.get("fuel_receipt") as File | null;
  const markCompleted = formData.get("mark_completed") === "yes";

  if (!driver_id || !vehicle_id || !client_id || !zone_id || !date_input) {
    throw new Error("Veuillez remplir tous les champs obligatoires.");
  }

  const localDate = new Date(date_input);
  const utcDate = new Date(Date.UTC(localDate.getFullYear(), localDate.getMonth(), localDate.getDate()));

  const isCompleted = markCompleted || km_end > 0 || packages_delivered > 0;

  let revenue_calculated = 0;
  let cost_driver = 0;
  let cost_vehicle = 0;
  let cost_fuel = 0;
  let margin_net = 0;
  let km_diff = 0;

  if (isCompleted) {
    const driver = await prisma.driver.findUnique({ where: { id: driver_id } });
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicle_id } });
    
    let rateCard;
    if (rate_card_id) {
       rateCard = await prisma.rateCard.findUnique({ where: { id: rate_card_id } });
    } else {
       const client = await prisma.client.findUnique({ where: { id: client_id }, include: { rate_cards: true } });
       rateCard = client?.rate_cards?.[0];
    }

    const base_flat = Number(rateCard?.base_daily_flat || 0);
    const price_stop = Number(rateCard?.unit_price_stop || 0);
    const price_parcel = Number(rateCard?.unit_price_package || 0);
    const bonus_relay = Number(rateCard?.bonus_relay_point || 0);

    const billed_parcels = direct_parcels + packages_relay;
    revenue_calculated = base_flat + (price_stop * colis_collected) + (price_parcel * billed_parcels) + (bonus_relay * packages_relay);

    // Filter double counting for createRun
    const startOfDay = new Date(utcDate);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(utcDate);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const priorDriverRuns = await prisma.dailyRun.count({
      where: { driver_id: driver_id, date: { gte: startOfDay, lte: endOfDay }, status: 'completed' }
    });
    cost_driver = priorDriverRuns > 0 ? 0 : Number(driver?.daily_base_cost || 0);

    const priorVehicleRuns = await prisma.dailyRun.count({
      where: { vehicle_id: vehicle_id, date: { gte: startOfDay, lte: endOfDay }, status: 'completed' }
    });
    const base_fleet_cost = priorVehicleRuns > 0 ? 0 : (Number(vehicle?.fixed_monthly_cost || 0) + Number(vehicle?.rental_monthly_cost || 0) + Number(vehicle?.insurance_monthly_cost || 0)) / 30;
    km_diff = Math.max(0, km_end - km_start);
    const variable_fleet_cost = km_diff * Number(vehicle?.internal_cost_per_km || 0);
    cost_vehicle = base_fleet_cost + variable_fleet_cost;
    
    if (fuel_liters > 0) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      const actual_fuel_price = fuel_price ? fuel_price : (org?.settings_json ? ((org.settings_json as any).fuel_price_per_liter || 1.80) : 1.80);
      cost_fuel = fuel_liters * actual_fuel_price;
    }
    
    margin_net = revenue_calculated - cost_driver - cost_vehicle - cost_fuel;
  }

  const newRun = await prisma.dailyRun.create({
    data: {
      organization_id: orgId,
      driver_id,
      vehicle_id,
      client_id,
      zone_id,
      rate_card_id: rate_card_id || null,
      date: utcDate,
      status: isCompleted ? 'completed' : 'planned',
      
      packages_loaded: direct_parcels,
      stops_planned: colis_collected,
      packages_delivered: isCompleted ? packages_delivered : null,
      packages_returned: isCompleted ? packages_returned : null,
      packages_relay: isCompleted ? packages_relay : null,
      stops_completed: isCompleted ? colis_collected : null,
      km_start: isCompleted ? km_start : null,
      km_end: isCompleted ? km_end : null,
      km_total: isCompleted ? km_diff : null,
      fuel_consumed_liters: isCompleted ? fuel_liters : null,
      return_time: isCompleted ? new Date() : null,
      
      revenue_calculated: isCompleted ? revenue_calculated : null,
      cost_driver: isCompleted ? cost_driver : null,
      cost_vehicle: isCompleted ? cost_vehicle : null,
      cost_fuel: isCompleted ? cost_fuel : null,
      margin_net: isCompleted ? margin_net : null
    }
  });

  if (isCompleted) {
      let receiptUrl = null;
      if (fuel_receipt && fuel_receipt.size > 0) {
         receiptUrl = `/uploads/${orgId}/${newRun.id}/${fuel_receipt.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      }

      if (fuel_liters > 0) {
         await prisma.fuelLog.create({
            data: {
              organization_id: orgId,
              vehicle_id,
              run_id: newRun.id,
              total_cost: cost_fuel,
              liters: fuel_liters,
              price_per_liter: cost_fuel / fuel_liters,
              fueled_at: new Date(),
              receipt_url: receiptUrl
            }
         });
      } // <-- Added closing brace here

      const ledgerEntries: any[] = [
          {
            organization_id: orgId,
            vehicle_id: vehicle_id,
            driver_id: driver_id,
            client_id: client_id,
            run_id: newRun.id,
            entry_type: 'revenue',
            category: 'delivery_revenue',
            amount: revenue_calculated,
            entry_date: new Date(),
            description: `Chiffre d'Affaires - Tournée ${newRun.id}`
          },
          {
            organization_id: orgId,
            vehicle_id: vehicle_id,
            driver_id: driver_id,
            run_id: newRun.id,
            entry_type: 'cost',
            category: 'driver_cost',
            amount: cost_driver,
            entry_date: new Date(),
            description: `Coût Chauffeur - Tournée ${newRun.id}`
          },
          {
            organization_id: orgId,
            vehicle_id: vehicle_id,
            run_id: newRun.id,
            entry_type: 'cost',
            category: 'vehicle_wear_cost',
            amount: cost_vehicle,
            entry_date: new Date(),
            description: `Coût Véhicule (fixe + km) - Tournée ${newRun.id}`
          }
      ];

      if (fuel_liters > 0) {
          ledgerEntries.push({
            organization_id: orgId,
            vehicle_id: vehicle_id,
            run_id: newRun.id,
            entry_type: 'cost',
            category: 'fuel_cost',
            amount: cost_fuel,
            entry_date: new Date(),
            description: `Fuel end of run ${newRun.id}`
          });
      }

      await prisma.financialEntry.createMany({
          data: ledgerEntries
      });
      
      await prisma.eventsLog.create({
        data: {
          organization_id: orgId,
          run_id: newRun.id,
          event_type: 'run_completed',
          metadata_json: { km_end, stops_completed: colis_collected, revenue_calculated, cost_vehicle, cost_fuel, cost_driver, margin_net }
        }
      });
  }

  revalidatePath("/dispatch/dashboard");
  revalidatePath("/dispatch/runs");
  return { success: true, runId: newRun.id };
}

/**
 * Server Action: Generate AI Profitability Report
 */
export async function generateAiProfitabilityReport(runId: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user || !session.user.organization_id) {
      throw new Error("Non autorisé.");
  }
  const orgId = session.user.organization_id;

  const run = await prisma.dailyRun.findUnique({
    where: { id: runId, organization_id: orgId },
    include: { driver: true, vehicle: true }
  });

  if (!run || run.status !== 'completed') {
    throw new Error("Run not found or not completed.");
  }

  // AI Simulation Logic
  const rev = Number(run.revenue_calculated || 0);
  const costs = Number(run.cost_driver || 0) + Number(run.cost_vehicle || 0);
  const margin = rev - costs;
  
  let score = 50;
  let summary = "";
  
  if (margin > 20) {
      score = 90;
      summary = "Excellente rentabilité. Les coûts du véhicule et du chauffeur sont largement couverts par le chiffre d'affaires. Continuez d'assigner ce duo sur ces zones très denses.";
  } else if (margin > 0) {
      score = 65;
      summary = "Rentabilité moyenne. La tournée est à l'équilibre, mais le ratio colis / km pourrait être optimisé pour augmenter la marge nette réelle.";
  } else {
      score = 30;
      summary = `⚠️ Alerte de rentabilité. Cette tournée génère une perte nette de ${Math.abs(margin).toFixed(2)}€. Cause probable: coût de flotte de ${run.cost_vehicle}€ trop élevé par rapport aux ${run.packages_loaded} colis facturables. Action recommandée: consolider les colis ou assigner un véhicule moins coûteux.`;
  }

  const existingReport = await prisma.aiReport.findFirst({
      where: { 
          organization_id: orgId,
          report_type: "run_profitability",
          structured_data_json: {
             path: ['run_id'],
             equals: runId
          }
      }
  });

  const contentPayload = {
      run_id: runId,
      summary,
      profitability_score: score,
      anomalies_detected: margin < 0 ? ["Déficit Opérationnel"] : [],
      recommendations: margin < 0 ? ["Assigner véhicule moins coûteux"] : ["Maintenir la configuration"],
  };

  if (existingReport) {
      // Update
      await prisma.aiReport.update({
          where: { id: existingReport.id },
          data: {
              structured_data_json: contentPayload as any,
              generated_text: summary,
          }
      });
  } else {
      // Create
      await prisma.aiReport.create({
          data: {
              organization_id: orgId,
              report_type: "run_profitability",
              structured_data_json: contentPayload as any,
              generated_text: summary,
          }
      });
  }

  revalidatePath(`/dispatch/runs/${runId}`);
  return { success: true, score, summary };
}

/**
 * Server Action: Add Maintenance Log
 */
export async function addMaintenanceLog(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const vehicle_id = formData.get("vehicle_id") as string;
    const maintenance_type = formData.get("type") as string;
    const description = formData.get("description") as string;
    const cost = Number(formData.get("cost"));
    const km_at_service = Number(formData.get("km"));
    const vendor_name = formData.get("vendorName") as string;
    const date_input = formData.get("date") as string;
    const document_file = formData.get("document") as File | null;

    if (!vehicle_id || !maintenance_type || isNaN(cost) || !date_input) {
      throw new Error("Veuillez remplir les champs obligatoires correctement.");
    }

    const serviceDate = new Date(date_input);
    
    let documentUrl = null;
    if (document_file && document_file.size > 0) {
       documentUrl = `/uploads/org_${orgId}/maintenance_${vehicle_id}_${Date.now()}_${document_file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Maintenance Log
      await tx.maintenanceLog.create({
        data: {
          organization_id: orgId,
          vehicle_id,
          maintenance_type,
          description,
          cost,
          km_at_service,
          vendor_name,
          service_date: serviceDate,
          invoice_url: documentUrl,
        }
      });

      // 2. Create Financial Entry to affect global profitability
      await tx.financialEntry.create({
        data: {
          organization_id: orgId,
          vehicle_id,
          entry_type: 'cost',
          category: 'maintenance_cost',
          amount: cost,
          description: `Maintenance: ${maintenance_type} chez ${vendor_name || 'Inconnu'}`,
          entry_date: serviceDate
        }
      });
      
      // 3. Update vehicle status and km
      const vehicleUpdateData: any = {
        status: 'maintenance',
        last_maintenance_km: km_at_service > 0 ? km_at_service : undefined,
      };

      // Si le formulaire inclut un flag pour effacer le rdv courant
      if (formData.get("clear_appointment") === "true") {
        vehicleUpdateData.next_appointment_date = null;
        vehicleUpdateData.next_appointment_nature = null;
      }

      await tx.vehicle.update({
        where: { id: vehicle_id },
        data: vehicleUpdateData
      });
    });

    revalidatePath("/dispatch/vehicles");
    revalidatePath("/dispatch/runs");
    revalidatePath("/dispatch/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur addMaintenanceLog:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement de l'entretien." };
  }
}

/**
 * Server Action: Report Vehicle Damage (Fleet Management)
 */
export async function reportVehicleDamage(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const vehicle_id = formData.get("vehicle_id") as string;
    const driver_id = formData.get("driver_id") as string;
    const run_id = formData.get("run_id") as string | null;
    const description = formData.get("description") as string;
    const cost = Number(formData.get("cost"));
    const date_input = formData.get("date") as string;
    const document_file = formData.get("document") as File | null;

    if (!vehicle_id || !driver_id || isNaN(cost) || !date_input) {
      throw new Error("Veuillez remplir les champs obligatoires correctement.");
    }

    const incidentDate = new Date(date_input);

    let documentUrl = null;
    if (document_file && document_file.size > 0) {
       documentUrl = `/uploads/org_${orgId}/damage_${vehicle_id}_${Date.now()}_${document_file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    }

    await prisma.$transaction(async (tx) => {
      // 1. Create Incident Log
      await tx.incident.create({
        data: {
          organization_id: orgId,
          vehicle_id,
          driver_id,
          run_id: run_id || null,
          incident_type: 'vehicle_damage',
          severity: 'medium',
          description,
          photo_evidence_url: documentUrl,
          resolution_status: 'validated', // auto validé depuis le backoffice
          penalty_exposure_amount: cost, // On stocke le coût de la casse ici pour pouvoir le relier
          created_at: incidentDate,
          updated_at: incidentDate,
        }
      });

      // 2. Create Financial Entry to affect global profitability AND driver specific stats
      await tx.financialEntry.create({
        data: {
          organization_id: orgId,
          vehicle_id,
          driver_id,
          run_id: run_id || null,
          entry_type: 'cost',
          category: 'damage_cost',
          amount: cost,
          description: `Casse véhicule: ${description || 'Non précisé'}`,
          entry_date: incidentDate
        }
      });
    });

    revalidatePath("/dispatch/fleet");
    revalidatePath("/dispatch/vehicles");
    revalidatePath("/direction");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur reportVehicleDamage:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement du sinistre." };
  }
}

// DISPATCH/VEHICLES - Create a new vehicle
export async function addVehicle(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const parseNumber = (val: any) => {
      if (!val) return 0;
      const cleanVal = String(val).replace(',', '.');
      const num = Number(cleanVal);
      return isNaN(num) ? 0 : num;
    };

    const plate_number = formData.get("plate_number") as string;
    const category = formData.get("category") as string;
    const current_km = Number(formData.get("current_km") || 0);
    const fixed_monthly_cost = parseNumber(formData.get("fixed_monthly_cost"));
    const rental_monthly_cost = parseNumber(formData.get("rental_monthly_cost"));
    const insurance_monthly_cost = parseNumber(formData.get("insurance_monthly_cost"));
    const internal_cost_per_km = parseNumber(formData.get("internal_cost_per_km"));
    const ownership_type = formData.get("ownership_type") as string;
    const lessor_name = formData.get("lessor_name") as string;

    if (!plate_number) throw new Error("La plaque d'immatriculation est requise.");

    await prisma.vehicle.create({
      data: {
        organization_id: orgId,
        plate_number,
        category,
        current_km,
        fixed_monthly_cost: ownership_type === 'owned' ? fixed_monthly_cost : 0,
        rental_monthly_cost: ownership_type === 'rented' ? rental_monthly_cost : 0,
        insurance_monthly_cost,
        internal_cost_per_km,
        ownership_type: ownership_type || 'owned',
        lessor_name: ownership_type === 'rented' ? lessor_name : null,
        status: 'active'
      } as any // Prisma typed any because we might have generated schema locally but client doesn't see it
    });

    revalidatePath("/dispatch/vehicles");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur addVehicle:", error);
    return { success: false, error: error.message || "Erreur lors de la création du véhicule." };
  }
}

// DIRECTION/SETTINGS - Update global fuel price
export async function updateFuelPrice(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;
    
    const price = Number(formData.get("fuel_price"));
    if (isNaN(price) || price <= 0) throw new Error("Prix invalide.");

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    const settings = org?.settings_json ? (org.settings_json as any) : {};
    
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        settings_json: { ...settings, fuel_price_per_liter: price }
      }
    });

    revalidatePath("/dispatch/analytics");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateFuelPrice:", error);
    return { success: false, error: error.message || "Impossible de mettre à jour le prix du carburant." };
  }
}

// DRIVER PORTAL - Self-serve run creation
export async function createDriverRun(formData: FormData) {
  let newRunId = null;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");

    const driverId = formData.get("driverId") as string;
    if (!driverId) throw new Error("Manque l'ID chauffeur");

    const driver = await prisma.driver.findUnique({
      where: { id: driverId, organization_id: session.user.organization_id }
    });

    if (!driver) throw new Error("Chauffeur introuvable dans cette organisation");

    // Fetch first client and vehicle as fallbacks to satisfy DB schema 
    // (Driver will select the real vehicle in the next step anyway)
    const client = await prisma.client.findFirst({ where: { organization_id: session.user.organization_id } });
    const vehicle = await prisma.vehicle.findFirst({ where: { organization_id: session.user.organization_id } });

    if (!client || !vehicle) {
      throw new Error("Impossible de créer une tournée : Aucun client ou véhicule par défaut configuré dans l'organisation.");
    }

    const newRun = await prisma.dailyRun.create({
      data: {
        organization_id: session.user.organization_id,
        driver_id: driver.id,
        client_id: client.id,
        vehicle_id: vehicle.id,
        date: new Date(),
        status: 'planned',
      }
    });

    newRunId = newRun.id;
  } catch (error: any) {
    console.error("Erreur createDriverRun:", error);
    return { success: false, error: error.message };
  }

  // Redirect outside of try-catch block to avoid catching NEXT_REDIRECT error
  if (newRunId) {
    revalidatePath("/driver");
    revalidatePath("/dispatch/runs");
    redirect(`/driver/runs/${newRunId}/start`);
  }
}

// DRIVER PORTAL - Unified Form Submission
export async function saveUnifiedDelivery(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const driverId = formData.get("driverId") as string;
    const vehicleId = formData.get("vehicle_id") as string;
    const runId = formData.get("runId") as string | null;

    if (!driverId || !vehicleId) throw new Error("Chauffeur et Véhicule sont requis");

    // Extract numerical fields
    const kmStart = Number(formData.get("km_start")) || 0;
    const kmEnd = Number(formData.get("km_end")) || 0;
    const fuelLiters = Number(formData.get("fuel_liters")) || 0;
    const fuelPriceStr = formData.get("fuel_price");
    const fuelPriceInput = fuelPriceStr ? Number(fuelPriceStr) : null;
    const fuelReceiptFile = formData.get("fuel_receipt") as File | null;

    const loaded1 = Number(formData.get("client1_loaded")) || 0;
    const loaded2 = Number(formData.get("client2_loaded")) || 0;
    const returned1 = Number(formData.get("client1_returned")) || 0;
    const returned2 = Number(formData.get("client2_returned")) || 0;
    const relay = Number(formData.get("colis_relay")) || 0;
    const collected = Number(formData.get("colis_collected")) || 0;

    const totalLoaded = loaded1 + loaded2;
    const totalReturned = returned1 + returned2;
    // Client 1 / 2 Delivered is simply Loaded - Returned
    const delivered1 = loaded1 - returned1;
    const delivered2 = loaded2 - returned2;
    const totalDelivered = delivered1 + delivered2;

    const notes = "Client 1 (" + loaded1 + "C/" + delivered1 + "L/" + returned1 + "R) | Client 2 (" + loaded2 + "C/" + delivered2 + "L/" + returned2 + "R)";
    const routeNumber = formData.get("route_number") as string | null;

    const client_id = formData.get("client_id") as string | null;

    const driver = await prisma.driver.findUnique({ where: { id: driverId } });
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    let client = null;
    if (client_id) {
       client = await prisma.client.findUnique({ where: { id: client_id }, include: { rate_cards: true }});
    } else {
       client = await prisma.client.findFirst({ where: { organization_id: orgId }, include: { rate_cards: true } });
    }
    if (!client) throw new Error("Un client doit être sélectionné ou exister dans l'organisation");

    // Financial Maths Injection
    const base_flat = Number(client?.rate_cards?.[0]?.base_daily_flat || 0);
    const price_stop = Number(client?.rate_cards?.[0]?.unit_price_stop || 0);
    const price_parcel = Number(client?.rate_cards?.[0]?.unit_price_package || 0);
    const bonus_relay = Number(client?.rate_cards?.[0]?.bonus_relay_point || 0);
    
    // Revenue definition
    const billed_parcels = totalLoaded + relay;
    const revenue_calculated = base_flat + (price_stop * collected) + (price_parcel * billed_parcels) + (bonus_relay * relay);

    // Driver & Fleet Avoid Double Counting
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setUTCHours(23, 59, 59, 999);

    const priorDriverRuns = await prisma.dailyRun.count({
      where: { driver_id: driverId, date: { gte: startOfDay, lte: endOfDay }, id: runId ? { not: runId } : undefined, status: 'completed' }
    });
    const cost_driver = priorDriverRuns > 0 ? 0 : Number(driver?.daily_base_cost || 0);

    const priorVehicleRuns = await prisma.dailyRun.count({
      where: { vehicle_id: vehicleId, date: { gte: startOfDay, lte: endOfDay }, id: runId ? { not: runId } : undefined, status: 'completed' }
    });

    const base_fleet_cost = priorVehicleRuns > 0 ? 0 : (Number(vehicle?.fixed_monthly_cost || 0) + Number(vehicle?.rental_monthly_cost || 0) + Number(vehicle?.insurance_monthly_cost || 0)) / 30;
    const km_diff = Math.max(0, kmEnd - kmStart);
    const variable_fleet_cost = km_diff * Number(vehicle?.internal_cost_per_km || 0);
    const cost_vehicle = base_fleet_cost + variable_fleet_cost;
    
    // Gasoil Cost evaluation
    let cost_fuel = 0;
    let actual_fuel_price = 1.80;
    if (fuelLiters > 0) {
      const org = await prisma.organization.findUnique({ where: { id: orgId } });
      actual_fuel_price = fuelPriceInput ? fuelPriceInput : (org?.settings_json ? ((org.settings_json as any).fuel_price_per_liter || 1.80) : 1.80);
      cost_fuel = fuelLiters * actual_fuel_price;
    }
    
    const margin_net = revenue_calculated - cost_driver - cost_vehicle - cost_fuel;

    const runData = {
      organization_id: orgId,
      driver_id: driverId,
      vehicle_id: vehicleId,
      date: new Date(),
      status: 'completed',
      run_code: routeNumber, // Map Zone / Route Number input to run_code
      km_start: kmStart,
      km_end: kmEnd,
      km_total: km_diff,
      fuel_consumed_liters: fuelLiters,
      packages_loaded: totalLoaded,
      packages_returned: totalReturned,
      packages_delivered: totalDelivered,
      packages_relay: relay,
      stops_completed: collected, // using stops_completed for 'collected' in this context
      notes: notes,
      return_time: new Date(),
      revenue_calculated,
      cost_driver,
      cost_vehicle,
      cost_fuel,
      margin_net,
      client_id: client.id
    };

    let savedRun;
    
    // Persist to database
    if (runId) {
      savedRun = await prisma.dailyRun.update({
        where: { id: runId },
        data: runData
      });
    } else {
      if (!client) throw new Error("Un client doit exister dans l'organisation");
      savedRun = await prisma.dailyRun.create({
        data: {
           ...runData,
           client_id: client.id, // Mandatory on creation
        }
      });
    }

    // Synchronization of Ledger Entries
    if (savedRun) {
      let receiptUrl = null;
      if (fuelReceiptFile && fuelReceiptFile.size > 0) {
         receiptUrl = `/uploads/${orgId}/${savedRun.id}/${fuelReceiptFile.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      }

      // Find existing fuel log to preserve receipt URL if new one isn't uploaded during edit
      if (runId) {
         const existingFuelLog = await prisma.fuelLog.findFirst({ where: { run_id: runId } });
         if (existingFuelLog && !receiptUrl) receiptUrl = existingFuelLog.receipt_url;
      }

      const operations: any[] = [];

      // Clean up old ledger entries to allow clean idempotent edits
      operations.push(prisma.fuelLog.deleteMany({ where: { run_id: savedRun.id } }));
      operations.push(prisma.financialEntry.deleteMany({ 
          where: { 
             run_id: savedRun.id, 
             category: { in: ['fuel_cost', 'delivery_revenue', 'driver_cost', 'vehicle_wear_cost'] } 
          } 
      }));

      if (fuelLiters > 0) {
         operations.push(prisma.fuelLog.create({
            data: {
              organization_id: orgId,
              vehicle_id: vehicleId,
              run_id: savedRun.id,
              total_cost: cost_fuel,
              liters: fuelLiters,
              price_per_liter: actual_fuel_price,
              fueled_at: new Date(),
              receipt_url: receiptUrl,
            }
         }));
      }

      const ledgerEntries: any[] = [
          {
            organization_id: orgId,
            vehicle_id: vehicleId,
            driver_id: driverId,
            client_id: client.id,
            run_id: savedRun.id,
            entry_type: 'revenue',
            category: 'delivery_revenue',
            amount: revenue_calculated,
            entry_date: new Date(),
            description: `Chiffre d'Affaires - Tournée ${savedRun.run_code || savedRun.id}`
          },
          {
            organization_id: orgId,
            vehicle_id: vehicleId,
            driver_id: driverId,
            run_id: savedRun.id,
            entry_type: 'cost',
            category: 'driver_cost',
            amount: cost_driver,
            entry_date: new Date(),
            description: `Coût Chauffeur - Tournée ${savedRun.run_code || savedRun.id}`
          },
          {
            organization_id: orgId,
            vehicle_id: vehicleId,
            run_id: savedRun.id,
            entry_type: 'cost',
            category: 'vehicle_wear_cost',
            amount: cost_vehicle,
            entry_date: new Date(),
            description: `Coût Véhicule (fixe + km) - Tournée ${savedRun.run_code || savedRun.id}`
          }
      ];

      if (fuelLiters > 0) {
          ledgerEntries.push({
            organization_id: orgId,
            vehicle_id: vehicleId,
            run_id: savedRun.id,
            entry_type: 'cost',
            category: 'fuel_cost',
            amount: cost_fuel,
            entry_date: new Date(),
            description: `Fuel end of run ${savedRun.id}`
          });
      }

      operations.push(prisma.financialEntry.createMany({
          data: ledgerEntries
      }));

      operations.push(prisma.eventsLog.create({
          data: {
            organization_id: orgId,
            run_id: savedRun.id,
            event_type: 'run_completed',
            metadata_json: {
               km_end: kmEnd, 
               stops_completed: collected, 
               revenue_calculated, 
               cost_vehicle, 
               cost_fuel,
               cost_driver,
               margin_net
            }
          }
      }));

      await prisma.$transaction(operations);
    }

    revalidatePath("/driver");
    revalidatePath("/dispatch/runs");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur saveUnifiedDelivery:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement de la livraison" };
  }
}

// HR DOCUMENTS - Upload Document (MVP Simulation)
export async function uploadHrDocument(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const driverId = formData.get("driverId") as string;
    const documentType = formData.get("documentType") as string;
    const title = formData.get("title") as string;
    const file = formData.get("file") as File;

    if (!driverId || !documentType || !title || !file) {
      throw new Error("Veuillez fournir toutes les informations du document (fichier, titre, type).");
    }

    // Since we don't have a real file storage bucket for this MVP,
    // we simulate an upload by generating a fake URL or saving a base64 string if it's very small.
    // For large PDFs, we should just save the file name to simulate it.
    const fakeUrl = `/uploads/${orgId}/${driverId}/${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    await prisma.hrDocument.create({
      data: {
        organization_id: orgId,
        driver_id: driverId,
        document_type: documentType,
        title: title,
        file_url: fakeUrl,
      }
    });

    revalidatePath("/dispatch/hr");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur uploadHrDocument:", error);
    return { success: false, error: error.message || "Erreur lors de l'upload du document RH." };
  }
}

// HR DOCUMENTS - Delete Document
export async function deleteHrDocument(documentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const doc = await prisma.hrDocument.findUnique({
      where: { id: documentId }
    });

    if (!doc || doc.organization_id !== orgId) {
      throw new Error("Document introuvable ou vous n'avez pas les droits.");
    }

    await prisma.hrDocument.delete({
      where: { id: documentId }
    });

    revalidatePath("/dispatch/hr");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteHrDocument:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression du document." };
  }
}

// deleted old reportVehicleDamage

export async function setVehicleAppointment(vehicleId: string, date: string, nature: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.organization_id) {
    return { success: false, error: "Non autorisé" };
  }

  try {
    await prisma.vehicle.update({
      where: { id: vehicleId, organization_id: session.user.organization_id },
      data: {
        next_appointment_date: date ? new Date(date) : null,
        next_appointment_nature: nature || null,
      }
    });
    
    revalidatePath("/dispatch/runs");
    revalidatePath("/dispatch/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Failed to set vehicle appointment:", error);
    return { success: false, error: error.message || "Erreur lors de la définition du RDV." };
  }
}

/**
 * Server Action: Enregistrer une pénalité financière pour un chauffeur (RH)
 */
export async function recordDriverPenalty(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const driver_id = formData.get("driver_id") as string;
    const amount = Number(formData.get("amount"));
    const date_input = formData.get("date") as string;
    const description = formData.get("description") as string;

    if (!driver_id || isNaN(amount) || amount <= 0 || !date_input) {
      throw new Error("Veuillez remplir les informations de pénalité correctement.");
    }

    const penaltyDate = new Date(date_input);

    await prisma.$transaction(async (tx) => {
      // 1. Create a Financial Entry to deduct from company profitability / calculate driver cost
      await tx.financialEntry.create({
        data: {
          organization_id: orgId,
          driver_id: driver_id,
          entry_type: 'cost',
          category: 'penalty',
          amount: amount,
          description: `Pénalité chauffeur: ${description || 'Non précisé'}`,
          entry_date: penaltyDate
        }
      });

      // 2. Create an HR Event to display in the HR dashboard
      await tx.hrEvent.create({
        data: {
          organization_id: orgId,
          driver_id: driver_id,
          event_type: 'sanction',
          start_date: penaltyDate,
          end_date: penaltyDate,
          notes: `Pénalité financière de ${amount}€: ${description || ''}`,
          status: 'active'
        }
      });
    });

    revalidatePath("/dispatch/hr");
    revalidatePath("/dispatch/dashboard"); // Because of direction graphs
    return { success: true };
  } catch (error: any) {
    console.error("Erreur recordDriverPenalty:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement de la pénalité." };
  }
}

/**
 * Server Action: Enregistrer une absence ou un congé pour un chauffeur (RH)
 */
export async function recordDriverAbsence(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const driver_id = formData.get("driver_id") as string;
    const event_type = formData.get("event_type") as string;
    const start_date = formData.get("start_date") as string;
    const raw_end_date = formData.get("end_date") as string;
    const end_date = raw_end_date?.trim() || null;
    const notes = formData.get("notes") as string;

    if (!driver_id || !start_date || !event_type) {
      throw new Error("Veuillez remplir les informations requises.");
    }

    const newStart = new Date(start_date);
    const newEnd = end_date ? new Date(end_date) : newStart;

    if (newEnd < newStart) {
      throw new Error("La date de fin ne peut pas être antérieure à la date de début.");
    }

    // Checking for collisions
    const overlap = await prisma.hrEvent.findFirst({
      where: {
        driver_id: driver_id,
        event_type: { in: ['sick_leave', 'vacation', 'absence'] },
        OR: [
          {
            start_date: { lte: newEnd },
            end_date: { not: null, gte: newStart }
          },
          {
            end_date: null,
            start_date: { gte: newStart, lte: newEnd }
          }
        ]
      }
    });

    if (overlap) {
      throw new Error("Une absence, maladie ou congé existe déjà sur cette période pour ce chauffeur.");
    }

    await prisma.hrEvent.create({
      data: {
        organization_id: orgId,
        driver_id: driver_id,
        event_type: event_type,
        start_date: newStart,
        end_date: end_date ? new Date(end_date) : null,
        notes: notes || null,
        status: 'active'
      }
    });

    revalidatePath("/dispatch/hr");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur recordDriverAbsence:", error);
    return { success: false, error: error.message || "Erreur lors de l'enregistrement de l'absence." };
  }
}

/**
 * Server Action: Mettre à jour une absence existante (RH)
 */
export async function updateDriverAbsence(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const event_id = formData.get("event_id") as string;
    const driver_id = formData.get("driver_id") as string;
    const event_type = formData.get("event_type") as string;
    const start_date = formData.get("start_date") as string;
    const raw_end_date = formData.get("end_date") as string;
    const end_date = raw_end_date?.trim() || null;
    const notes = formData.get("notes") as string;

    if (!event_id || !driver_id || !start_date || !event_type) {
      throw new Error("Veuillez remplir les informations requises.");
    }

    const newStart = new Date(start_date);
    const newEnd = end_date ? new Date(end_date) : newStart;

    if (newEnd < newStart) {
      throw new Error("La date de fin ne peut pas être antérieure à la date de début.");
    }

    const overlap = await prisma.hrEvent.findFirst({
      where: {
        id: { not: event_id },
        driver_id: driver_id,
        event_type: { in: ['sick_leave', 'vacation', 'absence'] },
        OR: [
          {
            start_date: { lte: newEnd },
            end_date: { not: null, gte: newStart }
          },
          {
            end_date: null,
            start_date: { gte: newStart, lte: newEnd }
          }
        ]
      }
    });

    if (overlap) {
      throw new Error("Une autre absence existe déjà sur cette période pour ce chauffeur.");
    }

    await prisma.hrEvent.updateMany({
      where: { id: event_id, organization_id: orgId },
      data: {
        event_type,
        start_date: newStart,
        end_date: end_date ? new Date(end_date) : null,
        notes: notes || null
      }
    });

    revalidatePath("/dispatch/hr");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateDriverAbsence:", error);
    return { success: false, error: error.message || "Erreur lors de la modification de l'absence." };
  }
}

/**
 * Server Action: Supprimer (Annuler) une absence existante (RH)
 */
export async function deleteDriverAbsence(eventId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    if (!eventId) throw new Error("ID de l'événement manquant.");

    await prisma.hrEvent.deleteMany({
      where: {
        id: eventId,
        organization_id: orgId
      }
    });

    revalidatePath("/dispatch/hr");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteDriverAbsence:", error);
    return { success: false, error: error.message || "Erreur lors de la suppression de l'événement." };
  }
}

/**
 * Server Action: Obtenir l'historique financier et les totaux d'un chauffeur
 */
export async function getDriverFinancialHistory(driverId: string, filterStr?: string, fromStr?: string, toStr?: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    let startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    let endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (fromStr && toStr) {
       startDate = new Date(fromStr);
       endDate = new Date(toStr);
    } else {
       const activeFilter = filterStr || 'daily';
       const today = new Date();
       today.setHours(0, 0, 0, 0);
       if (activeFilter === 'weekly') {
          startDate.setDate(today.getDate() - 6);
       } else if (activeFilter === 'monthly') {
          startDate.setDate(today.getDate() - 29);
       }
    }

    // 1. Get total Pay and Fleet costs from completed runs
    const runs = await prisma.dailyRun.findMany({
      where: { 
        organization_id: orgId, 
        driver_id: driverId, 
        status: 'completed',
        date: { gte: startDate, lte: endDate }
      },
      select: { id: true, date: true, cost_driver: true, cost_vehicle: true, cost_fuel: true, revenue_calculated: true }
    });
    
    const totalPay = runs.reduce((sum, run) => sum + Number(run.cost_driver || 0), 0);
    const totalFleetCost = runs.reduce((sum, run) => sum + Number(run.cost_vehicle || 0) + Number(run.cost_fuel || 0), 0);
    const totalRevenue = runs.reduce((sum, run) => sum + Number(run.revenue_calculated || 0), 0);

    // 2. Get Damages and Penalties from FinancialEntries
    const finances = await prisma.financialEntry.findMany({
      where: { 
        organization_id: orgId, 
        driver_id: driverId,
        entry_date: { gte: startDate, lte: endDate }
      },
      orderBy: { entry_date: 'desc' }
    });

    const totalDamages = finances
      .filter(f => f.category === 'damage_cost')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);
      
    const totalPenalties = finances
      .filter(f => f.category === 'penalty')
      .reduce((sum, f) => sum + Number(f.amount || 0), 0);

    // 3. Get Absences from HrEvent
    const hrEvents = await prisma.hrEvent.findMany({
      where: {
        organization_id: orgId,
        driver_id: driverId,
        start_date: { lte: endDate },
        OR: [
          { end_date: { gte: startDate } },
          { end_date: null }
        ],
        status: 'active'
      },
      include: { driver: true }
    });

    let totalAbsenceDays = 0;
    let totalAbsenceCost = 0;
    let unjustifiedAbsenceDays = 0;
    let sickLeaveDays = 0;
    let vacationDays = 0;

    hrEvents.forEach(evt => {
      const evtStart = evt.start_date < startDate ? startDate : evt.start_date;
      const evtEnd = evt.end_date ? (evt.end_date > endDate ? endDate : evt.end_date) : endDate;
      const diffTime = evtEnd.getTime() - evtStart.getTime();
      const days = diffTime >= 0 ? Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1 : 0;
      
      totalAbsenceDays += days;
      
      if (evt.event_type === 'absence') unjustifiedAbsenceDays += days;
      if (evt.event_type === 'sick_leave') sickLeaveDays += days;
      if (evt.event_type === 'vacation') vacationDays += days;

      // If it's sick_leave or vacation, we assume the company still bears the daily cost of the driver
      if (evt.event_type === 'sick_leave' || evt.event_type === 'vacation') {
         const driverDailyCost = Number(evt.driver?.daily_base_cost || 0);
         totalAbsenceCost += days * driverDailyCost;
      }
    });

    const totalCompanyCost = totalPay + totalFleetCost + totalDamages + totalPenalties + totalAbsenceCost;
    const finalNetMargin = totalRevenue - totalCompanyCost;
    
    // Unique days worked
    const presentDays = new Set(runs.map(r => r.date.toISOString().split('T')[0])).size;
    const vacationBalance = 25 - vacationDays; // Mocked 25-day standard balance

    // Last 5 runs for the UI
    const recentRuns = await prisma.dailyRun.findMany({
      where: { 
        organization_id: orgId, 
        driver_id: driverId,
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'desc' },
      take: 5,
      include: {
        vehicle: { select: { plate_number: true } },
        client: { select: { name: true } }
      }
    });

    return { 
      success: true, 
      data: {
        totalRevenue,
        finalNetMargin,
        totalPay,
        totalFleetCost,
        totalDamages,
        totalPenalties,
        totalAbsenceCost,
        totalAbsenceDays,
        unjustifiedAbsenceDays,
        sickLeaveDays,
        vacationDays,
        presentDays,
        vacationBalance: vacationBalance > 0 ? vacationBalance : 0,
        totalCompanyCost,
        recentRuns: recentRuns.map(r => ({
          ...r,
          revenue_calculated: Number(r.revenue_calculated || 0),
          cost_driver: Number(r.cost_driver || 0),
          cost_vehicle: Number(r.cost_vehicle || 0),
          cost_fuel: Number(r.cost_fuel || 0),
          cost_other: Number(r.cost_other || 0),
          total_cost: Number(r.total_cost || 0),
          margin_net: Number(r.margin_net || 0),
          fuel_consumed_liters: Number(r.fuel_consumed_liters || 0),
          productivity_index: r.productivity_index ? Number(r.productivity_index) : null,
          penalty_risk_score: r.penalty_risk_score ? Number(r.penalty_risk_score) : null,
          sst_score: r.sst_score ? Number(r.sst_score) : null,
        })),
        financialEntries: finances.slice(0, 10).map(f => ({
          ...f,
          amount: Number(f.amount || 0)
        })),
        hrEvents: hrEvents.map(e => ({
          ...e,
          driver: e.driver ? {
            ...e.driver,
            daily_base_cost: Number(e.driver.daily_base_cost || 0),
            hourly_cost: e.driver.hourly_cost ? Number(e.driver.hourly_cost) : null,
            quality_rating: Number(e.driver.quality_rating || 0),
            performance_score: Number(e.driver.performance_score || 0),
          } : null
        }))
      }
    };
  } catch (error: any) {
    console.error("Erreur getDriverFinancialHistory:", error);
    return { success: false, error: "Impossible de récupérer l'historique du chauffeur." };
  }
}

/**
 * Server Action: Update Global Settings
 */
export async function updateGlobalSettings(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const org = await prisma.organization.findUnique({ where: { id: orgId } });
    if (!org) throw new Error("Organisation introuvable.");

    const currentSettings = (org.settings_json as any) || {};

    const updatedSettings = {
      ...currentSettings,
      cost_rent: Number(formData.get("cost_rent")) || 0,
      cost_office_salaries: Number(formData.get("cost_office_salaries")) || 0,
      cost_admin_vehicles: Number(formData.get("cost_admin_vehicles")) || 0,
      cost_software: Number(formData.get("cost_software")) || 0,
      cost_insurances: Number(formData.get("cost_insurances")) || 0,
      cost_fees: Number(formData.get("cost_fees")) || 0,
      cost_others: Number(formData.get("cost_others")) || 0,
      fuel_price_per_km: Number(formData.get("fuel_price_per_km")) || 0.18,
      fuel_price_per_liter: Number(formData.get("fuel_price_per_liter")) || 1.80,
    };

    const monthly_total_fixed_costs = 
      updatedSettings.cost_rent + 
      updatedSettings.cost_office_salaries + 
      updatedSettings.cost_admin_vehicles + 
      updatedSettings.cost_software + 
      updatedSettings.cost_insurances + 
      updatedSettings.cost_fees + 
      updatedSettings.cost_others;

    updatedSettings.monthly_total_fixed_costs = monthly_total_fixed_costs;

    await prisma.organization.update({
      where: { id: orgId },
      data: { settings_json: updatedSettings }
    });

    revalidatePath("/dispatch/settings");
    revalidatePath("/dispatch/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateGlobalSettings:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour." };
  }
}

/**
 * Server Action: Update Tariffs
 */
export async function updateTariffs(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const client = await prisma.client.findFirst({
      where: { organization_id: orgId },
      include: { rate_cards: true }
    });

    if (!client) throw new Error("Client introuvable.");

    const unit_price_package = Number(formData.get("unit_price_package")) || 0;
    const bonus_relay_point = Number(formData.get("bonus_relay_point")) || 0;
    const unit_price_stop = Number(formData.get("unit_price_stop")) || 0;
    const base_daily_flat = Number(formData.get("base_daily_flat")) || 0;

    let targetRateCardId;
    if (client.rate_cards && client.rate_cards.length > 0) {
      targetRateCardId = client.rate_cards[0].id;
      await prisma.rateCard.update({
        where: { id: targetRateCardId },
        data: {
          unit_price_package,
          bonus_relay_point,
          unit_price_stop,
          base_daily_flat
        }
      });
    } else {
      await prisma.rateCard.create({
        data: {
          organization_id: orgId,
          client_id: client.id,
          name: "Tarif par défaut",
          unit_price_package,
          bonus_relay_point,
          unit_price_stop,
          base_daily_flat
        }
      });
    }

    revalidatePath("/dispatch/settings");
    revalidatePath("/dispatch/runs");
    revalidatePath("/driver");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateTariffs:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour." };
  }
}

export async function createClient(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const name = formData.get("name") as string;
    const client_code = formData.get("client_code") as string || null;
    const billing_contact_email = formData.get("billing_contact_email") as string || null;

    if (!name) throw new Error("Le nom du client est requis.");

    const newClient = await prisma.client.create({
      data: {
        organization_id: orgId,
        name,
        client_code,
        billing_contact_email,
        status: "active"
      }
    });

    await prisma.rateCard.create({
      data: {
        organization_id: orgId,
        client_id: newClient.id,
        name: "Tarif standard " + name,
        base_daily_flat: 0,
        unit_price_stop: 0,
        unit_price_package: 0,
        bonus_relay_point: 0
      }
    });

    revalidatePath("/dispatch/runs");
    return { success: true, clientId: newClient.id };
  } catch (error: any) {
    console.error("Erreur createClient:", error);
    return { success: false, error: error.message || "Erreur serveur" };
  }
}

export async function createZone(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const name = formData.get("name") as string;
    const code = formData.get("code") as string || null;
    const zone_type = formData.get("zone_type") as string || "urban";

    if (!name) throw new Error("Le nom de la zone est requis.");

    const newZone = await prisma.zone.create({
      data: {
        organization_id: orgId,
        name,
        code,
        zone_type,
        status: "active"
      }
    });

    revalidatePath("/dispatch/runs");
    return { success: true, zoneId: newZone.id };
  } catch (error: any) {
    console.error("Erreur createZone:", error);
    return { success: false, error: error.message || "Erreur serveur" };
  }
}

export async function deleteClient(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const client_id = formData.get("client_id") as string;
    if (!client_id) throw new Error("ID du client requis.");

    // Optionally check if runs exist
    const runsCount = await prisma.dailyRun.count({ where: { client_id } });
    if (runsCount > 0) {
      throw new Error("Impossible de supprimer ce client car des tournées lui sont associées.");
    }

    await prisma.client.delete({
      where: { id: client_id, organization_id: orgId }
    });

    revalidatePath("/dispatch/runs");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteClient:", error);
    return { success: false, error: error.message || "Erreur serveur" };
  }
}

export async function deleteZone(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé");
    const orgId = session.user.organization_id;

    const zone_id = formData.get("zone_id") as string;
    if (!zone_id) throw new Error("ID de la zone requis.");

    const runsCount = await prisma.dailyRun.count({ where: { zone_id } });
    if (runsCount > 0) {
      throw new Error("Impossible de supprimer cette zone car des tournées lui sont associées.");
    }

    await prisma.zone.delete({
      where: { id: zone_id, organization_id: orgId }
    });

    revalidatePath("/dispatch/runs");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur deleteZone:", error);
    return { success: false, error: error.message || "Erreur serveur" };
  }
}

/**
 * Server Action: Update Daily Run (Mid-day metric updates & Admin Edition)
 */
export async function updateRun(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const runId = formData.get("runId") as string;
    if (!runId) throw new Error("ID de tournée manquant.");

    const formDriverId = formData.get("driver_id") as string | undefined;
    const formVehicleId = formData.get("vehicle_id") as string | undefined;
    const formStatus = formData.get("status") as string | undefined;
    
    const run = await prisma.dailyRun.findUnique({
      where: { id: runId, organization_id: orgId },
      include: { 
         driver: true, 
         vehicle: true, 
         client: { include: { rate_cards: true } }
      }
    });

    if (!run) throw new Error("Tournée introuvable.");

    const final_status = formStatus || run.status;
    const final_packages_loaded = formData.has("packages_loaded") ? Number(formData.get("packages_loaded")) : Number(run.packages_loaded || 0);
    const final_packages_delivered = formData.has("packages_delivered") ? Number(formData.get("packages_delivered")) : Number(run.packages_delivered || 0);
    const final_packages_returned = formData.has("packages_returned") ? Number(formData.get("packages_returned")) : Number(run.packages_returned || 0);
    const final_packages_advised_direct = formData.has("packages_advised_direct") ? Number(formData.get("packages_advised_direct")) : Number(run.packages_advised_direct || 0);
    const final_packages_advised_relay = formData.has("packages_advised_relay") ? Number(formData.get("packages_advised_relay")) : Number(run.packages_advised_relay || 0);
    const final_advised_total = final_packages_advised_direct + final_packages_advised_relay;
    
    const final_km_start = formData.has("km_start") ? Number(formData.get("km_start")) : Number(run.km_start || 0);
    const final_km_end = formData.has("km_end") ? Number(formData.get("km_end")) : Number(run.km_end || 0);
    const km_diff = Math.max(0, final_km_end - final_km_start);

    const dataToUpdate: any = {
       driver_id: formDriverId || undefined,
       vehicle_id: formVehicleId || undefined,
       status: formStatus || undefined,
       packages_loaded: final_packages_loaded,
       packages_delivered: final_packages_delivered,
       packages_returned: final_packages_returned,
       packages_advised_direct: final_packages_advised_direct,
       packages_advised_relay: final_packages_advised_relay,
       packages_advised: final_advised_total,
       km_start: final_km_start,
       km_end: final_km_end,
       km_total: km_diff
    };

    let operations: any[] = [];

    if (final_status === 'completed') {
       // --- FINANCIAL RECALCULATION FOR ADMIN EDITS ---
       const rateCard = run.rate_card_id ? 
             await prisma.rateCard.findUnique({ where: { id: run.rate_card_id } }) : 
             run.client?.rate_cards?.[0];

       const base_flat = Number(rateCard?.base_daily_flat || 0);
       const price_stop = Number(rateCard?.unit_price_stop || 0);
       const price_parcel = Number(rateCard?.unit_price_package || 0);
       const bonus_relay = Number(rateCard?.bonus_relay_point || 0);

       const activeDriverId = formDriverId || run.driver_id;
       const activeVehicleId = formVehicleId || run.vehicle_id;

       const activeDriver = formDriverId && formDriverId !== run.driver_id ? await prisma.driver.findUnique({ where: { id: formDriverId } }) : run.driver;
       const activeVehicle = formVehicleId && formVehicleId !== run.vehicle_id ? await prisma.vehicle.findUnique({ where: { id: formVehicleId } }) : run.vehicle;

       const billed_parcels = final_packages_loaded + final_packages_advised_relay;
       const stops_completed = Number(run.stops_completed || 0); 

       const revenue_calculated = base_flat + (price_stop * stops_completed) + (price_parcel * billed_parcels) + (bonus_relay * final_packages_advised_relay);

       const startOfDay = new Date(run.date);
       startOfDay.setUTCHours(0, 0, 0, 0);
       const endOfDay = new Date(run.date);
       endOfDay.setUTCHours(23, 59, 59, 999);

       const priorDriverRuns = await prisma.dailyRun.count({
          where: { driver_id: activeDriverId, date: { gte: startOfDay, lte: endOfDay }, id: { not: runId }, status: 'completed' }
       });
       const cost_driver = priorDriverRuns > 0 ? 0 : Number(activeDriver?.daily_base_cost || 0);

       const priorVehicleRuns = await prisma.dailyRun.count({
          where: { vehicle_id: activeVehicleId, date: { gte: startOfDay, lte: endOfDay }, id: { not: runId }, status: 'completed' }
       });
       const base_fleet_cost = priorVehicleRuns > 0 ? 0 : (Number(activeVehicle?.fixed_monthly_cost || 0) + Number(activeVehicle?.rental_monthly_cost || 0) + Number(activeVehicle?.insurance_monthly_cost || 0)) / 30;
       const variable_fleet_cost = km_diff * Number(activeVehicle?.internal_cost_per_km || 0);
       const cost_vehicle = base_fleet_cost + variable_fleet_cost;

       const cost_fuel = Number(run.cost_fuel || 0); 
       const margin_net = revenue_calculated - cost_driver - cost_vehicle - cost_fuel;

       dataToUpdate.revenue_calculated = revenue_calculated;
       dataToUpdate.cost_driver = cost_driver;
       dataToUpdate.cost_vehicle = cost_vehicle;
       dataToUpdate.margin_net = margin_net;
       dataToUpdate.return_time = run.return_time || new Date();

       // Synchronize Ledger Entries
       operations.push(prisma.financialEntry.deleteMany({
          where: { 
             run_id: runId, 
             category: { in: ['delivery_revenue', 'driver_cost', 'vehicle_wear_cost'] } 
          }
       }));

       operations.push(prisma.financialEntry.createMany({
          data: [
            {
               organization_id: orgId,
               vehicle_id: activeVehicleId,
               driver_id: activeDriverId,
               client_id: run.client_id,
               run_id: runId,
               entry_type: 'revenue',
               category: 'delivery_revenue',
               amount: revenue_calculated,
               entry_date: run.return_time || new Date(),
               description: `CA Modifié - Tournée ${run.run_code || runId}`
            },
            {
               organization_id: orgId,
               vehicle_id: activeVehicleId,
               driver_id: activeDriverId,
               run_id: runId,
               entry_type: 'cost',
               category: 'driver_cost',
               amount: cost_driver,
               entry_date: run.return_time || new Date(),
               description: `Coût Modifié Chauffeur - Tournée ${run.run_code || runId}`
            },
            {
               organization_id: orgId,
               vehicle_id: activeVehicleId,
               run_id: runId,
               entry_type: 'cost',
               category: 'vehicle_wear_cost',
               amount: cost_vehicle,
               entry_date: run.return_time || new Date(),
               description: `Coût Véhicule (fixe+km) - Tournée ${run.run_code || runId}`
            }
          ]
       }));
    }

    operations.push(prisma.dailyRun.update({
      where: { id: runId },
      data: dataToUpdate
    }));

    await prisma.$transaction(operations);

    revalidatePath("/dispatch/dashboard");
    revalidatePath("/dispatch/runs");
    
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateRun:", error);
    return { success: false, error: error.message || "Erreur serveur" };
  }
}

/**
 * Server Action: Update Vehicle
 */
export async function updateVehicle(formData: FormData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    const vehicleId = formData.get("vehicleId") as string;
    const plateNumber = formData.get("plate_number") as string;
    const category = formData.get("category") as string;
    const status = formData.get("status") as string;
    const currentKmInput = formData.get("current_km");
    const currentKm = currentKmInput ? Number(currentKmInput) : undefined;
    const ownershipType = formData.get("ownership_type") as string;
    const lessorName = formData.get("lessor_name") as string;
    
    // Convert costs correctly natively handling commas
    const parseNumber = (val: any) => {
      if (!val) return 0;
      const cleanVal = String(val).replace(',', '.');
      const num = Number(cleanVal);
      return isNaN(num) ? 0 : num;
    };
    
    const fixedCostInput = formData.get("fixed_monthly_cost");
    const rentalCostInput = formData.get("rental_monthly_cost");
    const insuranceCostInput = formData.get("insurance_monthly_cost");
    const internalCostPerKmInput = formData.get("internal_cost_per_km");
    
    const fixedCost = parseNumber(fixedCostInput);
    const rentalCost = parseNumber(rentalCostInput);
    const insuranceCost = parseNumber(insuranceCostInput);
    const internalCostPerKm = parseNumber(internalCostPerKmInput);

    if (!vehicleId || !plateNumber) {
      throw new Error("L'identifiant du véhicule et la plaque sont requis.");
    }

    await prisma.vehicle.update({
      where: { id: vehicleId, organization_id: orgId },
      data: {
        plate_number: plateNumber,
        category: category || null,
        status: status || undefined,
        current_km: currentKm,
        ownership_type: ownershipType || "owned",
        lessor_name: ownershipType === "rented" ? lessorName || null : null,
        fixed_monthly_cost: ownershipType === "owned" ? fixedCost : 0,
        rental_monthly_cost: ownershipType === "rented" ? rentalCost : 0,
        insurance_monthly_cost: insuranceCost,
        internal_cost_per_km: internalCostPerKm,
      } as any
    });

    revalidatePath("/dispatch/runs");
    revalidatePath("/dispatch/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur updateVehicle:", error);
    return { success: false, error: error.message || "Erreur lors de la mise à jour." };
  }
}

/**
 * Server Action: Archive Vehicle
 */
export async function archiveVehicle(vehicleId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.organization_id) throw new Error("Non autorisé.");
    const orgId = session.user.organization_id;

    if (!vehicleId) throw new Error("ID du véhicule manquant.");

    await prisma.vehicle.update({
      where: { id: vehicleId, organization_id: orgId },
      data: { status: "archived" }
    });

    revalidatePath("/dispatch/runs");
    revalidatePath("/dispatch/dashboard");
    return { success: true };
  } catch (error: any) {
    console.error("Erreur archiveVehicle:", error);
    return { success: false, error: error.message || "Erreur lors de l'archivage." };
  }
}
