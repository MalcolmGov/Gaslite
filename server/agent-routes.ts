import bcrypt from "bcryptjs";
import type { Express, Response, NextFunction } from "express";
import { storage } from "./storage";
import { isAuthenticated, normalizePhone, isPhone, isEmail, type AuthenticatedRequest } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/models/auth";
import type { DriverApplication } from "@shared/schema";

const DEFAULT_DRIVER_ONBOARD_COMMISSION = "250";
const DEFAULT_CUSTOMER_FIRST_ORDER_COMMISSION = "50";

async function generateAgentCode(): Promise<string> {
  for (let i = 0; i < 10; i++) {
    const code = "AG-" + Math.random().toString(36).substring(2, 7).toUpperCase();
    const existing = await storage.getAgentByReferralCode(code);
    if (!existing) return code;
  }
  throw new Error("Could not generate a unique agent code");
}

// Called when admin approves an agent-submitted driver application
export async function createDriverOnboardCommission(application: DriverApplication) {
  if (!application.submittedByAgentId) return;
  const existing = await storage.getCommissionByApplication(application.id);
  if (existing) return;
  const amount = (await storage.getAppSetting("commission_driver_onboard")) || DEFAULT_DRIVER_ONBOARD_COMMISSION;
  await storage.createCommission({
    agentId: application.submittedByAgentId,
    type: "driver_onboard",
    amount,
    driverApplicationId: application.id,
    description: `Driver onboarded: ${application.firstName} ${application.lastName}`,
  });
}

// Called when an order reaches "delivered" — pays the agent who referred the customer, once
export async function maybeCreateReferralCommission(customerId: string) {
  const profile = await storage.getUserProfile(customerId);
  if (!profile?.referredByAgentId) return;
  const existing = await storage.getFirstOrderCommissionForCustomer(customerId);
  if (existing) return;
  const amount = (await storage.getAppSetting("commission_customer_first_order")) || DEFAULT_CUSTOMER_FIRST_ORDER_COMMISSION;
  const name = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "customer";
  await storage.createCommission({
    agentId: profile.referredByAgentId,
    type: "customer_first_order",
    amount,
    referredUserId: customerId,
    description: `First order delivered for referred customer: ${name}`,
  });
}

async function getAgentStats(agentId: string) {
  const [onboards, referredCustomers, commissions] = await Promise.all([
    storage.getDriverApplicationsByAgent(agentId),
    storage.getReferredCustomerCount(agentId),
    storage.getCommissionsByAgent(agentId),
  ]);
  const sum = (status: string) =>
    commissions
      .filter((c) => c.status === status)
      .reduce((total, c) => total + parseFloat(c.amount), 0);
  return {
    onboards: {
      total: onboards.length,
      pending: onboards.filter((a) => a.status === "pending").length,
      approved: onboards.filter((a) => a.status === "approved").length,
      rejected: onboards.filter((a) => a.status === "rejected").length,
    },
    referredCustomers,
    earnings: {
      pending: sum("pending"),
      paid: sum("paid"),
    },
  };
}

export function registerAgentRoutes(app: Express) {
  const isAgent = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await storage.getUserProfile(req.userId!);
      if (!profile || profile.role !== "agent") {
        return res.status(403).json({ error: "Agent access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization failed" });
    }
  };

  const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const profile = await storage.getUserProfile(req.userId!);
      if (!profile || profile.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization failed" });
    }
  };

  // Complete agent signup: turns a freshly registered user into an active agent
  app.post("/api/onboarding/agent", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { firstName, lastName, phone } = req.body;

      if (!firstName || !lastName || !phone) {
        return res.status(400).json({ error: "Name, surname and mobile number are required" });
      }

      const existingAgent = await storage.getAgentByUserId(userId);
      if (existingAgent) {
        return res.json({ agent: existingAgent });
      }

      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ userId, role: "agent" });
      }
      await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        phone: normalizePhone(phone),
        role: "agent",
        onboardingCompleted: true,
      });

      const agent = await storage.createAgent({
        userId,
        referralCode: await generateAgentCode(),
        active: true,
      });

      res.json({ agent });
    } catch (error) {
      console.error("Agent onboarding error:", error);
      res.status(500).json({ error: "Failed to set up your agent account" });
    }
  });

  app.get("/api/agent/me", isAuthenticated, isAgent, async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await storage.getAgentByUserId(req.userId!);
      if (!agent) {
        return res.status(404).json({ error: "Agent record not found" });
      }
      const stats = await getAgentStats(agent.id);
      res.json({ agent, stats });
    } catch (error) {
      res.status(500).json({ error: "Failed to load agent profile" });
    }
  });

  // Agent onboards a driver end-to-end: creates the driver's login + application in one go
  app.post("/api/agent/onboard-driver", isAuthenticated, isAgent, async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await storage.getAgentByUserId(req.userId!);
      if (!agent) {
        return res.status(404).json({ error: "Agent record not found" });
      }
      if (!agent.active) {
        return res.status(403).json({ error: "Your agent account is not active. Please contact Gaslite." });
      }

      const { firstName, lastName, phone, password, email, address, licenseNumber, vehicleRegistration, licenseDocumentUrl, vehicleDocumentUrl } = req.body;

      if (!firstName || !lastName || !phone || !password || !address || !licenseNumber || !vehicleRegistration) {
        return res.status(400).json({ error: "Please fill in all the required fields" });
      }
      if (password.length < 6) {
        return res.status(400).json({ error: "The driver's password must be at least 6 characters" });
      }

      const normalizedPhone = normalizePhone(String(phone).trim());
      if (!isPhone(normalizedPhone)) {
        return res.status(400).json({ error: "Please enter a valid South African mobile number (e.g. 071 234 5678)" });
      }

      const normalizedEmail = email ? String(email).toLowerCase().trim() : null;
      if (normalizedEmail && !isEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address, or leave it blank" });
      }

      const [existingUser] = await db.select().from(users).where(eq(users.phone, normalizedPhone));
      if (existingUser) {
        return res.status(409).json({ error: "This mobile number already has a Gaslite account. The driver can sign in and apply themselves, or contact Gaslite support." });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const [driverUser] = await db
        .insert(users)
        .values({
          phone: normalizedPhone,
          email: normalizedEmail,
          passwordHash,
          firstName,
          lastName,
        })
        .returning();

      const application = await storage.createDriverApplication({
        userId: driverUser.id,
        firstName,
        lastName,
        email: normalizedEmail || "",
        phone: normalizedPhone,
        address,
        licenseNumber,
        vehicleRegistration,
        licenseDocumentUrl: licenseDocumentUrl || null,
        vehicleDocumentUrl: vehicleDocumentUrl || null,
        submittedByAgentId: agent.id,
      });

      await storage.createUserProfile({
        userId: driverUser.id,
        role: "customer",
        firstName,
        lastName,
        phone: normalizedPhone,
        address,
        onboardingCompleted: true,
      });

      res.json({ application, message: "Driver submitted! Gaslite will review the application." });
    } catch (error) {
      console.error("Agent driver onboarding error:", error);
      res.status(500).json({ error: "Failed to submit the driver. Please try again." });
    }
  });

  app.get("/api/agent/onboards", isAuthenticated, isAgent, async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await storage.getAgentByUserId(req.userId!);
      if (!agent) return res.status(404).json({ error: "Agent record not found" });
      const applications = await storage.getDriverApplicationsByAgent(agent.id);
      res.json(applications.map((a) => ({
        id: a.id,
        firstName: a.firstName,
        lastName: a.lastName,
        phone: a.phone,
        status: a.status,
        createdAt: a.createdAt,
      })));
    } catch (error) {
      res.status(500).json({ error: "Failed to load your onboarded drivers" });
    }
  });

  app.get("/api/agent/commissions", isAuthenticated, isAgent, async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await storage.getAgentByUserId(req.userId!);
      if (!agent) return res.status(404).json({ error: "Agent record not found" });
      const commissions = await storage.getCommissionsByAgent(agent.id);
      const stats = await getAgentStats(agent.id);
      res.json({ commissions, earnings: stats.earnings });
    } catch (error) {
      res.status(500).json({ error: "Failed to load your earnings" });
    }
  });

  app.patch("/api/agent/bank", isAuthenticated, isAgent, async (req: AuthenticatedRequest, res) => {
    try {
      const agent = await storage.getAgentByUserId(req.userId!);
      if (!agent) return res.status(404).json({ error: "Agent record not found" });
      const { bankName, branchCode, accountNumber, accountType } = req.body;
      const updated = await storage.updateAgent(agent.id, {
        bankName: bankName || null,
        branchCode: branchCode || null,
        accountNumber: accountNumber || null,
        accountType: accountType || null,
      });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to save your bank details" });
    }
  });

  // ---- Admin: agent visibility + payouts ----

  app.get("/api/admin/agents", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const allAgents = await storage.getAgents();
      const result = await Promise.all(allAgents.map(async (agent) => {
        const [user] = await db.select().from(users).where(eq(users.id, agent.userId));
        const profile = await storage.getUserProfile(agent.userId);
        const stats = await getAgentStats(agent.id);
        return {
          ...agent,
          firstName: profile?.firstName || user?.firstName || null,
          lastName: profile?.lastName || user?.lastName || null,
          phone: profile?.phone || user?.phone || null,
          email: user?.email || null,
          stats,
        };
      }));
      res.json(result);
    } catch (error) {
      console.error("Admin agents error:", error);
      res.status(500).json({ error: "Failed to fetch agents" });
    }
  });

  app.get("/api/admin/agents/:agentId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const agent = await storage.getAgent(String(req.params.agentId));
      if (!agent) return res.status(404).json({ error: "Agent not found" });
      const [onboards, commissions, stats] = await Promise.all([
        storage.getDriverApplicationsByAgent(agent.id),
        storage.getCommissionsByAgent(agent.id),
        getAgentStats(agent.id),
      ]);
      res.json({ agent, onboards, commissions, stats });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch agent detail" });
    }
  });

  app.patch("/api/admin/agents/:agentId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { active } = req.body;
      if (typeof active !== "boolean") {
        return res.status(400).json({ error: "active must be true or false" });
      }
      const updated = await storage.updateAgent(String(req.params.agentId), { active });
      if (!updated) return res.status(404).json({ error: "Agent not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update agent" });
    }
  });

  app.post("/api/admin/commissions/mark-paid", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { commissionIds } = req.body;
      if (!Array.isArray(commissionIds) || commissionIds.length === 0) {
        return res.status(400).json({ error: "commissionIds is required" });
      }
      const updatedCount = await storage.markCommissionsPaid(commissionIds, req.userId!);
      res.json({ updatedCount });
    } catch (error) {
      res.status(500).json({ error: "Failed to mark commissions as paid" });
    }
  });
}
