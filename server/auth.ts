import bcrypt from "bcryptjs";
import session from "express-session";
import connectPg from "connect-pg-simple";
import type { Express, Request, Response, NextFunction } from "express";
import { db } from "./db";
import { users } from "@shared/models/auth";
import { eq, or } from "drizzle-orm";
import { authRateLimit } from "./rate-limit";

declare module "express-session" {
  interface SessionData {
    userId: string;
  }
}

export interface AuthenticatedRequest extends Request {
  userId?: string;
}

function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value: string): string {
  let digits = value.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+27")) {
    digits = "0" + digits.slice(3);
  } else if (digits.startsWith("27") && digits.length === 11) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}

function isPhone(value: string): boolean {
  const normalized = normalizePhone(value);
  return /^0\d{9}$/.test(normalized);
}

export function setupSession(app: Express) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });

  app.set("trust proxy", 1);
  app.use(
    session({
      secret: process.env.SESSION_SECRET!,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: sessionTtl,
      },
    })
  );
}

export const isAuthenticated = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.userId = req.session.userId;
  next();
};

function userResponse(user: any) {
  return {
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,
    firstName: user.firstName,
    lastName: user.lastName,
  };
}

export function registerAuthRoutes(app: Express) {
  app.post("/api/auth/register", authRateLimit, async (req: Request, res: Response) => {
    try {
      const { email, phone, password, firstName, lastName } = req.body;

      if (!email && !phone) {
        return res.status(400).json({ error: "Email or mobile number is required" });
      }

      if (!password) {
        return res.status(400).json({ error: "Password is required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      const normalizedEmail = email ? email.toLowerCase().trim() : null;
      const normalizedPhone = phone ? normalizePhone(phone.trim()) : null;

      if (normalizedEmail && !isEmail(normalizedEmail)) {
        return res.status(400).json({ error: "Please enter a valid email address" });
      }

      if (normalizedPhone && !isPhone(normalizedPhone)) {
        return res.status(400).json({ error: "Please enter a valid South African mobile number (e.g. 071 234 5678)" });
      }

      const conditions = [];
      if (normalizedEmail) conditions.push(eq(users.email, normalizedEmail));
      if (normalizedPhone) conditions.push(eq(users.phone, normalizedPhone));

      if (conditions.length > 0) {
        const existing = await db.select().from(users).where(
          conditions.length === 1 ? conditions[0] : or(...conditions)
        );
        if (existing.length > 0) {
          const match = existing[0];
          if (normalizedEmail && match.email === normalizedEmail) {
            return res.status(409).json({ error: "An account with this email already exists" });
          }
          if (normalizedPhone && match.phone === normalizedPhone) {
            return res.status(409).json({ error: "An account with this mobile number already exists" });
          }
        }
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const [user] = await db
        .insert(users)
        .values({
          email: normalizedEmail,
          phone: normalizedPhone,
          passwordHash,
          firstName: firstName || null,
          lastName: lastName || null,
        })
        .returning();

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json(userResponse(user));
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  });

  app.post("/api/auth/login", authRateLimit, async (req: Request, res: Response) => {
    try {
      const { identifier, password } = req.body;

      if (!identifier || !password) {
        return res.status(400).json({ error: "Email/mobile number and password are required" });
      }

      const trimmed = identifier.trim();
      let user;

      if (isEmail(trimmed)) {
        const results = await db.select().from(users).where(eq(users.email, trimmed.toLowerCase()));
        user = results[0];
      } else {
        const normalized = normalizePhone(trimmed);
        if (isPhone(normalized)) {
          const results = await db.select().from(users).where(eq(users.phone, normalized));
          user = results[0];
        }
      }

      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      req.session.userId = user.id;
      req.session.save((err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to create session" });
        }
        res.json(userResponse(user));
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/user", async (req: Request, res: Response) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    try {
      const [user] = await db.select().from(users).where(eq(users.id, req.session.userId));
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(userResponse(user));
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
}
