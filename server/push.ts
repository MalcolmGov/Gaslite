import webpush from "web-push";
import { db } from "./db";
import { pushSubscriptions } from "@shared/schema";
import { eq } from "drizzle-orm";
import { storage } from "./storage";

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || "mailto:support@gaslite.co.za";

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

export async function saveSubscription(userId: string, subscription: { endpoint: string; keys: { p256dh: string; auth: string } }) {
  const existing = await db.select().from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint));

  if (existing.length > 0) {
    await db.update(pushSubscriptions)
      .set({ userId, p256dh: subscription.keys.p256dh, auth: subscription.keys.auth })
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
  } else {
    await db.insert(pushSubscriptions).values({
      userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth: subscription.keys.auth,
    });
  }
}

export async function removeSubscription(endpoint: string) {
  await db.delete(pushSubscriptions).where(eq(pushSubscriptions.endpoint, endpoint));
}

async function sendToUser(userId: string, payload: Record<string, any>) {
  const subs = await db.select().from(pushSubscriptions).where(eq(pushSubscriptions.userId, userId));

  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        JSON.stringify(payload)
      );
    } catch (err: any) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }
}

export async function notifyDriversNewOrder(orderId: string, orderNumber: string, deliveryAddress: string, itemsSummary?: string) {
  const allDrivers = await storage.getDrivers();
  const availableDrivers = allDrivers.filter(d => d.status === "available");

  const body = itemsSummary
    ? `${itemsSummary} — deliver to ${deliveryAddress}`
    : `Order ${orderNumber} needs delivery to ${deliveryAddress}`;

  for (const driver of availableDrivers) {
    await sendToUser(driver.userId, {
      title: "New Order Available",
      body,
      url: "/",
      tag: `new-order-${orderId}`,
      type: "new-order",
      orderId,
    });
  }
}

export async function notifyCustomerOrderUpdate(customerId: string, orderNumber: string, status: string) {
  const messages: Record<string, string> = {
    assigned: "A driver has been assigned to your order",
    picked_up: "Your gas has been picked up and is on its way",
    in_transit: "Your delivery is in transit",
    delivered: "Your gas has been delivered! Enjoy",
    cancelled: "Your order has been cancelled",
  };

  const body = messages[status] || `Your order status is now: ${status}`;

  await sendToUser(customerId, {
    title: `Order ${orderNumber} Update`,
    body,
    url: "/",
    tag: `order-update-${orderNumber}`,
  });
}

export async function notifyDriverOrderCancelled(driverId: string, orderNumber: string) {
  const driver = await storage.getDriver(driverId);
  if (!driver) return;

  await sendToUser(driver.userId, {
    title: "Order Cancelled",
    body: `Order ${orderNumber} has been cancelled by the customer`,
    url: "/",
    tag: `order-cancelled-${orderNumber}`,
  });
}
