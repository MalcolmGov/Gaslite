import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, seedProducts } from "./storage";
import { setupAuth, isAuthenticated } from "./replit_integrations/auth/replitAuth";

interface AuthenticatedRequest extends Request {
  user?: {
    claims?: {
      sub: string;
      email?: string;
      first_name?: string;
      last_name?: string;
    };
  };
}
import multer from "multer";
import { ObjectStorageService } from "./replit_integrations/object_storage/objectStorage";
import { z } from "zod";
import {
  insertDriverApplicationSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  type InsertOrderItem,
} from "@shared/schema";

const upload = multer({ storage: multer.memoryStorage() });

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup auth
  await setupAuth(app);
  
  // Seed products
  await seedProducts();

  // Object storage service
  const objectStorageService = new ObjectStorageService();

  // Public routes
  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  // Driver application (public)
  app.post("/api/driver-applications", async (req, res) => {
    try {
      const data = insertDriverApplicationSchema.parse(req.body);
      const application = await storage.createDriverApplication(data);
      res.json(application);
    } catch (error) {
      res.status(400).json({ error: "Invalid application data" });
    }
  });

  // File upload (using presigned URL approach)
  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Get presigned upload URL
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      // Upload the file directly to the presigned URL
      const uploadResponse = await fetch(uploadURL, {
        method: "PUT",
        body: req.file.buffer,
        headers: {
          "Content-Type": req.file.mimetype || "application/octet-stream",
        },
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload to storage");
      }

      res.json({ 
        objectPath,
        publicUrl: objectPath
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Authenticated routes
  app.get("/api/user/profile", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.claims!.sub;
      let profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        profile = await storage.createUserProfile({ userId, role: "customer" });
      }
      
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/user/profile", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.claims!.sub;
      const profile = await storage.updateUserProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/user/switch-role", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.claims!.sub;
      const { role } = req.body;
      if (!["customer", "driver", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }
      const profile = await storage.updateUserProfile(userId, { role });

      if (role === "driver") {
        const existingDriver = await storage.getDriverByUserId(userId);
        if (!existingDriver) {
          const application = await storage.createDriverApplication({
            firstName: req.user!.claims!.first_name || "Demo",
            lastName: req.user!.claims!.last_name || "Driver",
            email: req.user!.claims!.email || "driver@gaslite.co.za",
            phone: "+27 82 555 0001",
            address: "123 Main Road, Cape Town",
            licenseNumber: "DEMO-LICENSE-001",
            vehicleRegistration: "CA 123-456",
          });
          await storage.createDriver({
            userId,
            applicationId: application.id,
            status: "available",
          });
        }
      }

      res.json(profile);
    } catch (error) {
      console.error("Switch role error:", error);
      res.status(500).json({ error: "Failed to switch role" });
    }
  });

  // Customer orders
  app.get("/api/orders", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.claims!.sub;
      const orders = await storage.getOrdersByCustomer(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.claims!.sub;
      const { items, deliveryAddress, deliveryNotes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Order must have items" });
      }

      if (!deliveryAddress) {
        return res.status(400).json({ error: "Delivery address required" });
      }

      // Calculate order totals
      const orderItems: InsertOrderItem[] = [];
      let subtotal = 0;

      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }

        const totalPrice = Number(product.price) * item.quantity;
        subtotal += totalPrice;

        orderItems.push({
          orderId: "", // Will be set after order creation
          productId: product.id,
          productName: product.name,
          productSize: product.size,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: totalPrice.toFixed(2),
        });
      }

      const serviceFee = 25;
      const total = subtotal + serviceFee;

      const order = await storage.createOrder(
        {
          customerId: userId,
          deliveryAddress,
          deliveryNotes: deliveryNotes || null,
          subtotal: subtotal.toFixed(2),
          serviceFee: serviceFee.toFixed(2),
          total: total.toFixed(2),
        },
        orderItems
      );

      res.json(order);
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Driver routes - role check middleware
  const isDriver = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims!.sub;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile || profile.role !== "driver") {
        return res.status(403).json({ error: "Driver access required" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization failed" });
    }
  };

  app.get("/api/driver/profile", isAuthenticated, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.claims!.sub;
      const driver = await storage.getDriverByUserId(userId);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }
      
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver profile" });
    }
  });

  app.patch("/api/driver/status", isAuthenticated, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.claims!.sub;
      const driver = await storage.getDriverByUserId(userId);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }

      const { status } = req.body;
      if (!["available", "busy", "offline"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const updated = await storage.updateDriver(driver.id, { status });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update status" });
    }
  });

  app.get("/api/driver/orders", isAuthenticated, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.claims!.sub;
      const driver = await storage.getDriverByUserId(userId);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }

      const orders = await storage.getOrdersByDriver(driver.id);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/driver/orders/:orderId", isAuthenticated, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.user!.claims!.sub;
      const driver = await storage.getDriverByUserId(userId);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }

      const order = await storage.getOrder(req.params.orderId);
      if (!order || order.driverId !== driver.id) {
        return res.status(404).json({ error: "Order not found" });
      }

      const { status } = req.body;
      const updateData: any = { status };

      if (status === "delivered") {
        updateData.deliveredAt = new Date();
        // Update driver stats
        await storage.updateDriver(driver.id, {
          totalDeliveries: (driver.totalDeliveries || 0) + 1,
          totalEarnings: (Number(driver.totalEarnings || 0) + Number(order.driverEarnings || 0)).toFixed(2),
        });
      }

      const updated = await storage.updateOrder(order.id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  // Admin routes
  const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.claims!.sub;
      const profile = await storage.getUserProfile(userId);
      
      if (!profile || profile.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization failed" });
    }
  };

  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });

  app.get("/api/admin/orders", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/orders/:orderId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, driverId } = req.body;
      const updateData: any = {};

      if (status) updateData.status = status;
      if (driverId) {
        updateData.driverId = driverId;
        // Calculate driver earnings (15% of order total)
        const order = await storage.getOrder(req.params.orderId);
        if (order) {
          updateData.driverEarnings = (Number(order.total) * 0.15).toFixed(2);
        }
      }

      const updated = await storage.updateOrder(req.params.orderId, updateData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.get("/api/admin/driver-applications", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const applications = await storage.getDriverApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });

  app.patch("/api/admin/driver-applications/:applicationId", isAuthenticated, isAdmin, async (req: AuthenticatedRequest, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const applicationId = req.params.applicationId;
      const reviewerId = req.user!.claims!.sub;

      const application = await storage.getDriverApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }

      const updated = await storage.updateDriverApplication(applicationId, {
        status,
        reviewNotes,
        reviewedAt: new Date(),
        reviewedBy: reviewerId,
      });

      // If approved, create a driver record and update user profile
      if (status === "approved") {
        // Note: In a real app, you would link this to an actual user account
        // For now, we create a placeholder driver that can be linked later
        const driverId = `driver-${Date.now()}`;
        await storage.createDriver({
          userId: driverId,
          applicationId: applicationId,
          status: "offline",
        });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  app.get("/api/admin/drivers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const drivers = await storage.getDrivers();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  return httpServer;
}
