import { db } from "./db";
import { eq, desc, and, sql } from "drizzle-orm";
import {
  products,
  userProfiles,
  driverApplications,
  drivers,
  orders,
  orderItems,
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
} from "@shared/schema";

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

  // Stats
  getAdminStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    activeDrivers: number;
    pendingApplications: number;
  }>;
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
}

export const storage = new DatabaseStorage();

// Seed default products if they don't exist
export async function seedProducts() {
  const existingProducts = await db.select().from(products);
  if (existingProducts.length === 0) {
    const defaultProducts: InsertProduct[] = [
      { name: "9kg Gas Cylinder", size: "9kg", price: "280.00", description: "Standard household gas cylinder" },
      { name: "19kg Gas Cylinder", size: "19kg", price: "480.00", description: "Medium size gas cylinder" },
      { name: "48kg Gas Cylinder", size: "48kg", price: "950.00", description: "Large commercial gas cylinder" },
    ];
    for (const product of defaultProducts) {
      await db.insert(products).values(product);
    }
    console.log("Seeded default products");
  }
}
