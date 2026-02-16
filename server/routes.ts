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
import { sendOrderConfirmationEmail } from "./email";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { users } from "@shared/models/auth";
import { orders } from "@shared/schema";
import { saveSubscription, removeSubscription, notifyDriversNewOrder, notifyCustomerOrderUpdate, notifyDriverOrderCancelled } from "./push";
import { createYocoCheckout, getYocoCheckoutStatus } from "./yoco";

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
      const { firstName, lastName, email, phone, address, licenseNumber, vehicleRegistration, licenseDocumentUrl, vehicleDocumentUrl, bankName, branchCode, accountNumber, accountType } = req.body;

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
        bankName: bankName || null,
        branchCode: branchCode || null,
        accountNumber: accountNumber || null,
        accountType: accountType || null,
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

  app.get("/api/orders/frequent-products", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const customerOrders = await storage.getOrdersByCustomer(userId);
      const deliveredOrders = customerOrders.filter(o => o.status === "delivered");

      const productCounts: Record<string, { productId: string; productName: string; productSize: string; count: number }> = {};

      for (const order of deliveredOrders) {
        const orderWithItems = await storage.getOrderWithItems(order.id);
        if (orderWithItems) {
          for (const item of orderWithItems.items) {
            if (!productCounts[item.productId]) {
              productCounts[item.productId] = {
                productId: item.productId,
                productName: item.productName,
                productSize: item.productSize,
                count: 0,
              };
            }
            productCounts[item.productId].count += item.quantity;
          }
        }
      }

      const sorted = Object.values(productCounts).sort((a, b) => b.count - a.count);
      res.json(sorted);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch frequent products" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { items, deliveryAddress, deliveryLatitude, deliveryLongitude, deliveryNotes, paymentMethod } = req.body;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Order must have items" });
      }

      if (!deliveryAddress) {
        return res.status(400).json({ error: "Delivery address required" });
      }

      const method = "card";

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

      const isTestOrder = orderItems.some(i => i.productSize === "Test");
      const serviceFee = isTestOrder ? 1 : 29;
      const beforeCardFee = subtotal + serviceFee;
      const cardProcessingFee = method === "card"
        ? Math.round(beforeCardFee * 0.026 * 1.15 * 100) / 100
        : 0;
      const total = beforeCardFee + cardProcessingFee;

      let finalLat = deliveryLatitude ? String(deliveryLatitude) : null;
      let finalLng = deliveryLongitude ? String(deliveryLongitude) : null;

      if (!finalLat || !finalLng) {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(deliveryAddress)}&components=country:ZA&key=${process.env.GOOGLE_MAPS_API_KEY}`;
          const geoRes = await fetch(geocodeUrl);
          const geoData = await geoRes.json();
          if (geoData.status === "OK" && geoData.results?.[0]) {
            const loc = geoData.results[0].geometry.location;
            finalLat = String(loc.lat);
            finalLng = String(loc.lng);
          }
        } catch (e) {
          console.log("Server-side geocoding failed:", e);
        }
      }

      if (!finalLat || !finalLng) {
        return res.status(400).json({ error: "Could not determine delivery location. Please select an address from the dropdown suggestions." });
      }

      const order = await storage.createOrder(
        {
          customerId: userId,
          deliveryAddress,
          deliveryLatitude: finalLat,
          deliveryLongitude: finalLng,
          deliveryNotes: deliveryNotes || null,
          subtotal: subtotal.toFixed(2),
          serviceFee: serviceFee.toFixed(2),
          cardProcessingFee: cardProcessingFee.toFixed(2),
          total: total.toFixed(2),
          paymentMethod: method,
          paymentStatus: "pending",
        },
        orderItems
      );

      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;

      try {
        const amountInCents = Math.round(total * 100);

        const lineItems = orderItems.map((item) => ({
          displayName: `${item.productName} (${item.productSize})`,
          quantity: item.quantity,
          pricingDetails: {
            price: Math.round(Number(item.unitPrice) * 100),
          },
        }));

        const checkout = await createYocoCheckout({
          amountInCents,
          orderId: order.id,
          orderNumber: order.orderNumber,
          baseUrl,
          lineItems,
          subtotalInCents: Math.round(subtotal * 100),
          taxInCents: Math.round(cardProcessingFee * 100),
        });

        await storage.updateOrder(order.id, {
          yocoCheckoutId: checkout.id,
        });

        res.json({
          ...order,
          yocoCheckoutId: checkout.id,
          redirectUrl: checkout.redirectUrl,
        });
      } catch (paymentError) {
        console.error("Yoco checkout creation failed:", paymentError);
        await storage.updateOrder(order.id, { status: "cancelled", paymentStatus: "failed" });
        return res.status(500).json({ error: "Payment initialization failed. Please try again." });
      }
    } catch (error) {
      console.error("Order creation error:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  app.post("/api/orders/:orderId/cancel", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const order = await storage.getOrder(req.params.orderId);

      if (!order || order.customerId !== userId) {
        return res.status(404).json({ error: "Order not found" });
      }

      const cancellableStatuses = ["pending", "confirmed", "assigned"];
      if (!cancellableStatuses.includes(order.status)) {
        return res.status(400).json({ error: "This order can no longer be cancelled. It has already been picked up." });
      }

      if (order.driverId) {
        const driver = await storage.getDriverByUserId(order.driverId);
        if (!driver) {
          const driverRecord = await storage.getDriver(order.driverId);
          if (driverRecord) {
            await storage.updateDriver(driverRecord.id, { status: "available" });
            notifyDriverOrderCancelled(driverRecord.id, order.orderNumber).catch(err =>
              console.error('Push notification to driver failed:', err)
            );
          }
        } else {
          await storage.updateDriver(driver.id, { status: "available" });
          notifyDriverOrderCancelled(driver.id, order.orderNumber).catch(err =>
            console.error('Push notification to driver failed:', err)
          );
        }
      }

      const updated = await storage.updateOrder(order.id, {
        status: "cancelled",
        driverId: null,
        driverEarnings: null,
      });

      res.json(updated);
    } catch (error) {
      console.error("Order cancellation error:", error);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });

  app.post("/api/payments/verify/:orderId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const order = await storage.getOrder(req.params.orderId);

      if (!order || order.customerId !== userId) {
        return res.status(404).json({ error: "Order not found" });
      }

      if (!order.yocoCheckoutId) {
        return res.status(400).json({ error: "No payment session found for this order" });
      }

      if (order.paymentStatus === "paid") {
        return res.json({ status: "paid", order });
      }

      const checkoutStatus = await getYocoCheckoutStatus(order.yocoCheckoutId);

      if (checkoutStatus.status === "completed") {
        const expectedAmountCents = Math.round(Number(order.total) * 100);
        if (checkoutStatus.amount && checkoutStatus.amount !== expectedAmountCents) {
          console.error(`Payment amount mismatch: expected ${expectedAmountCents}, got ${checkoutStatus.amount}`);
          return res.status(400).json({ error: "Payment amount does not match order total" });
        }

        await storage.updateOrder(order.id, { paymentStatus: "paid" });

        const updatedOrder = await storage.getOrderWithItems(order.id);

        (async () => {
          try {
            const [user] = await db.select().from(users).where(eq(users.id, userId));
            const profile = await storage.getUserProfile(userId);
            const customerEmail = user?.email;
            const customerName = profile?.firstName
              ? `${profile.firstName} ${profile.lastName || ''}`.trim()
              : user?.firstName
              ? `${user.firstName} ${user.lastName || ''}`.trim()
              : 'Valued Customer';

            if (customerEmail && updatedOrder) {
              const orderDate = new Date().toLocaleDateString('en-ZA', {
                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
              });

              await sendOrderConfirmationEmail({
                customerName,
                customerEmail,
                orderId: order.id,
                orderDate,
                deliveryAddress: order.deliveryAddress,
                items: updatedOrder.items.map((item: any) => ({
                  productName: item.productName,
                  productSize: item.productSize,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice,
                })),
                subtotal: order.subtotal as string,
                serviceFee: order.serviceFee as string,
                cardProcessingFee: order.cardProcessingFee as string,
                total: order.total as string,
              });
            }
          } catch (emailError) {
            console.error('Background email send failed:', emailError);
          }
        })();

        notifyDriversNewOrder(order.id, order.orderNumber, order.deliveryAddress).catch(err =>
          console.error('Push notification to drivers failed:', err)
        );

        return res.json({ status: "paid", order: updatedOrder });
      } else if (checkoutStatus.status === "expired" || checkoutStatus.status === "cancelled") {
        await storage.updateOrder(order.id, { paymentStatus: "failed", status: "cancelled" });
        return res.json({ status: "failed", order });
      } else {
        return res.json({ status: "pending", order });
      }
    } catch (error) {
      console.error("Payment verification error:", error);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.post("/api/webhooks/yoco", async (req, res) => {
    try {
      const event = req.body;
      console.log("Yoco webhook received:", event.type, event.payload?.metadata?.orderId);

      if (event.type === "payment.succeeded") {
        const orderId = event.payload?.metadata?.orderId;
        if (orderId) {
          const order = await storage.getOrder(orderId);
          if (order && order.paymentStatus !== "paid" && order.yocoCheckoutId) {
            try {
              const checkoutStatus = await getYocoCheckoutStatus(order.yocoCheckoutId);
              if (checkoutStatus.status !== "completed") {
                console.warn(`Webhook claimed payment.succeeded but Yoco API says status=${checkoutStatus.status} for order ${orderId}`);
                return res.status(200).json({ received: true });
              }

              const expectedAmountCents = Math.round(Number(order.total) * 100);
              if (checkoutStatus.amount && checkoutStatus.amount !== expectedAmountCents) {
                console.error(`Webhook amount mismatch: expected ${expectedAmountCents}, got ${checkoutStatus.amount}`);
                return res.status(200).json({ received: true });
              }

              await storage.updateOrder(order.id, { paymentStatus: "paid" });

              const updatedOrder = await storage.getOrderWithItems(order.id);

              (async () => {
                try {
                  const [user] = await db.select().from(users).where(eq(users.id, order.customerId));
                  const profile = await storage.getUserProfile(order.customerId);
                  const customerEmail = user?.email;
                  const customerName = profile?.firstName
                    ? `${profile.firstName} ${profile.lastName || ''}`.trim()
                    : user?.firstName
                    ? `${user.firstName} ${user.lastName || ''}`.trim()
                    : 'Valued Customer';

                  if (customerEmail && updatedOrder) {
                    const orderDate = new Date().toLocaleDateString('en-ZA', {
                      year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                    });

                    await sendOrderConfirmationEmail({
                      customerName,
                      customerEmail,
                      orderId: order.id,
                      orderDate,
                      deliveryAddress: order.deliveryAddress,
                      items: updatedOrder.items.map((item: any) => ({
                        productName: item.productName,
                        productSize: item.productSize,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice,
                      })),
                      subtotal: order.subtotal as string,
                      serviceFee: order.serviceFee as string,
                      cardProcessingFee: order.cardProcessingFee as string,
                      total: order.total as string,
                    });
                  }
                } catch (emailError) {
                  console.error('Webhook background email send failed:', emailError);
                }
              })();

              notifyDriversNewOrder(order.id, order.orderNumber, order.deliveryAddress).catch(err =>
                console.error('Webhook push notification to drivers failed:', err)
              );
            } catch (verifyError) {
              console.error('Webhook Yoco verification failed:', verifyError);
            }
          }
        }
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error("Webhook processing error:", error);
      res.status(200).json({ received: true });
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

  app.get("/api/driver/me", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ error: "No driver record" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to check driver status" });
    }
  });

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
        locationUpdatedAt: new Date(),
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

      const updated = await storage.updateOrder(order.id, {
        driverId: driver.id,
        status: "assigned",
        estimatedDeliveryTime: 30,
      });

      await storage.updateDriver(driver.id, { status: "busy" });

      res.json(updated);

      notifyCustomerOrderUpdate(order.customerId, order.orderNumber, "assigned").catch(err =>
        console.error('Push notification to customer failed:', err)
      );
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
          status: "available",
        });
      }

      const updated = await storage.updateOrder(order.id, updateData);
      res.json(updated);

      notifyCustomerOrderUpdate(order.customerId, order.orderNumber, status).catch(err =>
        console.error('Push notification to customer failed:', err)
      );
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

      const locationAge = driver?.locationUpdatedAt 
        ? (Date.now() - new Date(driver.locationUpdatedAt).getTime()) / 1000 
        : null;

      res.json({
        orderId: order.id,
        status: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        pickedUpAt: order.pickedUpAt,
        driverLocation: driver?.currentLatitude && driver?.currentLongitude ? {
          latitude: Number(driver.currentLatitude),
          longitude: Number(driver.currentLongitude),
        } : null,
        locationUpdatedAt: driver?.locationUpdatedAt || null,
        locationStale: locationAge !== null && locationAge > 60,
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

  app.get("/api/admin/customers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const customers = await storage.getCustomerSignups();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
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

  app.get("/api/push/vapid-key", (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) {
      return res.status(404).json({ error: "Push notifications not configured" });
    }
    res.json({ publicKey: key });
  });

  app.post("/api/push/subscribe", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.userId!;
      const { subscription } = req.body;

      if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
        return res.status(400).json({ error: "Invalid subscription data" });
      }

      await saveSubscription(userId, subscription);
      res.json({ success: true });
    } catch (error) {
      console.error("Push subscribe error:", error);
      res.status(500).json({ error: "Failed to save subscription" });
    }
  });

  app.post("/api/push/unsubscribe", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const { endpoint } = req.body;
      if (endpoint) {
        await removeSubscription(endpoint);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to remove subscription" });
    }
  });

  // ============ CHAT ROUTES ============

  // Get messages for an order thread
  app.get("/api/chat/order/:orderId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId!;
      const { orderId } = req.params;

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const profile = await storage.getUserProfile(userId);
      if (!profile) return res.status(403).json({ error: "No profile" });

      const isCustomer = order.customerId === userId;
      let isAssignedDriver = false;
      if (profile.role === "driver" && order.driverId) {
        const driver = await storage.getDriverByUserId(userId);
        if (driver && driver.id === order.driverId) isAssignedDriver = true;
      }
      const isAdmin = profile.role === "admin";

      if (!isCustomer && !isAssignedDriver && !isAdmin) {
        return res.status(403).json({ error: "Not authorized to view this chat" });
      }

      const messages = await storage.getChatMessages("order", orderId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message in an order thread
  app.post("/api/chat/order/:orderId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId!;
      const { orderId } = req.params;
      const { body } = req.body;

      if (!body || typeof body !== "string" || body.trim().length === 0) {
        return res.status(400).json({ error: "Message body required" });
      }

      const order = await storage.getOrder(orderId);
      if (!order) return res.status(404).json({ error: "Order not found" });

      const profile = await storage.getUserProfile(userId);
      if (!profile) return res.status(403).json({ error: "No profile" });

      const isCustomer = order.customerId === userId;
      let isAssignedDriver = false;
      if (profile.role === "driver" && order.driverId) {
        const driver = await storage.getDriverByUserId(userId);
        if (driver && driver.id === order.driverId) isAssignedDriver = true;
      }

      if (!isCustomer && !isAssignedDriver && profile.role !== "admin") {
        return res.status(403).json({ error: "Not authorized" });
      }

      const message = await storage.createChatMessage({
        threadType: "order",
        orderId,
        driverId: null,
        senderUserId: userId,
        senderRole: profile.role,
        senderName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User",
        body: body.trim(),
      });

      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  // Get messages for admin-driver thread
  app.get("/api/chat/admin-driver/:driverId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId!;
      const { driverId } = req.params;

      const profile = await storage.getUserProfile(userId);
      if (!profile) return res.status(403).json({ error: "No profile" });

      const isAdmin = profile.role === "admin";
      let isTheDriver = false;
      if (profile.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (driver && driver.id === driverId) isTheDriver = true;
      }

      if (!isAdmin && !isTheDriver) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const messages = await storage.getChatMessages("admin_driver", driverId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });

  // Send message in admin-driver thread
  app.post("/api/chat/admin-driver/:driverId", isAuthenticated, async (req: AuthenticatedRequest, res) => {
    try {
      const userId = req.session.userId!;
      const { driverId } = req.params;
      const { body } = req.body;

      if (!body || typeof body !== "string" || body.trim().length === 0) {
        return res.status(400).json({ error: "Message body required" });
      }

      const profile = await storage.getUserProfile(userId);
      if (!profile) return res.status(403).json({ error: "No profile" });

      const isAdmin = profile.role === "admin";
      let isTheDriver = false;
      if (profile.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (driver && driver.id === driverId) isTheDriver = true;
      }

      if (!isAdmin && !isTheDriver) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const message = await storage.createChatMessage({
        threadType: "admin_driver",
        orderId: null,
        driverId,
        senderUserId: userId,
        senderRole: profile.role,
        senderName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || (isAdmin ? "Admin" : "Driver"),
        body: body.trim(),
      });

      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });

  return httpServer;
}
