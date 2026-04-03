import { db } from "./db";
import { eq, desc, and, sql, gte, lte, count } from "drizzle-orm";
import {
  products,
  userProfiles,
  driverApplications,
  drivers,
  orders,
  orderItems,
  pushSubscriptions,
  chatMessages,
  settlements,
  appSettings,
  driverReferrals,
  type Product,
  type InsertProduct,
  type UserProfile,
  type InsertUserProfile,
  type DriverApplication,
  type InsertDriverApplication,
  type Driver,
  type InsertDriver,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type OrderWithItems,
  type PushSubscription,
  type InsertPushSubscription,
  type ChatMessage,
  type InsertChatMessage,
  type Settlement,
  type InsertSettlement,
  type DriverReferral,
  type InsertDriverReferral,
  type AppSetting,
} from "@shared/schema";
import { users } from "@shared/models/auth";

export interface IStorage {
  // Products
  getProducts(): Promise<Product[]>;
  getProduct(id: string): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined>;

  // User Profiles
  getUserProfile(userId: string): Promise<UserProfile | undefined>;
  createUserProfile(profile: InsertUserProfile): Promise<UserProfile>;
  updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined>;

  // Driver Applications
  getDriverApplications(): Promise<DriverApplication[]>;
  getDriverApplication(id: string): Promise<DriverApplication | undefined>;
  getDriverApplicationByUserId(userId: string): Promise<DriverApplication | undefined>;
  createDriverApplication(application: InsertDriverApplication): Promise<DriverApplication>;
  updateDriverApplication(id: string, application: Partial<DriverApplication>): Promise<DriverApplication | undefined>;

  // Drivers
  getDrivers(): Promise<Driver[]>;
  getDriver(id: string): Promise<Driver | undefined>;
  getDriverByUserId(userId: string): Promise<Driver | undefined>;
  createDriver(driver: InsertDriver): Promise<Driver>;
  updateDriver(id: string, driver: Partial<Driver>): Promise<Driver | undefined>;

  // Orders
  getOrders(): Promise<Order[]>;
  getOrdersByCustomer(customerId: string): Promise<Order[]>;
  getOrdersByDriver(driverId: string): Promise<Order[]>;
  getOrder(id: string): Promise<Order | undefined>;
  getOrderWithItems(id: string): Promise<OrderWithItems | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems>;
  updateOrder(id: string, order: Partial<Order>): Promise<Order | undefined>;

  // Available orders for drivers
  getAvailableOrders(): Promise<Order[]>;

  // Drivers with application info
  getDriversWithApplications(): Promise<(Driver & { application?: DriverApplication })[]>;

  // Chat Messages
  getChatMessages(threadType: string, threadId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;

  // Stats
  getAdminStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    activeDrivers: number;
    pendingApplications: number;
  }>;

  // Settlements
  getSettlement(driverId: string, weekStart: Date): Promise<Settlement | undefined>;
  getSettlementsByWeek(weekStart: Date): Promise<Settlement[]>;
  getSettlementsByDriver(driverId: string): Promise<Settlement[]>;
  upsertSettlement(settlement: InsertSettlement): Promise<Settlement>;
  updateSettlementStatus(id: string, status: string, notes?: string): Promise<Settlement | undefined>;

  // Order items by order IDs
  getOrderItemsByOrderIds(orderIds: string[]): Promise<OrderItem[]>;

  // App Settings
  getAppSetting(key: string): Promise<string | null>;
  setAppSetting(key: string, value: string): Promise<void>;
  getAllAppSettings(): Promise<AppSetting[]>;

  // Driver Referrals
  getDriverByReferralCode(code: string): Promise<Driver | undefined>;
  createDriverReferral(referral: InsertDriverReferral): Promise<DriverReferral>;
  getReferralsByDriver(driverId: string): Promise<DriverReferral[]>;
  getReferralCount(driverId: string): Promise<number>;
  getFoundingDriverCount(): Promise<number>;
  getAllReferralStats(): Promise<Array<{ driverId: string; referralCount: number }>>;

  // Customer sign-ups
  getCustomerSignups(): Promise<Array<{
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    address: string | null;
    onboardingCompleted: boolean;
    createdAt: Date | null;
    orderCount: number;
    totalSpent: number;
  }>>;
}

export class DatabaseStorage implements IStorage {
  // Products
  async getProducts(): Promise<Product[]> {
    return db.select().from(products).where(eq(products.isAvailable, true));
  }

  async getProduct(id: string): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: string, product: Partial<InsertProduct>): Promise<Product | undefined> {
    const [updated] = await db.update(products).set(product).where(eq(products.id, id)).returning();
    return updated;
  }

  // User Profiles
  async getUserProfile(userId: string): Promise<UserProfile | undefined> {
    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId));
    return profile;
  }

  async createUserProfile(profile: InsertUserProfile): Promise<UserProfile> {
    const [created] = await db.insert(userProfiles).values(profile).returning();
    return created;
  }

  async updateUserProfile(userId: string, profile: Partial<InsertUserProfile>): Promise<UserProfile | undefined> {
    const [updated] = await db.update(userProfiles).set({ ...profile, updatedAt: new Date() }).where(eq(userProfiles.userId, userId)).returning();
    return updated;
  }

  // Driver Applications
  async getDriverApplications(): Promise<DriverApplication[]> {
    return db.select().from(driverApplications).orderBy(desc(driverApplications.createdAt));
  }

  async getDriverApplication(id: string): Promise<DriverApplication | undefined> {
    const [application] = await db.select().from(driverApplications).where(eq(driverApplications.id, id));
    return application;
  }

  async getDriverApplicationByUserId(userId: string): Promise<DriverApplication | undefined> {
    const [application] = await db.select().from(driverApplications).where(eq(driverApplications.userId, userId));
    return application;
  }

  async createDriverApplication(application: InsertDriverApplication): Promise<DriverApplication> {
    const [created] = await db.insert(driverApplications).values(application).returning();
    return created;
  }

  async updateDriverApplication(id: string, application: Partial<DriverApplication>): Promise<DriverApplication | undefined> {
    const [updated] = await db.update(driverApplications).set(application).where(eq(driverApplications.id, id)).returning();
    return updated;
  }

  // Drivers
  async getDrivers(): Promise<Driver[]> {
    return db.select().from(drivers).orderBy(desc(drivers.createdAt));
  }

  async getDriver(id: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.id, id));
    return driver;
  }

  async getDriverByUserId(userId: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.userId, userId));
    return driver;
  }

  async createDriver(driver: InsertDriver): Promise<Driver> {
    const [created] = await db.insert(drivers).values(driver).returning();
    return created;
  }

  async updateDriver(id: string, driver: Partial<Driver>): Promise<Driver | undefined> {
    const [updated] = await db.update(drivers).set({ ...driver, updatedAt: new Date() }).where(eq(drivers.id, id)).returning();
    return updated;
  }

  // Orders
  async getOrders(): Promise<Order[]> {
    return db.select().from(orders).orderBy(desc(orders.createdAt));
  }

  async getOrdersByCustomer(customerId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.customerId, customerId)).orderBy(desc(orders.createdAt));
  }

  async getOrdersByDriver(driverId: string): Promise<Order[]> {
    return db.select().from(orders).where(eq(orders.driverId, driverId)).orderBy(desc(orders.createdAt));
  }

  async getOrder(id: string): Promise<Order | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    return order;
  }

  async getOrderWithItems(id: string): Promise<OrderWithItems | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    if (!order) return undefined;

    const items = await db.select().from(orderItems).where(eq(orderItems.orderId, id));
    return { ...order, items };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<OrderWithItems> {
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

  async updateOrder(id: string, order: Partial<Order>): Promise<Order | undefined> {
    const [updated] = await db.update(orders).set({ ...order, updatedAt: new Date() }).where(eq(orders.id, id)).returning();
    return updated;
  }

  // Available orders for drivers
  async getAvailableOrders(): Promise<Order[]> {
    return db.select().from(orders)
      .where(
        and(
          eq(orders.status, "pending"),
          sql`${orders.driverId} IS NULL`
        )
      )
      .orderBy(desc(orders.createdAt));
  }

  // Drivers with application info
  async getDriversWithApplications(): Promise<(Driver & { application?: DriverApplication })[]> {
    const allDrivers = await db.select().from(drivers).orderBy(desc(drivers.createdAt));
    const result = [];
    for (const driver of allDrivers) {
      const [application] = await db.select().from(driverApplications).where(eq(driverApplications.id, driver.applicationId));
      result.push({ ...driver, application: application || undefined });
    }
    return result;
  }

  // Chat Messages
  async getChatMessages(threadType: string, threadId: string): Promise<ChatMessage[]> {
    if (threadType === "order") {
      return db.select().from(chatMessages)
        .where(and(eq(chatMessages.threadType, "order"), eq(chatMessages.orderId, threadId)))
        .orderBy(chatMessages.createdAt);
    } else {
      return db.select().from(chatMessages)
        .where(and(eq(chatMessages.threadType, "admin_driver"), eq(chatMessages.driverId, threadId)))
        .orderBy(chatMessages.createdAt);
    }
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const [created] = await db.insert(chatMessages).values(message).returning();
    return created;
  }

  // Stats
  async getAdminStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    activeDrivers: number;
    pendingApplications: number;
  }> {
    const allOrders = await db.select().from(orders);
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders
      .filter((o) => o.status === "delivered")
      .reduce((sum, o) => sum + Number(o.total), 0);

    const allDrivers = await db.select().from(drivers);
    const activeDrivers = allDrivers.filter((d) => d.status !== "offline").length;

    const allApplications = await db.select().from(driverApplications);
    const pendingApplications = allApplications.filter((a) => a.status === "pending").length;

    return { totalOrders, totalRevenue, activeDrivers, pendingApplications };
  }

  async getCustomerSignups(): Promise<Array<{
    id: string;
    email: string | null;
    phone: string | null;
    firstName: string | null;
    lastName: string | null;
    role: string;
    address: string | null;
    onboardingCompleted: boolean;
    createdAt: Date | null;
    orderCount: number;
    totalSpent: number;
  }>> {
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    const allProfiles = await db.select().from(userProfiles);
    const allOrders = await db
      .select({
        customerId: orders.customerId,
        total: orders.total,
        status: orders.status,
      })
      .from(orders);

    const profileMap = new Map(allProfiles.map(p => [p.userId, p]));
    const ordersByUser = new Map<string, { count: number; spent: number }>();

    for (const order of allOrders) {
      if (!order.customerId) continue;
      const existing = ordersByUser.get(order.customerId) || { count: 0, spent: 0 };
      existing.count += 1;
      if (order.status === "delivered") {
        existing.spent += Number(order.total);
      }
      ordersByUser.set(order.customerId, existing);
    }

    return allUsers.map(u => {
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
        totalSpent: orderData.spent,
      };
    });
  }

  // Settlements
  async getSettlement(driverId: string, weekStart: Date): Promise<Settlement | undefined> {
    const [settlement] = await db.select().from(settlements)
      .where(and(eq(settlements.driverId, driverId), eq(settlements.weekStart, weekStart)));
    return settlement;
  }

  async getSettlementsByWeek(weekStart: Date): Promise<Settlement[]> {
    return db.select().from(settlements).where(eq(settlements.weekStart, weekStart));
  }

  async getSettlementsByDriver(driverId: string): Promise<Settlement[]> {
    return db.select().from(settlements)
      .where(eq(settlements.driverId, driverId))
      .orderBy(desc(settlements.weekStart));
  }

  async upsertSettlement(settlement: InsertSettlement): Promise<Settlement> {
    const existing = await this.getSettlement(settlement.driverId, settlement.weekStart);
    if (existing) {
      const updateData: Partial<Settlement> = {
        totalEarnings: settlement.totalEarnings,
        deliveryCount: settlement.deliveryCount,
        weekEnd: settlement.weekEnd,
        status: settlement.status || existing.status,
      };
      if (settlement.status === "paid" && existing.status !== "paid") {
        updateData.paidAt = new Date();
      }
      if (settlement.notes !== undefined) updateData.notes = settlement.notes;
      const [updated] = await db.update(settlements)
        .set(updateData)
        .where(eq(settlements.id, existing.id))
        .returning();
      return updated;
    }
    const [created] = await db.insert(settlements).values(settlement).returning();
    return created;
  }

  async updateSettlementStatus(id: string, status: string, notes?: string): Promise<Settlement | undefined> {
    const updateData: any = { status };
    if (status === "paid") updateData.paidAt = new Date();
    if (notes !== undefined) updateData.notes = notes;
    const [updated] = await db.update(settlements).set(updateData).where(eq(settlements.id, id)).returning();
    return updated;
  }

  async getOrderItemsByOrderIds(orderIds: string[]): Promise<OrderItem[]> {
    if (orderIds.length === 0) return [];
    return db.select().from(orderItems).where(sql`${orderItems.orderId} IN (${sql.join(orderIds.map(id => sql`${id}`), sql`, `)})`);
  }

  // App Settings
  async getAppSetting(key: string): Promise<string | null> {
    const [setting] = await db.select().from(appSettings).where(eq(appSettings.key, key));
    return setting?.value ?? null;
  }

  async setAppSetting(key: string, value: string): Promise<void> {
    await db.insert(appSettings).values({ key, value }).onConflictDoUpdate({
      target: appSettings.key,
      set: { value, updatedAt: new Date() },
    });
  }

  async getAllAppSettings(): Promise<AppSetting[]> {
    return db.select().from(appSettings);
  }

  // Driver Referrals
  async getDriverByReferralCode(code: string): Promise<Driver | undefined> {
    const [driver] = await db.select().from(drivers).where(eq(drivers.referralCode, code.toUpperCase()));
    return driver;
  }

  async createDriverReferral(referral: InsertDriverReferral): Promise<DriverReferral> {
    const [created] = await db.insert(driverReferrals).values(referral).returning();
    return created;
  }

  async getReferralsByDriver(driverId: string): Promise<DriverReferral[]> {
    return db.select().from(driverReferrals).where(eq(driverReferrals.referrerDriverId, driverId)).orderBy(desc(driverReferrals.createdAt));
  }

  async getReferralCount(driverId: string): Promise<number> {
    const [result] = await db.select({ count: count() }).from(driverReferrals).where(eq(driverReferrals.referrerDriverId, driverId));
    return result?.count || 0;
  }

  async getFoundingDriverCount(): Promise<number> {
    const [result] = await db.select({ count: count() }).from(drivers).where(
      and(eq(drivers.subscriptionExempt, true), sql`${drivers.referredByDriverId} IS NULL`)
    );
    return result?.count || 0;
  }

  async getAllReferralStats(): Promise<Array<{ driverId: string; referralCount: number }>> {
    const results = await db.select({
      driverId: driverReferrals.referrerDriverId,
      referralCount: count(),
    }).from(driverReferrals).groupBy(driverReferrals.referrerDriverId);
    return results.map(r => ({ driverId: r.driverId, referralCount: r.referralCount }));
  }
}

export const storage = new DatabaseStorage();

// Seed default products if they don't exist, and keep prices up to date
export async function seedProducts() {
  const CANONICAL_PRODUCTS = [
    { name: "9kg Gas Cylinder", size: "9kg", price: "280.71", description: "Standard household gas cylinder" },
    { name: "19kg Gas Cylinder", size: "19kg", price: "552.00", description: "Medium size gas cylinder" },
    { name: "48kg Gas Cylinder", size: "48kg", price: "1345.00", description: "Large commercial gas cylinder" },
  ];

  const existingProducts = await db.select().from(products);

  for (const canonical of CANONICAL_PRODUCTS) {
    const existing = existingProducts.find(p => p.size === canonical.size);
    if (!existing) {
      await db.insert(products).values(canonical);
      console.log(`Seeded product: ${canonical.name}`);
    } else if (Number(existing.price) !== Number(canonical.price)) {
      await db.update(products).set({ price: canonical.price }).where(eq(products.id, existing.id));
      console.log(`Updated price for ${canonical.name}: ${existing.price} -> ${canonical.price}`);
    }
  }

  // Remove test cylinder if present
  const testProduct = existingProducts.find(p => p.size === "Test");
  if (testProduct) {
    await db.delete(products).where(eq(products.id, testProduct.id));
    console.log("Removed test cylinder product");
  }
}
