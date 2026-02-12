import type { Express, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage, seedProducts } from "./storage";
import { setupSession, registerAuthRoutes, isAuthenticated, type AuthenticatedRequest } from "./auth";
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
  setupSession(app);
  registerAuthRoutes(app);

  await seedProducts();

  const objectStorageService = new ObjectStorageService();

  app.get("/api/config/maps-key", (req, res) => {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      return res.status(404).json({ error: "Maps API key not configured" });
    }
    res.json({ key });
  });

  app.get("/api/products", async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/driver-applications", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const data = insertDriverApplicationSchema.parse(req.body);
      data.userId = req.userId!;
      const application = await storage.createDriverApplication(data);
      res.json(application);
    } catch (error) {
      res.status(400).json({ error: "Invalid application data" });
    }
  });

  app.post("/api/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

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

  app.post("/api/uploads/request-url", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { name, size, contentType } = req.body;
      if (!name) {
        return res.status(400).json({ error: "File name is required" });
      }

      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      const objectPath = objectStorageService.normalizeObjectEntityPath(uploadURL);

      res.json({
        uploadURL,
        objectPath,
        metadata: {
          name: name || "file",
          size: size || 0,
          contentType: contentType || "application/octet-stream",
        },
      });
    } catch (error) {
      console.error("Request upload URL error:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  app.get("/api/user/profile", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      let profile = await storage.getUserProfile(userId);
      
      if (!profile) {
        profile = await storage.createUserProfile({
          userId,
          role: "customer",
        });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });

  app.patch("/api/user/profile", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const profile = await storage.updateUserProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  app.post("/api/onboarding/customer", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { firstName, lastName, phone, address } = req.body;

      if (!firstName || !lastName || !phone || !address) {
        return res.status(400).json({ error: "All fields are required" });
      }

      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ userId, role: "customer" });
      }

      const updated = await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        phone,
        address,
        role: "customer",
        onboardingCompleted: true,
      });

      res.json(updated);
    } catch (error) {
      console.error("Customer onboarding error:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });

  app.post("/api/onboarding/driver", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { firstName, lastName, email, phone, address, licenseNumber, vehicleRegistration, licenseDocumentUrl, vehicleDocumentUrl } = req.body;

      if (!firstName || !lastName || !email || !phone || !address || !licenseNumber || !vehicleRegistration) {
        return res.status(400).json({ error: "All required fields must be filled" });
      }

      const existingApp = await storage.getDriverApplicationByUserId(userId);
      if (existingApp) {
        return res.status(400).json({ error: "You already have a driver application", application: existingApp });
      }

      const application = await storage.createDriverApplication({
        userId,
        firstName,
        lastName,
        email,
        phone,
        address,
        licenseNumber,
        vehicleRegistration,
        licenseDocumentUrl: licenseDocumentUrl || null,
        vehicleDocumentUrl: vehicleDocumentUrl || null,
      });

      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ userId, role: "customer" });
      }
      await storage.updateUserProfile(userId, {
        firstName,
        lastName,
        phone,
        address,
        onboardingCompleted: true,
      });

      res.json({ application, message: "Application submitted successfully" });
    } catch (error) {
      console.error("Driver onboarding error:", error);
      res.status(500).json({ error: "Failed to submit driver application" });
    }
  });

  app.get("/api/user/driver-application", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const application = await storage.getDriverApplicationByUserId(userId);
      const driver = await storage.getDriverByUserId(userId);
      res.json({ application: application || null, driver: driver || null });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch application status" });
    }
  });

  app.post("/api/user/switch-role", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { role } = req.body;
      if (!["customer", "driver", "admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const existing = await storage.getUserProfile(userId);
      if (!existing) {
        return res.status(400).json({ error: "Profile not found" });
      }

      if (role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (!driver) {
          return res.status(403).json({ error: "Driver access requires an approved application" });
        }
      }

      if (role === "admin") {
        if (existing.role !== "admin") {
          return res.status(403).json({ error: "Admin access not authorized" });
        }
      }

      const profile = await storage.updateUserProfile(userId, { role });
      res.json(profile);
    } catch (error) {
      console.error("Switch role error:", error);
      res.status(500).json({ error: "Failed to switch role" });
    }
  });

  app.get("/api/orders", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const orders = await storage.getOrdersByCustomer(userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { items, deliveryAddress, deliveryNotes } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Order must have items" });
      }

      if (!deliveryAddress) {
        return res.status(400).json({ error: "Delivery address required" });
      }

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
          orderId: "",
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

  app.get("/api/orders/:orderId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const orderWithItems = await storage.getOrderWithItems(req.params.orderId);

      if (!orderWithItems || orderWithItems.customerId !== userId) {
        return res.status(404).json({ error: "Order not found" });
      }

      res.json(orderWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });

  const isDriver = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
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
      const userId = req.userId!;
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
      const userId = req.userId!;
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

  app.post("/api/driver/location", isAuthenticated, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }

      const { latitude, longitude } = req.body;
      if (typeof latitude !== "number" || typeof longitude !== "number") {
        return res.status(400).json({ error: "Valid latitude and longitude required" });
      }

      const updated = await storage.updateDriver(driver.id, {
        currentLatitude: latitude.toFixed(8),
        currentLongitude: longitude.toFixed(8),
      });
      res.json({ success: true, location: { latitude, longitude } });
    } catch (error) {
      res.status(500).json({ error: "Failed to update location" });
    }
  });

  app.get("/api/driver/orders", isAuthenticated, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
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

  function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  app.get("/api/driver/available-orders", isAuthenticated, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const driver = await storage.getDriverByUserId(userId);
      const availableOrders = await storage.getAvailableOrders();

      if (driver?.currentLatitude && driver?.currentLongitude) {
        const driverLat = Number(driver.currentLatitude);
        const driverLon = Number(driver.currentLongitude);
        const ordersWithDistance = availableOrders
          .map((order) => {
            let distance: number | null = null;
            if (order.deliveryLatitude && order.deliveryLongitude) {
              distance = haversineDistance(
                driverLat, driverLon,
                Number(order.deliveryLatitude), Number(order.deliveryLongitude)
              );
            }
            return { ...order, distance };
          })
          .filter((order) => order.distance === null || order.distance <= 10)
          .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
        return res.json(ordersWithDistance);
      }

      res.json(availableOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available orders" });
    }
  });

  app.post("/api/driver/accept-order/:orderId", isAuthenticated, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const driver = await storage.getDriverByUserId(userId);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }

      if (driver.status !== "available") {
        return res.status(400).json({ error: "You must be available to accept orders" });
      }

      const order = await storage.getOrder(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (order.driverId || order.status !== "pending") {
        return res.status(400).json({ error: "Order is no longer available" });
      }

      const driverEarnings = (Number(order.total) * 0.15).toFixed(2);
      const updated = await storage.updateOrder(order.id, {
        driverId: driver.id,
        status: "assigned",
        driverEarnings,
        estimatedDeliveryTime: 30,
      });

      await storage.updateDriver(driver.id, { status: "busy" });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to accept order" });
    }
  });

  app.patch("/api/driver/orders/:orderId", isAuthenticated, isDriver, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const driver = await storage.getDriverByUserId(userId);
      
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }

      const order = await storage.getOrder(req.params.orderId);
      if (!order || order.driverId !== driver.id) {
        return res.status(404).json({ error: "Order not found" });
      }

      const { status } = req.body;
      const validTransitions: Record<string, string[]> = {
        assigned: ["picked_up", "cancelled"],
        picked_up: ["in_transit"],
        in_transit: ["delivered"],
        in_progress: ["delivered"],
      };

      const allowed = validTransitions[order.status];
      if (!allowed || !allowed.includes(status)) {
        return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
      }

      const updateData: any = { status };

      if (status === "picked_up") {
        updateData.pickedUpAt = new Date();
      }

      if (status === "delivered") {
        updateData.deliveredAt = new Date();
        await storage.updateDriver(driver.id, {
          totalDeliveries: (driver.totalDeliveries || 0) + 1,
          totalEarnings: (Number(driver.totalEarnings || 0) + Number(order.driverEarnings || 0)).toFixed(2),
          status: "available",
        });
      }

      const updated = await storage.updateOrder(order.id, updateData);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });

  app.get("/api/orders/:orderId/tracking", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const orderId = req.params.orderId as string;
      const order = await storage.getOrder(orderId);

      if (!order || order.customerId !== userId) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (!order.driverId) {
        return res.json({
          orderId: order.id,
          status: order.status,
          driverLocation: null,
          estimatedDeliveryTime: order.estimatedDeliveryTime,
        });
      }

      const driver = await storage.getDriver(order.driverId);
      const driverApp = driver ? await storage.getDriverApplicationByUserId(driver.userId) : null;

      res.json({
        orderId: order.id,
        status: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        pickedUpAt: order.pickedUpAt,
        driverLocation: driver?.currentLatitude && driver?.currentLongitude ? {
          latitude: Number(driver.currentLatitude),
          longitude: Number(driver.currentLongitude),
        } : null,
        driverInfo: driverApp ? {
          firstName: driverApp.firstName,
          lastName: driverApp.lastName,
          phone: driverApp.phone,
          vehicleRegistration: driverApp.vehicleRegistration,
        } : null,
        deliveryLocation: order.deliveryLatitude && order.deliveryLongitude ? {
          latitude: Number(order.deliveryLatitude),
          longitude: Number(order.deliveryLongitude),
        } : null,
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracking info" });
    }
  });

  const isAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.userId!;
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
      const reviewerId = req.userId!;

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

      if (status === "approved" && application.userId) {
        const existingDriver = await storage.getDriverByUserId(application.userId);
        if (!existingDriver) {
          await storage.createDriver({
            userId: application.userId,
            applicationId: applicationId,
            status: "offline",
          });
        }
        await storage.updateUserProfile(application.userId, { role: "driver" });
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update application" });
    }
  });

  app.get("/api/admin/drivers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const drivers = await storage.getDriversWithApplications();
      res.json(drivers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });

  app.get("/api/admin/orders/:orderId/items", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orderWithItems = await storage.getOrderWithItems(req.params.orderId);
      if (!orderWithItems) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(orderWithItems.items);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order items" });
    }
  });

  return httpServer;
}
