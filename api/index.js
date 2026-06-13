var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/vercel-handler.ts
import express from "express";
import serverless from "serverless-http";

// server/db.ts
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  appSettings: () => appSettings,
  chatMessageTypeEnum: () => chatMessageTypeEnum,
  chatMessages: () => chatMessages,
  driverApplicationStatusEnum: () => driverApplicationStatusEnum,
  driverApplications: () => driverApplications,
  driverReferrals: () => driverReferrals,
  driverStatusEnum: () => driverStatusEnum,
  drivers: () => drivers,
  driversRelations: () => driversRelations,
  insertAppSettingSchema: () => insertAppSettingSchema,
  insertChatMessageSchema: () => insertChatMessageSchema,
  insertDriverApplicationSchema: () => insertDriverApplicationSchema,
  insertDriverReferralSchema: () => insertDriverReferralSchema,
  insertDriverSchema: () => insertDriverSchema,
  insertOrderItemSchema: () => insertOrderItemSchema,
  insertOrderSchema: () => insertOrderSchema,
  insertProductSchema: () => insertProductSchema,
  insertPushSubscriptionSchema: () => insertPushSubscriptionSchema,
  insertSettlementSchema: () => insertSettlementSchema,
  insertUserProfileSchema: () => insertUserProfileSchema,
  orderItems: () => orderItems,
  orderItemsRelations: () => orderItemsRelations,
  orderStatusEnum: () => orderStatusEnum,
  orders: () => orders,
  ordersRelations: () => ordersRelations,
  passwordResetTokens: () => passwordResetTokens,
  paymentMethodEnum: () => paymentMethodEnum,
  products: () => products,
  pushSubscriptions: () => pushSubscriptions,
  sessions: () => sessions,
  settlementStatusEnum: () => settlementStatusEnum,
  settlements: () => settlements,
  userProfiles: () => userProfiles,
  userRoleEnum: () => userRoleEnum,
  users: () => users
});
import { sql as sql2, relations } from "drizzle-orm";
import { pgTable as pgTable2, text, varchar as varchar2, integer, decimal, timestamp as timestamp2, boolean as boolean2, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// shared/models/auth.ts
import { sql } from "drizzle-orm";
import { index, jsonb, pgTable, timestamp, varchar, boolean } from "drizzle-orm/pg-core";
var sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull()
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);
var users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  phone: varchar("phone").unique(),
  passwordHash: varchar("password_hash").notNull(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var passwordResetTokens = pgTable("password_reset_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow()
});

// shared/schema.ts
var userRoleEnum = pgEnum("user_role", ["customer", "driver", "admin"]);
var orderStatusEnum = pgEnum("order_status", ["pending", "confirmed", "assigned", "picked_up", "in_transit", "delivered", "cancelled"]);
var paymentMethodEnum = pgEnum("payment_method", ["cash", "card"]);
var driverApplicationStatusEnum = pgEnum("driver_application_status", ["pending", "approved", "rejected"]);
var driverStatusEnum = pgEnum("driver_status", ["available", "busy", "offline"]);
var products = pgTable2("products", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  size: text("size").notNull(),
  // e.g., "9kg", "19kg", "48kg"
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  imageUrl: text("image_url"),
  isAvailable: boolean2("is_available").default(true),
  createdAt: timestamp2("created_at").defaultNow()
});
var userProfiles = pgTable2("user_profiles", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull().unique(),
  role: userRoleEnum("role").default("customer").notNull(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  phone: text("phone"),
  address: text("address"),
  latitude: decimal("latitude", { precision: 10, scale: 8 }),
  longitude: decimal("longitude", { precision: 11, scale: 8 }),
  onboardingCompleted: boolean2("onboarding_completed").default(false).notNull(),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var driverApplications = pgTable2("driver_applications", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  address: text("address").notNull(),
  licenseNumber: text("license_number").notNull(),
  licenseDocumentUrl: text("license_document_url"),
  vehicleRegistration: text("vehicle_registration").notNull(),
  vehicleDocumentUrl: text("vehicle_document_url"),
  prdpCertificateUrl: text("prdp_certificate_url"),
  bankName: text("bank_name"),
  branchCode: text("branch_code"),
  accountNumber: text("account_number"),
  accountType: text("account_type"),
  referralCode: text("referral_code"),
  status: driverApplicationStatusEnum("status").default("pending").notNull(),
  reviewNotes: text("review_notes"),
  reviewedAt: timestamp2("reviewed_at"),
  reviewedBy: varchar2("reviewed_by"),
  createdAt: timestamp2("created_at").defaultNow()
});
var drivers = pgTable2("drivers", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull().unique(),
  applicationId: varchar2("application_id").notNull(),
  referralCode: varchar2("referral_code").unique(),
  referredByDriverId: varchar2("referred_by_driver_id"),
  subscriptionExempt: boolean2("subscription_exempt").default(false),
  status: driverStatusEnum("status").default("offline").notNull(),
  currentLatitude: decimal("current_latitude", { precision: 10, scale: 8 }),
  currentLongitude: decimal("current_longitude", { precision: 11, scale: 8 }),
  locationUpdatedAt: timestamp2("location_updated_at"),
  totalDeliveries: integer("total_deliveries").default(0),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).default("0"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var orders = pgTable2("orders", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  orderNumber: text("order_number").notNull().unique(),
  customerId: varchar2("customer_id").notNull(),
  driverId: varchar2("driver_id"),
  status: orderStatusEnum("status").default("pending").notNull(),
  deliveryAddress: text("delivery_address").notNull(),
  deliveryLatitude: decimal("delivery_latitude", { precision: 10, scale: 8 }),
  deliveryLongitude: decimal("delivery_longitude", { precision: 11, scale: 8 }),
  deliveryNotes: text("delivery_notes"),
  subtotal: decimal("subtotal", { precision: 10, scale: 2 }).notNull(),
  serviceFee: decimal("service_fee", { precision: 10, scale: 2 }).notNull(),
  cardProcessingFee: decimal("card_processing_fee", { precision: 10, scale: 2 }).default("0"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  paymentMethod: paymentMethodEnum("payment_method").default("card").notNull(),
  paymentStatus: text("payment_status").default("pending"),
  yocoCheckoutId: text("yoco_checkout_id"),
  driverEarnings: decimal("driver_earnings", { precision: 10, scale: 2 }),
  estimatedDeliveryTime: integer("estimated_delivery_time"),
  pickedUpAt: timestamp2("picked_up_at"),
  deliveredAt: timestamp2("delivered_at"),
  createdAt: timestamp2("created_at").defaultNow(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var orderItems = pgTable2("order_items", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  orderId: varchar2("order_id").notNull(),
  productId: varchar2("product_id").notNull(),
  productName: text("product_name").notNull(),
  productSize: text("product_size").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: decimal("unit_price", { precision: 10, scale: 2 }).notNull(),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull()
});
var chatMessageTypeEnum = pgEnum("chat_message_type", ["order", "admin_driver"]);
var chatMessages = pgTable2("chat_messages", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  threadType: chatMessageTypeEnum("thread_type").notNull(),
  orderId: varchar2("order_id"),
  driverId: varchar2("driver_id"),
  senderUserId: varchar2("sender_user_id").notNull(),
  senderRole: userRoleEnum("sender_role").notNull(),
  senderName: text("sender_name"),
  body: text("body").notNull(),
  createdAt: timestamp2("created_at").defaultNow()
});
var settlementStatusEnum = pgEnum("settlement_status", ["pending", "processing", "paid"]);
var settlements = pgTable2("settlements", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  driverId: varchar2("driver_id").notNull(),
  weekStart: timestamp2("week_start").notNull(),
  weekEnd: timestamp2("week_end").notNull(),
  totalEarnings: decimal("total_earnings", { precision: 10, scale: 2 }).notNull().default("0"),
  deliveryCount: integer("delivery_count").notNull().default(0),
  status: settlementStatusEnum("status").default("pending").notNull(),
  paidAt: timestamp2("paid_at"),
  notes: text("notes"),
  createdAt: timestamp2("created_at").defaultNow()
});
var appSettings = pgTable2("app_settings", {
  key: varchar2("key").primaryKey(),
  value: text("value").notNull(),
  updatedAt: timestamp2("updated_at").defaultNow()
});
var driverReferrals = pgTable2("driver_referrals", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  referrerDriverId: varchar2("referrer_driver_id").notNull(),
  referredDriverId: varchar2("referred_driver_id").notNull().unique(),
  createdAt: timestamp2("created_at").defaultNow()
});
var pushSubscriptions = pgTable2("push_subscriptions", {
  id: varchar2("id").primaryKey().default(sql2`gen_random_uuid()`),
  userId: varchar2("user_id").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: timestamp2("created_at").defaultNow()
});
var ordersRelations = relations(orders, ({ many, one }) => ({
  items: many(orderItems),
  driver: one(drivers, {
    fields: [orders.driverId],
    references: [drivers.id]
  })
}));
var orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id]
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id]
  })
}));
var driversRelations = relations(drivers, ({ many, one }) => ({
  orders: many(orders),
  application: one(driverApplications, {
    fields: [drivers.applicationId],
    references: [driverApplications.id]
  })
}));
var insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true
});
var insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true
});
var insertDriverApplicationSchema = createInsertSchema(driverApplications).omit({
  id: true,
  status: true,
  reviewNotes: true,
  reviewedAt: true,
  reviewedBy: true,
  createdAt: true
});
var insertDriverSchema = createInsertSchema(drivers).omit({
  id: true,
  totalDeliveries: true,
  totalEarnings: true,
  createdAt: true,
  updatedAt: true
});
var insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  orderNumber: true,
  status: true,
  driverId: true,
  driverEarnings: true,
  deliveredAt: true,
  createdAt: true,
  updatedAt: true
});
var insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true
});
var insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
  createdAt: true
});
var insertPushSubscriptionSchema = createInsertSchema(pushSubscriptions).omit({
  id: true,
  createdAt: true
});
var insertSettlementSchema = createInsertSchema(settlements).omit({
  id: true,
  createdAt: true
});
var insertDriverReferralSchema = createInsertSchema(driverReferrals).omit({
  id: true,
  createdAt: true
});
var insertAppSettingSchema = createInsertSchema(appSettings).omit({
  updatedAt: true
});

// server/db.ts
var { Pool } = pg;
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: process.env.DATABASE_URL });
var db = drizzle(pool, { schema: schema_exports });

// server/storage.ts
import { eq, desc, and, sql as sql3, count } from "drizzle-orm";
var DatabaseStorage = class {
  // Products
  async getProducts() {
    return db.select().from(products).where(eq(products.isAvailable, true));
  }
  async getProduct(id) {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }
  async createProduct(product) {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }
  async updateProduct(id, product) {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }
  // User Profiles
  async getUserProfile(userId) {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }
  async createUserProfile(profile) {
    const [created] = await db.insert(userProfiles).values(profile).returning();
    return created;
  }
  async updateUserProfile(userId, profile) {
    const [updated] = await db.update(userProfiles).set({ ...profile, updatedAt: /* @__PURE__ */ new Date() }).where(eq(userProfiles.userId, userId)).returning();
    return updated;
  }
  // Driver Applications
  async getDriverApplications() {
    return db.select().from(driverApplications).orderBy(desc(driverApplications.createdAt));
  }
  async getDriverApplication(id) {
    const [application] = await db.select().from(driverApplications).where(eq(driverApplications.id, id));
    return application;
  }
  async getDriverApplicationByUserId(userId) {
    const [application] = await db.select().from(driverApplications).where(eq(driverApplications.userId, userId));
    return application;
  }
  async createDriverApplication(application) {
    const [created] = await db.insert(driverApplications).values(application).returning();
    return created;
  }
  async updateDriverApplication(id, application) {
    const [updated] = await db.update(driverApplications).set(application).where(eq(driverApplications.id, id)).returning();
    return updated;
  }
  // Drivers
  async getDrivers() {
    return db.select().from(drivers).orderBy(desc(drivers.createdAt));
  }
  async getDriver(id) {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }
  async getDriverByUserId(userId) {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver;
  }
  async createDriver(driver) {
    const [created] = await db.insert(drivers).values(driver).returning();
    return created;
  }
  async updateDriver(id, driver) {
    const [updated] = await db.update(drivers).set({ ...driver, updatedAt: /* @__PURE__ */ new Date() }).where(eq(drivers.id, id)).returning();
    return updated;
  }
  // Orders
  async getOrders() {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }
  async getOrdersByCustomer(customerId) {
    return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }
  async getOrdersByDriver(driverId) {
    return db.select().from(orders).where(eq(orders.driverId, driverId)).orderBy(desc(orders.createdAt));
  }
  async getOrder(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }
  async getOrderWithItems(id) {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return void 0;
    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  }
  async createOrder(order, items) {
    const orderNumber = `GG-${Date.now().toString(36).toUpperCase()}`;
    const [createdOrder] = await db.insert(orders).values({ ...order, orderNumber }).returning();
    const createdItems = await Promise.all(
      items.map(async (item) => {
        const [created] = await db.insert(orderItems).values({ ...item, orderId: createdOrder.id }).returning();
        return created;
      })
    );
    return { ...createdOrder, items: createdItems };
  }
  async updateOrder(id, order) {
    const [updated] = await db.update(orders).set({ ...order, updatedAt: /* @__PURE__ */ new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }
  // Available orders for drivers
  async getAvailableOrders() {
    return db.select().from(orders).where(
      and(
        eq(orders.status, "pending"),
        sql3`${orders.driverId} IS NULL`
      )
    ).orderBy(desc(orders.createdAt));
  }
  // Drivers with application info
  async getDriversWithApplications() {
    const allDrivers = await db.select().from(drivers).orderBy(desc(drivers.createdAt));
    const result = [];
    for (const driver of allDrivers) {
      const [application] = await db.select().from(driverApplications).where(eq(driverApplications.id, driver.applicationId));
      result.push({ ...driver, application: application || void 0 });
    }
    return result;
  }
  // Chat Messages
  async getChatMessages(threadType, threadId) {
    if (threadType === "order") {
      return db.select().from(chatMessages).where(and(eq(chatMessages.threadType, "order"), eq(chatMessages.orderId, threadId))).orderBy(chatMessages.createdAt);
    } else {
      return db.select().from(chatMessages).where(and(eq(chatMessages.threadType, "admin_driver"), eq(chatMessages.driverId, threadId))).orderBy(chatMessages.createdAt);
    }
  }
  async createChatMessage(message) {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }
  // Stats
  async getAdminStats() {
    const allOrders = await db.select().from(orders);
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.filter((o) => o.status === "delivered").reduce((sum, o) => sum + Number(o.total), 0);
    const allDrivers = await db.select().from(drivers);
    const activeDrivers = allDrivers.filter((d) => d.status !== "offline").length;
    const allApplications = await db.select().from(driverApplications);
    const pendingApplications = allApplications.filter((a) => a.status === "pending").length;
    return { totalOrders, totalRevenue, activeDrivers, pendingApplications };
  }
  async getCustomerSignups() {
    const allUsers = await db.select({
      id: users.id,
      email: users.email,
      phone: users.phone,
      createdAt: users.createdAt
    }).from(users).orderBy(desc(users.createdAt));
    const allProfiles = await db.select().from(userProfiles);
    const allOrders = await db.select({
      customerId: orders.customerId,
      total: orders.total,
      status: orders.status
    }).from(orders);
    const profileMap = new Map(allProfiles.map((p) => [p.userId, p]));
    const ordersByUser = /* @__PURE__ */ new Map();
    for (const order of allOrders) {
      if (!order.customerId) continue;
      const existing = ordersByUser.get(order.customerId) || { count: 0, spent: 0 };
      existing.count += 1;
      if (order.status === "delivered") {
        existing.spent += Number(order.total);
      }
      ordersByUser.set(order.customerId, existing);
    }
    return allUsers.map((u) => {
      const profile = profileMap.get(u.id);
      const orderData = ordersByUser.get(u.id) || { count: 0, spent: 0 };
      return {
        id: u.id,
        email: u.email,
        phone: u.phone,
        firstName: profile?.firstName || null,
        lastName: profile?.lastName || null,
        role: profile?.role || "customer",
        address: profile?.address || null,
        onboardingCompleted: profile?.onboardingCompleted || false,
        createdAt: u.createdAt,
        orderCount: orderData.count,
        totalSpent: orderData.spent
      };
    });
  }
  // Settlements
  async getSettlement(driverId, weekStart) {
    const [settlement] = await db.select().from(settlements).where(and(eq(settlements.driverId, driverId), eq(settlements.weekStart, weekStart)));
    return settlement;
  }
  async getSettlementsByWeek(weekStart) {
    return db.select().from(settlements).where(eq(settlements.weekStart, weekStart));
  }
  async getSettlementsByDriver(driverId) {
    return db.select().from(settlements).where(eq(settlements.driverId, driverId)).orderBy(desc(settlements.weekStart));
  }
  async upsertSettlement(settlement) {
    const existing = await this.getSettlement(settlement.driverId, settlement.weekStart);
    if (existing) {
      const updateData = {
        totalEarnings: settlement.totalEarnings,
        deliveryCount: settlement.deliveryCount,
        weekEnd: settlement.weekEnd,
        status: settlement.status || existing.status
      };
      if (settlement.status === "paid" && existing.status !== "paid") {
        updateData.paidAt = /* @__PURE__ */ new Date();
      }
      if (settlement.notes !== void 0) updateData.notes = settlement.notes;
      const [updated] = await db.update(settlements).set(updateData).where(eq(settlements.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(settlements).values(settlement).returning();
    return created;
  }
  async updateSettlementStatus(id, status, notes) {
    const updateData = { status };
    if (status === "paid") updateData.paidAt = /* @__PURE__ */ new Date();
    if (notes !== void 0) updateData.notes = notes;
    const [updated] = await db.update(settlements).set(updateData).where(eq(settlements.id, id)).returning();
    return updated;
  }
  async getOrderItemsByOrderIds(orderIds) {
    if (orderIds.length === 0) return [];
    return db.select().from(orderItems).where(sql3`${orderItems.orderId} IN (${sql3.join(orderIds.map((id) => sql3`${id}`), sql3`, `)})`);
  }
  // App Settings
  async getAppSetting(key) {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting?.value ?? null;
  }
  async setAppSetting(key, value) {
    await db.insert(appSettings).values({ key, value }).onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: /* @__PURE__ */ new Date() }
    });
  }
  async getAllAppSettings() {
    return db.select().from(appSettings);
  }
  // Driver Referrals
  async getDriverByReferralCode(code) {
    const [driver] = await db.select().from(drivers).where(eq(drivers.referralCode, code.toUpperCase()));
    return driver;
  }
  async createDriverReferral(referral) {
    const [created] = await db.insert(driverReferrals).values(referral).returning();
    return created;
  }
  async getReferralsByDriver(driverId) {
    return db.select().from(driverReferrals).where(eq(driverReferrals.referrerDriverId, driverId)).orderBy(desc(driverReferrals.createdAt));
  }
  async getReferralCount(driverId) {
    const [result] = await db.select({ count: count() }).from(driverReferrals).where(eq(driverReferrals.referrerDriverId, driverId));
    return result?.count || 0;
  }
  async getFoundingDriverCount() {
    const [result] = await db.select({ count: count() }).from(drivers).where(
      and(eq(drivers.subscriptionExempt, true), sql3`${drivers.referredByDriverId} IS NULL`)
    );
    return result?.count || 0;
  }
  async getAllReferralStats() {
    const results = await db.select({
      driverId: driverReferrals.referrerDriverId,
      referralCount: count()
    }).from(driverReferrals).groupBy(driverReferrals.referrerDriverId);
    return results.map((r) => ({ driverId: r.driverId, referralCount: r.referralCount }));
  }
};
var storage = new DatabaseStorage();
async function seedProducts() {
  const CANONICAL_PRODUCTS = [
    { name: "9kg Gas Cylinder", size: "9kg", price: "280.71", description: "Standard household gas cylinder" },
    { name: "19kg Gas Cylinder", size: "19kg", price: "552.00", description: "Medium size gas cylinder" },
    { name: "48kg Gas Cylinder", size: "48kg", price: "1345.00", description: "Large commercial gas cylinder" }
  ];
  const existingProducts = await db.select().from(products);
  for (const canonical of CANONICAL_PRODUCTS) {
    const existing = existingProducts.find((p) => p.size === canonical.size);
    if (!existing) {
      await db.insert(products).values(canonical);
      console.log(`Seeded product: ${canonical.name}`);
    } else if (Number(existing.price) !== Number(canonical.price)) {
      await db.update(products).set({ price: canonical.price }).where(eq(products.id, existing.id));
      console.log(`Updated price for ${canonical.name}: ${existing.price} -> ${canonical.price}`);
    }
  }
  const testProduct = existingProducts.find((p) => p.size === "Test");
  if (testProduct) {
    await db.delete(products).where(eq(products.id, testProduct.id));
    console.log("Removed test cylinder product");
  }
}

// server/auth.ts
import bcrypt from "bcryptjs";
import crypto from "crypto";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { eq as eq2, or, and as and2, gt } from "drizzle-orm";

// server/rate-limit.ts
var store = /* @__PURE__ */ new Map();
setInterval(() => {
  const now = Date.now();
  store.forEach((entry, key) => {
    if (entry.resetAt <= now) store.delete(key);
  });
}, 6e4).unref();
function rateLimit(options) {
  const { windowMs, max, message = "Too many requests, please try again later" } = options;
  return (req, res, next) => {
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `${ip}:${req.path}`;
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    entry.count++;
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1e3);
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({ error: message });
    }
    next();
  };
}
var authRateLimit = rateLimit({
  windowMs: 5 * 60 * 1e3,
  max: 10,
  message: "Too many login attempts. Please try again in 5 minutes."
});

// server/email.ts
async function sendOrderConfirmationEmail(to, name, orderDetails) {
  console.log(`[email] Order confirmation for ${name} <${to}> \u2014 order ${orderDetails.orderId}, total ${orderDetails.total}`);
}
async function sendPasswordResetEmail(to, name, resetLink) {
  console.log(`[email] Password reset for ${name} <${to}> \u2014 link: ${resetLink}`);
}

// server/auth.ts
function isEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
function normalizePhone(value) {
  let digits = value.replace(/[\s\-().]/g, "");
  if (digits.startsWith("+27")) {
    digits = "0" + digits.slice(3);
  } else if (digits.startsWith("27") && digits.length === 11) {
    digits = "0" + digits.slice(2);
  }
  return digits;
}
function isPhone(value) {
  const normalized = normalizePhone(value);
  return /^0\d{9}$/.test(normalized);
}
function setupSession(app2) {
  const sessionTtl = 7 * 24 * 60 * 60 * 1e3;
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    pool,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions"
  });
  app2.set("trust proxy", 1);
  app2.use(
    session({
      secret: process.env.SESSION_SECRET,
      store: sessionStore,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: true,
        sameSite: "lax",
        maxAge: sessionTtl
      }
    })
  );
}
var isAuthenticated = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  req.userId = req.session.userId;
  next();
};
function userResponse(user) {
  return {
    id: user.id,
    email: user.email || null,
    phone: user.phone || null,
    firstName: user.firstName,
    lastName: user.lastName
  };
}
function registerAuthRoutes(app2) {
  app2.post("/api/auth/register", authRateLimit, async (req, res) => {
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
      if (normalizedEmail) conditions.push(eq2(users.email, normalizedEmail));
      if (normalizedPhone) conditions.push(eq2(users.phone, normalizedPhone));
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
      const [user] = await db.insert(users).values({
        email: normalizedEmail,
        phone: normalizedPhone,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null
      }).returning();
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
  app2.post("/api/auth/login", authRateLimit, async (req, res) => {
    try {
      const { identifier, password } = req.body;
      console.log("[LOGIN] Attempt for:", identifier);
      if (!identifier || !password) {
        console.log("[LOGIN] Missing identifier or password");
        return res.status(400).json({ error: "Email/mobile number and password are required" });
      }
      const trimmed = identifier.trim();
      let user;
      if (isEmail(trimmed)) {
        console.log("[LOGIN] Email lookup:", trimmed.toLowerCase());
        const results = await db.select().from(users).where(eq2(users.email, trimmed.toLowerCase()));
        user = results[0];
        console.log("[LOGIN] User found:", !!user);
      } else {
        const normalized = normalizePhone(trimmed);
        console.log("[LOGIN] Phone lookup:", normalized);
        if (isPhone(normalized)) {
          const results = await db.select().from(users).where(eq2(users.phone, normalized));
          user = results[0];
          console.log("[LOGIN] User found:", !!user);
        } else {
          console.log("[LOGIN] Not a valid phone number");
        }
      }
      if (!user) {
        console.log("[LOGIN] No user found for:", trimmed);
        return res.status(401).json({ error: "Invalid credentials" });
      }
      const valid = await bcrypt.compare(password, user.passwordHash);
      console.log("[LOGIN] Password valid:", valid, "hash length:", user.passwordHash?.length);
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
  app2.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Logout failed" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logged out" });
    });
  });
  app2.get("/api/auth/user", async (req, res) => {
    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    try {
      const [user] = await db.select().from(users).where(eq2(users.id, req.session.userId));
      if (!user) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      res.json(userResponse(user));
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });
  app2.post("/api/auth/forgot-password", authRateLimit, async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || !isEmail(email.trim())) {
        return res.status(400).json({ error: "Please enter a valid email address" });
      }
      const normalizedEmail = email.trim().toLowerCase();
      const [user] = await db.select().from(users).where(eq2(users.email, normalizedEmail));
      res.json({ message: "If an account with that email exists, we've sent a password reset link." });
      if (!user) return;
      await db.update(passwordResetTokens).set({ used: true }).where(and2(eq2(passwordResetTokens.userId, user.id), eq2(passwordResetTokens.used, false)));
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1e3);
      await db.insert(passwordResetTokens).values({
        userId: user.id,
        token,
        expiresAt
      });
      const baseUrl = process.env.APP_URL || "https://www.gaslite.co.za";
      const resetLink = `${baseUrl}/auth/reset-password?token=${token}`;
      const name = user.firstName || "there";
      sendPasswordResetEmail(normalizedEmail, name, resetLink).catch((err) => {
        console.error("Background password reset email error:", err);
      });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  });
  app2.post("/api/auth/reset-password", authRateLimit, async (req, res) => {
    try {
      const { token, password } = req.body;
      if (!token) {
        return res.status(400).json({ error: "Reset token is required" });
      }
      if (!password || password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }
      const [resetToken] = await db.select().from(passwordResetTokens).where(
        and2(
          eq2(passwordResetTokens.token, token),
          eq2(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, /* @__PURE__ */ new Date())
        )
      );
      if (!resetToken) {
        return res.status(400).json({ error: "This reset link is invalid or has expired. Please request a new one." });
      }
      const passwordHash = await bcrypt.hash(password, 12);
      await db.update(users).set({ passwordHash }).where(eq2(users.id, resetToken.userId));
      await db.update(passwordResetTokens).set({ used: true }).where(eq2(passwordResetTokens.id, resetToken.id));
      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ error: "Something went wrong. Please try again." });
    }
  });
}

// server/routes.ts
import multer from "multer";

// server/replit_integrations/object_storage/objectStorage.ts
var ObjectNotFoundError = class _ObjectNotFoundError extends Error {
  constructor() {
    super("Object not found");
    this.name = "ObjectNotFoundError";
    Object.setPrototypeOf(this, _ObjectNotFoundError.prototype);
  }
};
var ObjectStorageService = class {
  getPublicObjectSearchPaths() {
    return [];
  }
  getPrivateObjectDir() {
    return "";
  }
  async searchPublicObject(_filePath) {
    return null;
  }
  async downloadObject(_file, res) {
    res.status(503).json({ error: "File storage not available" });
  }
  async getObjectEntityUploadURL() {
    throw new Error("File upload not available on this deployment");
  }
  normalizeObjectEntityPath(rawPath) {
    return rawPath;
  }
  async trySetObjectEntityAclPolicy(rawPath, _policy) {
    return rawPath;
  }
  async getObjectEntityFile(_objectPath) {
    throw new ObjectNotFoundError();
  }
  async canAccessObjectEntity(_opts) {
    return false;
  }
};

// server/routes.ts
import { eq as eq4 } from "drizzle-orm";

// server/push.ts
import webpush from "web-push";
import { eq as eq3 } from "drizzle-orm";
var vapidPublicKey = process.env.VAPID_PUBLIC_KEY?.trim();
var vapidPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim();
var vapidSubject = (process.env.VAPID_SUBJECT || "mailto:support@gaslite.co.za").trim();
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
  } catch (err) {
    console.error("[push] Invalid VAPID keys \u2014 push notifications disabled:", err);
  }
}
async function saveSubscription(userId, subscription) {
  const existing = await db.select().from(pushSubscriptions).where(eq3(pushSubscriptions.endpoint, subscription.endpoint));
  if (existing.length > 0) {
    await db.update(pushSubscriptions).set({ userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth }).where(eq3(pushSubscriptions.endpoint, subscription.endpoint));
  } else {
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth
    });
  }
}
async function removeSubscription(endpoint) {
  await db.delete(pushSubscriptions).where(eq3(pushSubscriptions.endpoint, endpoint));
}
async function sendToUser(userId, payload) {
  const subs = await db.select().from(pushSubscriptions).where(eq3(pushSubscriptions.userId, userId));
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq3(pushSubscriptions.id, sub.id));
      }
    }
  }
}
async function notifyDriversNewOrder(orderId, orderNumber, deliveryAddress, itemsSummary) {
  const allDrivers = await storage.getDrivers();
  const availableDrivers = allDrivers.filter((d) => d.status === "available");
  const body = itemsSummary ? `${itemsSummary} \u2014 deliver to ${deliveryAddress}` : `Order ${orderNumber} needs delivery to ${deliveryAddress}`;
  for (const driver of availableDrivers) {
    await sendToUser(driver.userId, {
      title: "New Order Available",
      body,
      url: "/",
      tag: `new-order-${orderId}`,
      type: "new-order",
      orderId
    });
  }
}
async function notifyCustomerOrderUpdate(customerId, orderNumber, status) {
  const messages = {
    assigned: "A driver has been assigned to your order",
    picked_up: "Your gas has been picked up and is on its way",
    in_transit: "Your delivery is in transit",
    delivered: "Your gas has been delivered! Enjoy",
    cancelled: "Your order has been cancelled"
  };
  const body = messages[status] || `Your order status is now: ${status}`;
  await sendToUser(customerId, {
    title: `Order ${orderNumber} Update`,
    body,
    url: "/",
    tag: `order-update-${orderNumber}`
  });
}
async function notifyDriverApplicationUpdate(userId, status, reviewNotes) {
  if (status === "approved") {
    await sendToUser(userId, {
      title: "Application Approved!",
      body: "Congratulations! Your driver application has been approved. You can now go online and start accepting deliveries.",
      url: "/",
      tag: "application-approved"
    });
  } else if (status === "rejected") {
    const reason = reviewNotes ? ` Reason: ${reviewNotes}` : "";
    await sendToUser(userId, {
      title: "Application Update",
      body: `Your driver application was not approved.${reason} Please contact support for more information.`,
      url: "/",
      tag: "application-rejected"
    });
  }
}
async function notifyDriverOrderCancelled(driverId, orderNumber) {
  const driver = await storage.getDriver(driverId);
  if (!driver) return;
  await sendToUser(driver.userId, {
    title: "Order Cancelled",
    body: `Order ${orderNumber} has been cancelled by the customer`,
    url: "/",
    tag: `order-cancelled-${orderNumber}`
  });
}

// server/yoco.ts
var YOCO_API_URL = "https://payments.yoco.com/api/checkouts";
async function createYocoCheckout(params) {
  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("YOCO_SECRET_KEY is not configured");
  }
  if (params.amountInCents < 200) {
    throw new Error("Minimum payment amount is R2.00 (200 cents)");
  }
  const body = {
    amount: params.amountInCents,
    currency: "ZAR",
    successUrl: `${params.baseUrl}/payment/success?orderId=${params.orderId}`,
    cancelUrl: `${params.baseUrl}/payment/cancel?orderId=${params.orderId}`,
    failureUrl: `${params.baseUrl}/payment/failure?orderId=${params.orderId}`,
    metadata: {
      orderId: params.orderId,
      orderNumber: params.orderNumber
    }
  };
  if (params.lineItems) {
    body.lineItems = params.lineItems;
  }
  if (params.subtotalInCents) {
    body.subtotalAmount = params.subtotalInCents;
  }
  if (params.taxInCents) {
    body.totalTaxAmount = params.taxInCents;
  }
  const response = await fetch(YOCO_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`
    },
    body: JSON.stringify(body)
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Yoco checkout creation failed:", response.status, errorText);
    throw new Error(`Yoco checkout creation failed: ${response.status}`);
  }
  return response.json();
}
async function getYocoCheckoutStatus(checkoutId) {
  const secretKey = process.env.YOCO_SECRET_KEY;
  if (!secretKey) {
    throw new Error("YOCO_SECRET_KEY is not configured");
  }
  const response = await fetch(`${YOCO_API_URL}/${checkoutId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`
    }
  });
  if (!response.ok) {
    const errorText = await response.text();
    console.error("Yoco checkout status check failed:", response.status, errorText);
    throw new Error(`Yoco checkout status check failed: ${response.status}`);
  }
  return response.json();
}

// server/routes.ts
var upload = multer({ storage: multer.memoryStorage() });
async function registerRoutes(httpServer, app2) {
  await seedProducts();
  const objectStorageService = new ObjectStorageService();
  app2.get("/api/config/maps-key", (req, res) => {
    const key = process.env.GOOGLE_MAPS_API_KEY;
    if (!key) {
      return res.status(404).json({ error: "Maps API key not configured" });
    }
    res.json({ key });
  });
  app2.get("/api/products", async (req, res) => {
    try {
      const products2 = await storage.getProducts();
      res.json(products2.filter((p) => p.size !== "Test"));
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });
  app2.post("/api/driver-applications", isAuthenticated, async (req, res) => {
    try {
      const data = insertDriverApplicationSchema.parse(req.body);
      data.userId = req.userId;
      const application = await storage.createDriverApplication(data);
      res.json(application);
    } catch (error) {
      res.status(400).json({ error: "Invalid application data" });
    }
  });
  app2.post("/api/upload", upload.single("file"), async (req, res) => {
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
          "Content-Type": req.file.mimetype || "application/octet-stream"
        }
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
  app2.post("/api/uploads/request-url", isAuthenticated, async (req, res) => {
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
          contentType: contentType || "application/octet-stream"
        }
      });
    } catch (error) {
      console.error("Request upload URL error:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });
  app2.get("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({
          userId,
          role: "customer"
        });
      }
      res.json(profile);
    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ error: "Failed to fetch profile" });
    }
  });
  app2.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const profile = await storage.updateUserProfile(userId, req.body);
      res.json(profile);
    } catch (error) {
      res.status(500).json({ error: "Failed to update profile" });
    }
  });
  app2.post("/api/onboarding/customer", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const { firstName, lastName, phone, address, latitude, longitude } = req.body;
      if (!firstName || !lastName || !phone || !address) {
        return res.status(400).json({ error: "All fields are required" });
      }
      let profile = await storage.getUserProfile(userId);
      if (!profile) {
        profile = await storage.createUserProfile({ userId, role: "customer" });
      }
      const updateData = {
        firstName,
        lastName,
        phone,
        address,
        role: "customer",
        onboardingCompleted: true
      };
      if (latitude != null && longitude != null) {
        updateData.latitude = String(latitude);
        updateData.longitude = String(longitude);
      }
      const updated = await storage.updateUserProfile(userId, updateData);
      res.json(updated);
    } catch (error) {
      console.error("Customer onboarding error:", error);
      res.status(500).json({ error: "Failed to complete onboarding" });
    }
  });
  app2.post("/api/onboarding/driver", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const { firstName, lastName, email, phone, address, licenseNumber, vehicleRegistration, licenseDocumentUrl, vehicleDocumentUrl, bankName, branchCode, accountNumber, accountType, referralCode } = req.body;
      if (!firstName || !lastName || !email || !phone || !address || !licenseNumber || !vehicleRegistration) {
        return res.status(400).json({ error: "All required fields must be filled" });
      }
      if (referralCode) {
        const referrer = await storage.getDriverByReferralCode(referralCode);
        if (!referrer) {
          return res.status(400).json({ error: "Invalid referral code. Please check and try again." });
        }
        const launchActive = await storage.getAppSetting("launch_special_active");
        if (launchActive !== "true") {
          return res.status(400).json({ error: "The referral program is not currently active." });
        }
        const limitStr = await storage.getAppSetting("referral_limit_per_driver");
        const limit = parseInt(limitStr || "50");
        const count2 = await storage.getReferralCount(referrer.id);
        if (count2 >= limit) {
          return res.status(400).json({ error: "This driver has reached their referral limit." });
        }
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
        referralCode: referralCode || null
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
        onboardingCompleted: true
      });
      res.json({ application, message: "Application submitted successfully" });
    } catch (error) {
      console.error("Driver onboarding error:", error);
      res.status(500).json({ error: "Failed to submit driver application" });
    }
  });
  app2.get("/api/user/driver-application", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const application = await storage.getDriverApplicationByUserId(userId);
      const driver = await storage.getDriverByUserId(userId);
      res.json({ application: application || null, driver: driver || null });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch application status" });
    }
  });
  app2.post("/api/user/switch-role", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
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
  app2.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const orders2 = await storage.getOrdersByCustomer(userId);
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.get("/api/orders/frequent-products", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const customerOrders = await storage.getOrdersByCustomer(userId);
      const deliveredOrders = customerOrders.filter((o) => o.status === "delivered");
      const productCounts = {};
      for (const order of deliveredOrders) {
        const orderWithItems = await storage.getOrderWithItems(order.id);
        if (orderWithItems) {
          for (const item of orderWithItems.items) {
            if (!productCounts[item.productId]) {
              productCounts[item.productId] = {
                productId: item.productId,
                productName: item.productName,
                productSize: item.productSize,
                count: 0
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
  app2.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const { items, deliveryAddress, deliveryLatitude, deliveryLongitude, deliveryNotes, paymentMethod } = req.body;
      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "Order must have items" });
      }
      if (!deliveryAddress) {
        return res.status(400).json({ error: "Delivery address required" });
      }
      const method = "card";
      const orderItems2 = [];
      let subtotal = 0;
      for (const item of items) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ error: `Product ${item.productId} not found` });
        }
        const totalPrice = Number(product.price) * item.quantity;
        subtotal += totalPrice;
        orderItems2.push({
          orderId: "",
          productId: product.id,
          productName: product.name,
          productSize: product.size,
          quantity: item.quantity,
          unitPrice: product.price,
          totalPrice: totalPrice.toFixed(2)
        });
      }
      const isTestOrder = orderItems2.some((i) => i.productSize === "Test");
      const serviceFee = isTestOrder ? 1 : 29;
      const cardProcessingFee = method === "card" ? Math.round(subtotal * 0.026 * 1.15 * 100) / 100 : 0;
      const total = subtotal + cardProcessingFee;
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
          paymentStatus: "pending"
        },
        orderItems2
      );
      const protocol = req.headers["x-forwarded-proto"] || req.protocol || "https";
      const host = req.headers["x-forwarded-host"] || req.headers.host;
      const baseUrl = `${protocol}://${host}`;
      try {
        const amountInCents = Math.round(total * 100);
        const lineItems = orderItems2.map((item) => ({
          displayName: `${item.productName} (${item.productSize})`,
          quantity: item.quantity,
          pricingDetails: {
            price: Math.round(Number(item.unitPrice) * 100)
          }
        }));
        const checkout = await createYocoCheckout({
          amountInCents,
          orderId: order.id,
          orderNumber: order.orderNumber,
          baseUrl,
          lineItems,
          subtotalInCents: Math.round(subtotal * 100),
          taxInCents: Math.round(cardProcessingFee * 100)
        });
        await storage.updateOrder(order.id, {
          yocoCheckoutId: checkout.id
        });
        res.json({
          ...order,
          yocoCheckoutId: checkout.id,
          redirectUrl: checkout.redirectUrl
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
  app2.post("/api/orders/:orderId/cancel", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
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
            notifyDriverOrderCancelled(driverRecord.id, order.orderNumber).catch(
              (err) => console.error("Push notification to driver failed:", err)
            );
          }
        } else {
          await storage.updateDriver(driver.id, { status: "available" });
          notifyDriverOrderCancelled(driver.id, order.orderNumber).catch(
            (err) => console.error("Push notification to driver failed:", err)
          );
        }
      }
      const updated = await storage.updateOrder(order.id, {
        status: "cancelled",
        driverId: null,
        driverEarnings: null
      });
      res.json(updated);
    } catch (error) {
      console.error("Order cancellation error:", error);
      res.status(500).json({ error: "Failed to cancel order" });
    }
  });
  app2.post("/api/payments/verify/:orderId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
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
            const [user] = await db.select().from(users).where(eq4(users.id, userId));
            const profile = await storage.getUserProfile(userId);
            const customerEmail = user?.email;
            const customerName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Valued Customer";
            if (customerEmail && updatedOrder) {
              const orderDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-ZA", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              });
              await sendOrderConfirmationEmail({
                customerName,
                customerEmail,
                orderId: order.id,
                orderDate,
                deliveryAddress: order.deliveryAddress,
                items: updatedOrder.items.map((item) => ({
                  productName: item.productName,
                  productSize: item.productSize,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  totalPrice: item.totalPrice
                })),
                subtotal: order.subtotal,
                serviceFee: order.serviceFee,
                cardProcessingFee: order.cardProcessingFee,
                total: order.total
              });
            }
          } catch (emailError) {
            console.error("Background email send failed:", emailError);
          }
        })();
        const itemsSummary = updatedOrder?.items?.map((item) => `${item.quantity}x ${item.productSize}`).join(", ") || "";
        notifyDriversNewOrder(order.id, order.orderNumber, order.deliveryAddress, itemsSummary).catch(
          (err) => console.error("Push notification to drivers failed:", err)
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
  app2.post("/api/webhooks/yoco", async (req, res) => {
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
                  const [user] = await db.select().from(users).where(eq4(users.id, order.customerId));
                  const profile = await storage.getUserProfile(order.customerId);
                  const customerEmail = user?.email;
                  const customerName = profile?.firstName ? `${profile.firstName} ${profile.lastName || ""}`.trim() : user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Valued Customer";
                  if (customerEmail && updatedOrder) {
                    const orderDate = (/* @__PURE__ */ new Date()).toLocaleDateString("en-ZA", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    });
                    await sendOrderConfirmationEmail({
                      customerName,
                      customerEmail,
                      orderId: order.id,
                      orderDate,
                      deliveryAddress: order.deliveryAddress,
                      items: updatedOrder.items.map((item) => ({
                        productName: item.productName,
                        productSize: item.productSize,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.totalPrice
                      })),
                      subtotal: order.subtotal,
                      serviceFee: order.serviceFee,
                      cardProcessingFee: order.cardProcessingFee,
                      total: order.total
                    });
                  }
                } catch (emailError) {
                  console.error("Webhook background email send failed:", emailError);
                }
              })();
              const webhookItemsSummary = updatedOrder?.items?.map((item) => `${item.quantity}x ${item.productSize}`).join(", ") || "";
              notifyDriversNewOrder(order.id, order.orderNumber, order.deliveryAddress, webhookItemsSummary).catch(
                (err) => console.error("Webhook push notification to drivers failed:", err)
              );
            } catch (verifyError) {
              console.error("Webhook Yoco verification failed:", verifyError);
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
  app2.get("/api/orders/:orderId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const orderWithItems = await storage.getOrderWithItems(req.params.orderId);
      if (!orderWithItems || orderWithItems.customerId !== userId) {
        return res.status(404).json({ error: "Order not found" });
      }
      res.json(orderWithItems);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch order" });
    }
  });
  const isDriver = async (req, res, next) => {
    try {
      const userId = req.userId;
      const profile = await storage.getUserProfile(userId);
      if (!profile || profile.role !== "driver") {
        return res.status(403).json({ error: "Driver access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization failed" });
    }
  };
  app2.get("/api/driver/me", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ error: "No driver record" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to check driver status" });
    }
  });
  app2.get("/api/driver/profile", isAuthenticated, isDriver, async (req, res) => {
    try {
      const userId = req.userId;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }
      res.json(driver);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch driver profile" });
    }
  });
  app2.patch("/api/driver/status", isAuthenticated, isDriver, async (req, res) => {
    try {
      const userId = req.userId;
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
  app2.post("/api/driver/location", isAuthenticated, isDriver, async (req, res) => {
    try {
      const userId = req.userId;
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
        locationUpdatedAt: /* @__PURE__ */ new Date()
      });
      res.json({ success: true, location: { latitude, longitude } });
    } catch (error) {
      res.status(500).json({ error: "Failed to update location" });
    }
  });
  app2.get("/api/driver/orders", isAuthenticated, isDriver, async (req, res) => {
    try {
      const userId = req.userId;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }
      const orders2 = await storage.getOrdersByDriver(driver.id);
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.get("/api/driver/earnings", isAuthenticated, isDriver, async (req, res) => {
    try {
      const userId = req.userId;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }
      const allOrders = await storage.getOrdersByDriver(driver.id);
      const delivered = allOrders.filter((o) => o.status === "delivered" && o.driverEarnings);
      const now = /* @__PURE__ */ new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(startOfToday);
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      let totalEarnings = 0;
      let todayEarnings = 0;
      let weekEarnings = 0;
      let monthEarnings = 0;
      for (const o of delivered) {
        const amount = Number(o.driverEarnings);
        totalEarnings += amount;
        const orderDate = new Date(o.deliveredAt || o.createdAt);
        if (orderDate >= startOfToday) todayEarnings += amount;
        if (orderDate >= startOfWeek) weekEarnings += amount;
        if (orderDate >= startOfMonth) monthEarnings += amount;
      }
      res.json({
        totalEarnings: totalEarnings.toFixed(2),
        todayEarnings: todayEarnings.toFixed(2),
        weekEarnings: weekEarnings.toFixed(2),
        monthEarnings: monthEarnings.toFixed(2),
        totalDeliveries: delivered.length
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch earnings" });
    }
  });
  function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
  app2.get("/api/driver/available-orders", isAuthenticated, isDriver, async (req, res) => {
    try {
      const userId = req.userId;
      const driver = await storage.getDriverByUserId(userId);
      const availableOrders = await storage.getAvailableOrders();
      if (driver?.currentLatitude && driver?.currentLongitude) {
        const driverLat = Number(driver.currentLatitude);
        const driverLon = Number(driver.currentLongitude);
        const ordersWithDistance = availableOrders.map((order) => {
          let distance = null;
          if (order.deliveryLatitude && order.deliveryLongitude) {
            distance = haversineDistance(
              driverLat,
              driverLon,
              Number(order.deliveryLatitude),
              Number(order.deliveryLongitude)
            );
          }
          return { ...order, distance };
        }).filter((order) => order.distance === null || order.distance <= 10).sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999));
        return res.json(ordersWithDistance);
      }
      res.json(availableOrders);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch available orders" });
    }
  });
  app2.post("/api/driver/accept-order/:orderId", isAuthenticated, isDriver, async (req, res) => {
    try {
      const userId = req.userId;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }
      if (driver.status !== "available") {
        return res.status(400).json({ error: "You must be available to accept orders" });
      }
      const order = await storage.getOrderWithItems(req.params.orderId);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (order.driverId || order.status !== "pending") {
        return res.status(400).json({ error: "Order is no longer available" });
      }
      const COMMISSION_RATES2 = { "9kg": 80, "19kg": 200, "48kg": 500 };
      let totalCommission = 0;
      for (const item of order.items || []) {
        const rate = COMMISSION_RATES2[item.productSize] || 0;
        totalCommission += rate * item.quantity;
      }
      const updated = await storage.updateOrder(order.id, {
        driverId: driver.id,
        status: "assigned",
        estimatedDeliveryTime: 30,
        driverEarnings: totalCommission.toFixed(2)
      });
      await storage.updateDriver(driver.id, { status: "busy" });
      res.json(updated);
      notifyCustomerOrderUpdate(order.customerId, order.orderNumber, "assigned").catch(
        (err) => console.error("Push notification to customer failed:", err)
      );
    } catch (error) {
      res.status(500).json({ error: "Failed to accept order" });
    }
  });
  app2.patch("/api/driver/orders/:orderId", isAuthenticated, isDriver, async (req, res) => {
    try {
      const userId = req.userId;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) {
        return res.status(404).json({ error: "Driver profile not found" });
      }
      const order = await storage.getOrder(req.params.orderId);
      if (!order || order.driverId !== driver.id) {
        return res.status(404).json({ error: "Order not found" });
      }
      const { status } = req.body;
      const validTransitions = {
        assigned: ["picked_up", "cancelled"],
        picked_up: ["in_transit"],
        in_transit: ["delivered"],
        in_progress: ["delivered"]
      };
      const allowed = validTransitions[order.status];
      if (!allowed || !allowed.includes(status)) {
        return res.status(400).json({ error: `Cannot transition from ${order.status} to ${status}` });
      }
      const updateData = { status };
      if (status === "picked_up") {
        updateData.pickedUpAt = /* @__PURE__ */ new Date();
      }
      if (status === "delivered") {
        updateData.deliveredAt = /* @__PURE__ */ new Date();
        const commissionRates = {
          "9kg": 80,
          "19kg": 200,
          "48kg": 500
        };
        const orderWithItems = await storage.getOrderWithItems(order.id);
        let commission = 0;
        if (orderWithItems?.items) {
          for (const item of orderWithItems.items) {
            const rate = commissionRates[item.productSize] || 0;
            commission += rate * (item.quantity || 1);
          }
        }
        updateData.driverEarnings = commission.toFixed(2);
        const currentTotal = parseFloat(driver.totalEarnings?.toString() || "0");
        await storage.updateDriver(driver.id, {
          totalDeliveries: (driver.totalDeliveries || 0) + 1,
          totalEarnings: (currentTotal + commission).toFixed(2),
          status: "available"
        });
      }
      const updated = await storage.updateOrder(order.id, updateData);
      res.json(updated);
      notifyCustomerOrderUpdate(order.customerId, order.orderNumber, status).catch(
        (err) => console.error("Push notification to customer failed:", err)
      );
    } catch (error) {
      res.status(500).json({ error: "Failed to update order" });
    }
  });
  app2.get("/api/orders/:orderId/tracking", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const orderId = req.params.orderId;
      const order = await storage.getOrder(orderId);
      if (!order || order.customerId !== userId) {
        return res.status(404).json({ error: "Order not found" });
      }
      if (!order.driverId) {
        return res.json({
          orderId: order.id,
          status: order.status,
          driverLocation: null,
          estimatedDeliveryTime: order.estimatedDeliveryTime
        });
      }
      const driver = await storage.getDriver(order.driverId);
      const driverApp = driver ? await storage.getDriverApplicationByUserId(driver.userId) : null;
      const locationAge = driver?.locationUpdatedAt ? (Date.now() - new Date(driver.locationUpdatedAt).getTime()) / 1e3 : null;
      res.json({
        orderId: order.id,
        status: order.status,
        estimatedDeliveryTime: order.estimatedDeliveryTime,
        pickedUpAt: order.pickedUpAt,
        driverLocation: driver?.currentLatitude && driver?.currentLongitude ? {
          latitude: Number(driver.currentLatitude),
          longitude: Number(driver.currentLongitude)
        } : null,
        locationUpdatedAt: driver?.locationUpdatedAt || null,
        locationStale: locationAge !== null && locationAge > 60,
        driverInfo: driverApp ? {
          firstName: driverApp.firstName,
          lastName: driverApp.lastName,
          phone: driverApp.phone,
          vehicleRegistration: driverApp.vehicleRegistration
        } : null,
        deliveryLocation: order.deliveryLatitude && order.deliveryLongitude ? {
          latitude: Number(order.deliveryLatitude),
          longitude: Number(order.deliveryLongitude)
        } : null
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch tracking info" });
    }
  });
  const isAdmin = async (req, res, next) => {
    try {
      const userId = req.userId;
      const profile = await storage.getUserProfile(userId);
      if (!profile || profile.role !== "admin") {
        return res.status(403).json({ error: "Admin access required" });
      }
      next();
    } catch (error) {
      res.status(500).json({ error: "Authorization failed" });
    }
  };
  app2.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const stats = await storage.getAdminStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch stats" });
    }
  });
  app2.get("/api/admin/customers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const customers = await storage.getCustomerSignups();
      res.json(customers);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch customers" });
    }
  });
  app2.get("/api/admin/orders", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orders2 = await storage.getOrders();
      res.json(orders2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });
  app2.patch("/api/admin/orders/:orderId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, driverId } = req.body;
      const updateData = {};
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
  app2.get("/api/admin/driver-applications", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const applications = await storage.getDriverApplications();
      res.json(applications);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch applications" });
    }
  });
  app2.patch("/api/admin/driver-applications/:applicationId", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status, reviewNotes } = req.body;
      const applicationId = req.params.applicationId;
      const reviewerId = req.userId;
      const application = await storage.getDriverApplication(applicationId);
      if (!application) {
        return res.status(404).json({ error: "Application not found" });
      }
      const updated = await storage.updateDriverApplication(applicationId, {
        status,
        reviewNotes,
        reviewedAt: /* @__PURE__ */ new Date(),
        reviewedBy: reviewerId
      });
      if (status === "approved" && application.userId) {
        const existingDriver = await storage.getDriverByUserId(application.userId);
        if (!existingDriver) {
          const referralCodeGen = "GL-" + Math.random().toString(36).substring(2, 8).toUpperCase();
          let subscriptionExempt = false;
          let referredByDriverId = null;
          const appReferralCode = application.referralCode;
          if (appReferralCode) {
            const referrer = await storage.getDriverByReferralCode(appReferralCode);
            if (referrer) {
              referredByDriverId = referrer.id;
              subscriptionExempt = true;
            }
          } else {
            const launchActive = await storage.getAppSetting("launch_special_active");
            if (launchActive === "true") {
              const limitStr = await storage.getAppSetting("founding_driver_limit");
              const limit = parseInt(limitStr || "50");
              const currentCount = await storage.getFoundingDriverCount();
              if (currentCount < limit) {
                subscriptionExempt = true;
              }
            }
          }
          const newDriver = await storage.createDriver({
            userId: application.userId,
            applicationId,
            status: "offline",
            referralCode: referralCodeGen,
            referredByDriverId,
            subscriptionExempt
          });
          if (referredByDriverId) {
            await storage.createDriverReferral({
              referrerDriverId: referredByDriverId,
              referredDriverId: newDriver.id
            });
          }
        }
        await storage.updateUserProfile(application.userId, { role: "driver" });
      }
      if (application.userId && (status === "approved" || status === "rejected")) {
        notifyDriverApplicationUpdate(application.userId, status, reviewNotes).catch(
          (err) => console.error("Push notification for application update failed:", err)
        );
      }
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: "Failed to update application" });
    }
  });
  app2.get("/api/admin/drivers", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const drivers2 = await storage.getDriversWithApplications();
      res.json(drivers2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch drivers" });
    }
  });
  app2.get("/api/admin/orders/:orderId/items", isAuthenticated, isAdmin, async (req, res) => {
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
  function getFridayWeekBounds(weekOffset = 0) {
    const now = /* @__PURE__ */ new Date();
    const day = now.getDay();
    const diffToFriday = day >= 5 ? day - 5 : day + 2;
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - diffToFriday + weekOffset * 7);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return { weekStart, weekEnd };
  }
  const COMMISSION_RATES = {
    "9kg": 80,
    "19kg": 200,
    "48kg": 500,
    "Test": 1
  };
  app2.get("/api/admin/driver-earnings", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const weekOffset = parseInt(req.query.weekOffset) || 0;
      const { weekStart, weekEnd } = getFridayWeekBounds(weekOffset);
      const allDrivers = await storage.getDriversWithApplications();
      const allOrders = await storage.getOrders();
      const existingSettlements = await storage.getSettlementsByWeek(weekStart);
      const settlementMap = new Map(existingSettlements.map((s) => [s.driverId, s]));
      const weekOrders = allOrders.filter((o) => {
        if (o.status !== "delivered") return false;
        const orderDate = new Date(o.deliveredAt || o.createdAt);
        return orderDate >= weekStart && orderDate <= weekEnd;
      });
      const weekOrderIds = weekOrders.map((o) => o.id);
      const allItems = await storage.getOrderItemsByOrderIds(weekOrderIds);
      const itemsByOrder = /* @__PURE__ */ new Map();
      for (const item of allItems) {
        const existing = itemsByOrder.get(item.orderId) || [];
        existing.push(item);
        itemsByOrder.set(item.orderId, existing);
      }
      const driverEarnings = allDrivers.map((driver) => {
        const driverWeekOrders = weekOrders.filter((o) => o.driverId === driver.id);
        let weekEarnings = 0;
        const deliveries = driverWeekOrders.map((order) => {
          const items = itemsByOrder.get(order.id) || [];
          let commission = 0;
          for (const item of items) {
            const rate = COMMISSION_RATES[item.productSize] || 0;
            commission += rate * (item.quantity || 1);
          }
          weekEarnings += commission;
          return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            deliveredAt: order.deliveredAt || order.createdAt,
            items: items.map((i) => ({
              productSize: i.productSize,
              quantity: i.quantity,
              commission: (COMMISSION_RATES[i.productSize] || 0) * (i.quantity || 1)
            })),
            commission: commission.toFixed(2)
          };
        });
        const allTimeOrders = allOrders.filter((o) => o.driverId === driver.id && o.status === "delivered");
        let allTimeEarnings = 0;
        for (const o of allTimeOrders) {
          allTimeEarnings += Number(o.driverEarnings) || 0;
        }
        const settlement = settlementMap.get(driver.id);
        return {
          driverId: driver.id,
          driverName: driver.application ? `${driver.application.firstName} ${driver.application.lastName}` : "Unknown",
          phone: driver.application?.phone || null,
          bankName: driver.application?.bankName || null,
          accountNumber: driver.application?.accountNumber || null,
          status: driver.status,
          weekDeliveries: driverWeekOrders.length,
          weekEarnings: weekEarnings.toFixed(2),
          allTimeEarnings: allTimeEarnings.toFixed(2),
          deliveries,
          settlement: settlement ? {
            id: settlement.id,
            status: settlement.status,
            paidAt: settlement.paidAt,
            notes: settlement.notes
          } : null
        };
      });
      const weekTotal = driverEarnings.reduce((sum, d) => sum + Number(d.weekEarnings), 0);
      const grandTotal = driverEarnings.reduce((sum, d) => sum + Number(d.allTimeEarnings), 0);
      res.json({
        drivers: driverEarnings,
        week: {
          start: weekStart.toISOString(),
          end: weekEnd.toISOString(),
          offset: weekOffset
        },
        summary: {
          weekTotal: weekTotal.toFixed(2),
          grandTotal: grandTotal.toFixed(2),
          totalDrivers: allDrivers.length
        }
      });
    } catch (error) {
      console.error("Failed to fetch driver earnings:", error);
      res.status(500).json({ error: "Failed to fetch driver earnings" });
    }
  });
  app2.post("/api/admin/settlements/mark", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { driverId, weekStart, weekEnd, totalEarnings, deliveryCount, status, notes } = req.body;
      if (!driverId || !weekStart || !weekEnd || !status) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const settlement = await storage.upsertSettlement({
        driverId,
        weekStart: new Date(weekStart),
        weekEnd: new Date(weekEnd),
        totalEarnings: totalEarnings || "0",
        deliveryCount: deliveryCount || 0,
        status,
        paidAt: status === "paid" ? /* @__PURE__ */ new Date() : null,
        notes: notes || null
      });
      res.json(settlement);
    } catch (error) {
      console.error("Failed to update settlement:", error);
      res.status(500).json({ error: "Failed to update settlement" });
    }
  });
  app2.get("/api/admin/settlements", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const driverId = req.query.driverId;
      if (driverId) {
        const settlements3 = await storage.getSettlementsByDriver(driverId);
        return res.json(settlements3);
      }
      const weekOffset = parseInt(req.query.weekOffset) || 0;
      const { weekStart } = getFridayWeekBounds(weekOffset);
      const settlements2 = await storage.getSettlementsByWeek(weekStart);
      res.json(settlements2);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch settlements" });
    }
  });
  app2.get("/api/driver/weekly-earnings", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) return res.status(404).json({ error: "Driver not found" });
      const allOrders = await storage.getOrders();
      const driverDelivered = allOrders.filter((o) => o.status === "delivered" && o.driverId === driver.id);
      const allDeliveredIds = driverDelivered.map((o) => o.id);
      const allItems = await storage.getOrderItemsByOrderIds(allDeliveredIds);
      const weeks = [];
      for (let offset = 0; offset >= -8; offset--) {
        const { weekStart, weekEnd } = getFridayWeekBounds(offset);
        const weekOrders = driverDelivered.filter((o) => {
          const orderDate = new Date(o.deliveredAt || o.createdAt);
          return orderDate >= weekStart && orderDate <= weekEnd;
        });
        const items = allItems.filter((i) => weekOrders.some((o) => o.id === i.orderId));
        let weekEarnings = 0;
        const deliveries = weekOrders.map((order) => {
          const orderItems2 = items.filter((i) => i.orderId === order.id);
          let commission = 0;
          for (const item of orderItems2) {
            const rate = COMMISSION_RATES[item.productSize] || 0;
            commission += rate * (item.quantity || 1);
          }
          weekEarnings += commission;
          return {
            orderId: order.id,
            orderNumber: order.orderNumber,
            deliveredAt: order.deliveredAt || order.createdAt,
            items: orderItems2.map((i) => ({
              productSize: i.productSize,
              quantity: i.quantity,
              commission: (COMMISSION_RATES[i.productSize] || 0) * (i.quantity || 1)
            })),
            commission: commission.toFixed(2)
          };
        });
        const settlement = await storage.getSettlement(driver.id, weekStart);
        weeks.push({
          weekStart: weekStart.toISOString(),
          weekEnd: weekEnd.toISOString(),
          offset,
          deliveryCount: weekOrders.length,
          totalEarnings: weekEarnings.toFixed(2),
          deliveries,
          settlement: settlement ? {
            status: settlement.status,
            paidAt: settlement.paidAt
          } : null
        });
      }
      res.json({ weeks });
    } catch (error) {
      console.error("Failed to fetch driver weekly earnings:", error);
      res.status(500).json({ error: "Failed to fetch weekly earnings" });
    }
  });
  app2.get("/api/push/vapid-key", (req, res) => {
    const key = process.env.VAPID_PUBLIC_KEY;
    if (!key) {
      return res.status(404).json({ error: "Push notifications not configured" });
    }
    res.json({ publicKey: key });
  });
  app2.post("/api/push/subscribe", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
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
  app2.post("/api/push/unsubscribe", isAuthenticated, async (req, res) => {
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
  app2.get("/api/chat/order/:orderId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
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
      const isAdmin2 = profile.role === "admin";
      if (!isCustomer && !isAssignedDriver && !isAdmin2) {
        return res.status(403).json({ error: "Not authorized to view this chat" });
      }
      const messages = await storage.getChatMessages("order", orderId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  app2.post("/api/chat/order/:orderId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
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
        body: body.trim()
      });
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app2.get("/api/chat/admin-driver/:driverId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { driverId } = req.params;
      const profile = await storage.getUserProfile(userId);
      if (!profile) return res.status(403).json({ error: "No profile" });
      const isAdmin2 = profile.role === "admin";
      let isTheDriver = false;
      if (profile.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (driver && driver.id === driverId) isTheDriver = true;
      }
      if (!isAdmin2 && !isTheDriver) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const messages = await storage.getChatMessages("admin_driver", driverId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch messages" });
    }
  });
  app2.post("/api/chat/admin-driver/:driverId", isAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId;
      const { driverId } = req.params;
      const { body } = req.body;
      if (!body || typeof body !== "string" || body.trim().length === 0) {
        return res.status(400).json({ error: "Message body required" });
      }
      const profile = await storage.getUserProfile(userId);
      if (!profile) return res.status(403).json({ error: "No profile" });
      const isAdmin2 = profile.role === "admin";
      let isTheDriver = false;
      if (profile.role === "driver") {
        const driver = await storage.getDriverByUserId(userId);
        if (driver && driver.id === driverId) isTheDriver = true;
      }
      if (!isAdmin2 && !isTheDriver) {
        return res.status(403).json({ error: "Not authorized" });
      }
      const message = await storage.createChatMessage({
        threadType: "admin_driver",
        orderId: null,
        driverId,
        senderUserId: userId,
        senderRole: profile.role,
        senderName: `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || (isAdmin2 ? "Admin" : "Driver"),
        body: body.trim()
      });
      res.json(message);
    } catch (error) {
      res.status(500).json({ error: "Failed to send message" });
    }
  });
  app2.get("/api/admin/launch-special", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const settings = await storage.getAllAppSettings();
      const settingsMap = {};
      for (const s of settings) settingsMap[s.key] = s.value;
      const foundingDriverCount = await storage.getFoundingDriverCount();
      const allDrivers = await storage.getDrivers();
      const totalDrivers = allDrivers.length;
      const exemptDrivers = allDrivers.filter((d) => d.subscriptionExempt).length;
      const referralStats = await storage.getAllReferralStats();
      const driverApps = await storage.getDriverApplications();
      const referralDetails = [];
      for (const driver of allDrivers) {
        const app3 = driverApps.find((a) => a.id === driver.applicationId);
        const stats = referralStats.find((r) => r.driverId === driver.id);
        referralDetails.push({
          driverId: driver.id,
          name: app3 ? `${app3.firstName} ${app3.lastName}` : "Unknown",
          referralCode: driver.referralCode,
          referralCount: stats?.referralCount || 0,
          subscriptionExempt: driver.subscriptionExempt,
          isFoundingDriver: driver.subscriptionExempt && !driver.referredByDriverId,
          isReferred: !!driver.referredByDriverId,
          createdAt: driver.createdAt
        });
      }
      res.json({
        launchSpecialActive: settingsMap["launch_special_active"] === "true",
        subscriptionFeeActive: settingsMap["subscription_fee_active"] === "true",
        foundingDriverLimit: parseInt(settingsMap["founding_driver_limit"] || "50"),
        referralLimitPerDriver: parseInt(settingsMap["referral_limit_per_driver"] || "50"),
        foundingDriverCount,
        totalDrivers,
        exemptDrivers,
        drivers: referralDetails
      });
    } catch (error) {
      console.error("Failed to fetch launch special data:", error);
      res.status(500).json({ error: "Failed to fetch launch special data" });
    }
  });
  app2.post("/api/admin/launch-special", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { launchSpecialActive, subscriptionFeeActive, foundingDriverLimit, referralLimitPerDriver } = req.body;
      if (launchSpecialActive !== void 0) {
        await storage.setAppSetting("launch_special_active", String(launchSpecialActive));
      }
      if (subscriptionFeeActive !== void 0) {
        await storage.setAppSetting("subscription_fee_active", String(subscriptionFeeActive));
      }
      if (foundingDriverLimit !== void 0) {
        await storage.setAppSetting("founding_driver_limit", String(foundingDriverLimit));
      }
      if (referralLimitPerDriver !== void 0) {
        await storage.setAppSetting("referral_limit_per_driver", String(referralLimitPerDriver));
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to update launch special:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });
  app2.get("/api/driver/referral", isAuthenticated, async (req, res) => {
    try {
      const userId = req.userId;
      const driver = await storage.getDriverByUserId(userId);
      if (!driver) return res.status(404).json({ error: "Driver not found" });
      const referralCount = await storage.getReferralCount(driver.id);
      const referrals = await storage.getReferralsByDriver(driver.id);
      const launchActive = await storage.getAppSetting("launch_special_active");
      const limitStr = await storage.getAppSetting("referral_limit_per_driver");
      const referralLimit = parseInt(limitStr || "50");
      const referralDetails = [];
      for (const ref of referrals) {
        const refDriver = await storage.getDriver(ref.referredDriverId);
        if (refDriver) {
          const refApp = await storage.getDriverApplication(refDriver.applicationId);
          referralDetails.push({
            id: ref.id,
            driverName: refApp ? `${refApp.firstName} ${refApp.lastName}` : "Driver",
            createdAt: ref.createdAt
          });
        }
      }
      res.json({
        referralCode: driver.referralCode,
        referralCount,
        referralLimit,
        referrals: referralDetails,
        subscriptionExempt: driver.subscriptionExempt,
        isFoundingDriver: driver.subscriptionExempt && !driver.referredByDriverId,
        isReferred: !!driver.referredByDriverId,
        launchSpecialActive: launchActive === "true"
      });
    } catch (error) {
      console.error("Failed to fetch referral data:", error);
      res.status(500).json({ error: "Failed to fetch referral data" });
    }
  });
  app2.post("/api/referral/validate", async (req, res) => {
    try {
      const { referralCode } = req.body;
      if (!referralCode) return res.status(400).json({ valid: false, error: "Referral code required" });
      const driver = await storage.getDriverByReferralCode(referralCode);
      if (!driver) return res.json({ valid: false, error: "Invalid referral code" });
      const launchActive = await storage.getAppSetting("launch_special_active");
      if (launchActive !== "true") return res.json({ valid: false, error: "Referral program not active" });
      const limitStr = await storage.getAppSetting("referral_limit_per_driver");
      const limit = parseInt(limitStr || "50");
      const count2 = await storage.getReferralCount(driver.id);
      if (count2 >= limit) return res.json({ valid: false, error: "This driver has reached their referral limit" });
      const app3 = await storage.getDriverApplication(driver.applicationId);
      res.json({
        valid: true,
        referrerName: app3 ? `${app3.firstName} ${app3.lastName.charAt(0)}.` : "A Gaslite Driver"
      });
    } catch (error) {
      res.status(500).json({ valid: false, error: "Failed to validate" });
    }
  });
  return httpServer;
}

// server/seed-admin.ts
import bcrypt2 from "bcryptjs";
import { eq as eq5, or as or2 } from "drizzle-orm";
async function ensureAdmin(email, phone, password, firstName, lastName) {
  const conditions = [eq5(users.email, email)];
  if (phone) conditions.push(eq5(users.phone, phone));
  const existing = await db.select().from(users).where(
    conditions.length === 1 ? conditions[0] : or2(...conditions)
  );
  if (existing.length > 0) {
    const profile = await db.select().from(userProfiles).where(eq5(userProfiles.userId, existing[0].id));
    if (profile.length > 0 && profile[0].role === "admin" && profile[0].onboardingCompleted) {
      return;
    }
    if (profile.length > 0) {
      await db.update(userProfiles).set({ role: "admin", onboardingCompleted: true, firstName, lastName }).where(eq5(userProfiles.userId, existing[0].id));
    } else {
      await db.insert(userProfiles).values({
        userId: existing[0].id,
        firstName,
        lastName,
        role: "admin",
        onboardingCompleted: true
      });
    }
    await db.update(users).set({ email, phone: phone || void 0, firstName, lastName }).where(eq5(users.id, existing[0].id));
    console.log(`Admin updated: ${email}`);
    return;
  }
  const passwordHash = await bcrypt2.hash(password, 12);
  const [user] = await db.insert(users).values({ email, phone, passwordHash, firstName, lastName }).returning();
  await db.insert(userProfiles).values({
    userId: user.id,
    firstName,
    lastName,
    role: "admin",
    onboardingCompleted: true
  });
  console.log(`Admin seeded: ${email}`);
}
async function seedAdmin() {
  try {
    await ensureAdmin("admin@gaslite.co.za", null, "Admin123!", "Admin", "Gaslite");
    await ensureAdmin("malcolm@movedigital.africa", "0834654639", "Admin123!", "Malcolm", "Govender");
  } catch (error) {
    console.error("Failed to seed admin accounts:", error);
  }
}

// server/vercel-handler.ts
var app = express();
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    }
  })
);
app.use(express.urlencoded({ extended: false }));
app.set("trust proxy", 1);
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  next();
});
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", env: "production" });
});
var initialized = false;
async function ensureInitialized() {
  if (initialized) return;
  initialized = true;
  setupSession(app);
  registerAuthRoutes(app);
  const { createServer } = await import("http");
  const httpServer = createServer(app);
  await registerRoutes(httpServer, app);
  seedAdmin().catch((e) => console.error("seedAdmin failed:", e));
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    console.error("Error:", err);
    if (!res.headersSent) res.status(status).json({ message });
  });
}
var handler = serverless(app);
async function vercel_handler_default(req, res) {
  await ensureInitialized();
  return handler(req, res);
}
export {
  vercel_handler_default as default
};
