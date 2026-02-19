# GASLITE - Product & Technical Overview

**On-Demand LPG Gas Delivery Platform**
**Version 1.0 | February 2026**
**South African Market**

---

## 1. Executive Summary

Gaslite is a premium Progressive Web Application (PWA) for on-demand LPG gas cylinder delivery in South Africa. Modelled on the Uber delivery experience, Gaslite connects customers who need gas delivered to their door with verified drivers who fulfil those orders in real time.

The platform supports three user roles — **Customers**, **Drivers**, and **Administrators** — each with a dedicated dashboard, tailored features, and a seamless mobile-first experience. Gaslite handles the full lifecycle from product browsing and card payment through to live GPS tracking, delivery confirmation, and automated commission payouts.

---

## 2. Product Catalogue

| Product | Size | Price (ZAR) | Target Market |
|---------|------|-------------|---------------|
| Compact Cylinder | 9kg | R233 | Small households, flats, singles |
| Standard Cylinder | 19kg | R523 | Families, medium households |
| Commercial Cylinder | 48kg | R1,316 | Businesses, restaurants, large households |

**Additional Fees:**
- Delivery fee: R29 per order
- Card processing fee: 2.6% + 15% VAT (passed through transparently)
- No cash payments — card only for safety and accountability

---

## 3. Value Propositions

### 3.1 For Customers

| Benefit | Description |
|---------|-------------|
| **Convenience** | Order gas from your phone in under 60 seconds — no queues, no driving to depots |
| **Real-Time Tracking** | Uber-style live map showing your driver's location as they approach |
| **Safe & Secure** | Card-only payments, verified drivers, SABS-approved cylinders |
| **Transparent Pricing** | All fees visible upfront before payment — no hidden charges |
| **Address Memory** | Saved delivery address with GPS coordinates — no re-entering each time |
| **Order History** | Full order history with status tracking and receipts |
| **Email Receipts** | Professional branded confirmation emails with full payment breakdown |
| **In-App Chat** | Direct messaging with your assigned driver during active deliveries |
| **Push Notifications** | Real-time alerts when your order is accepted, picked up, and delivered |
| **Multi-Device** | Works on any device — phone, tablet, or desktop — no app store download needed |

### 3.2 For Drivers

| Benefit | Description |
|---------|-------------|
| **Earn Commission** | R80 per 9kg delivery, R200 per 19kg, R500 per 48kg |
| **Low Platform Fee** | Only R39/month subscription |
| **Flexible Schedule** | Go online/offline anytime — work when it suits you |
| **Smart Order Matching** | Orders matched within 10km radius — no wasted trips |
| **Earnings Dashboard** | Track earnings in real time: today, this week, this month, and total |
| **GPS Navigation** | One-tap navigation to delivery addresses via Google Maps |
| **Push Notifications** | Instant alerts when new orders are available nearby |
| **In-App Chat** | Message customers directly, plus admin support chat |
| **Professional Onboarding** | Structured 3-step application with document upload |
| **Status Management** | Clear delivery workflow: Accept, Pick Up, In Transit, Delivered |

### 3.3 For the Business

| Benefit | Description |
|---------|-------------|
| **Scalable Platform** | Cloud-hosted, handles growth without infrastructure changes |
| **Admin Dashboard** | Full visibility into orders, drivers, customers, and revenue |
| **Driver Approval Workflow** | Review applications, verify documents, approve/reject drivers |
| **Revenue Streams** | Delivery fees, card processing margin, driver subscriptions |
| **Legal Compliance** | POPIA-compliant privacy policy, CPA-compliant refund policy, full T&Cs |
| **Automated Operations** | Commission calculation, payment verification, email notifications — all automated |
| **Real-Time Monitoring** | Live driver locations, order statuses, and platform metrics |

---

## 4. Feature Breakdown

### 4.1 Customer Experience

**Registration & Onboarding**
- Sign up with email or South African mobile number
- Choose role (customer or driver) during registration
- Guided onboarding: name, phone, delivery address with Google Places autocomplete
- GPS coordinates captured automatically for accurate delivery location

**Ordering Flow**
1. Browse product catalogue with real product images
2. Add items to cart with quantity selection
3. Confirm delivery address (pre-filled from profile, editable)
4. Review order summary with transparent fee breakdown
5. Secure card payment via Yoco (Visa, Mastercard, Amex, Apple Pay, Google Pay)
6. Receive email confirmation with full receipt

**Live Delivery Tracking**
- Real-time map powered by Leaflet/OpenStreetMap
- Driver location updates every 15 seconds
- Driver info card: name, phone number, vehicle registration
- Status progression: Pending, Assigned, Picked Up, In Transit, Delivered
- Push notifications at each status change

**Order Management**
- View active and past orders
- Cancel orders before pickup
- In-app chat with assigned driver
- Full order history with details

### 4.2 Driver Experience

**Application & Onboarding**
- 3-step application process:
  1. Personal information (name, phone, email)
  2. Vehicle & licence details (licence number, vehicle registration, vehicle type)
  3. Document uploads (driver's licence, vehicle registration, proof of address)
- Documents stored securely in Google Cloud Storage
- Application reviewed and approved/rejected by admin

**Driver Dashboard**
- **Earnings Overview**: Four summary cards showing Today, This Week, This Month, and Total Earned
- **Delivery Stats**: Total deliveries completed, active orders count
- **Commission Rates Display**: Visual reference of per-product commission rates
- **Subscription Status**: R39/month platform fee indicator
- **Go Online/Offline Toggle**: Control availability for receiving orders
- **GPS Status Indicator**: Shows when location sharing is active
- **Notification Status**: Shows whether push notifications are enabled, with guidance if blocked

**Order Management**
- Available orders list with distance indicator (km away)
- Order details: items, total value, delivery address, payment method
- Accept orders with one tap
- Status progression buttons: Mark as Picked Up, In Transit, Delivered
- One-tap navigation to delivery address via Google Maps
- In-app chat with customer and admin support

**Commission Structure**

| Cylinder Size | Commission per Delivery |
|--------------|------------------------|
| 9kg | R80 |
| 19kg | R200 |
| 48kg | R500 |

Commission is calculated automatically on delivery completion and reflected immediately in the driver's earnings dashboard. Multi-item orders calculate commission per item and quantity.

### 4.3 Admin Dashboard

**Platform Overview**
- Total orders, revenue, active drivers, and customer counts
- Order management: view all orders, filter by status
- Real-time order monitoring

**Driver Management**
- Review new driver applications with uploaded documents
- Approve or reject applications
- View all active drivers with status (online/offline)
- Driver earnings and delivery history
- Direct chat with individual drivers

**Customer Management**
- View all registered customers
- Customer order history and profiles

**Order Administration**
- View and manage all platform orders
- Order status tracking across the full lifecycle
- Revenue and fee breakdown per order

---

## 5. Technical Architecture

### 5.1 Platform Type
**Progressive Web Application (PWA)** — installable on any device without app store submission. Works on Android, iOS, and desktop browsers. Includes offline support via service worker and push notification capability.

### 5.2 Frontend Stack

| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework with type safety |
| Vite | Fast build tool and development server |
| Tailwind CSS + shadcn/ui | Modern, responsive UI component system |
| Framer Motion | Premium animations and transitions |
| TanStack React Query | Server state management and caching |
| Wouter | Lightweight client-side routing |
| Leaflet + OpenStreetMap | Real-time delivery tracking maps |
| React Hook Form + Zod | Form handling with schema validation |

### 5.3 Backend Stack

| Technology | Purpose |
|-----------|---------|
| Node.js + Express.js | API server |
| TypeScript | End-to-end type safety |
| Drizzle ORM | Type-safe database queries |
| PostgreSQL | Primary relational database |
| bcrypt (12 rounds) | Password hashing |
| express-session + connect-pg-simple | Session management with database persistence |
| Multer | File upload handling |
| web-push (VAPID) | Push notification delivery |

### 5.4 Third-Party Integrations

| Service | Purpose |
|---------|---------|
| **Yoco** | South African card payment gateway (Visa, Mastercard, Amex, Apple Pay, Google Pay) |
| **Google Maps Places API** | Address autocomplete restricted to South Africa |
| **Google Maps Geocoding API** | Address-to-coordinate conversion for delivery location |
| **Gmail API** | Automated order confirmation and payment receipt emails |
| **Google Cloud Storage** | Secure document storage for driver applications |
| **OpenStreetMap / Leaflet** | Free real-time delivery tracking maps |
| **Web Push API** | Browser-based push notifications |

### 5.5 Security Features

| Feature | Implementation |
|---------|---------------|
| Password Security | bcrypt hashing with 12 salt rounds |
| Session Management | Server-side sessions stored in PostgreSQL, 7-day TTL |
| Rate Limiting | 10 requests per 5 minutes on auth endpoints |
| Input Validation | Zod schema validation on all API inputs |
| HTML Escaping | All user-supplied content escaped in emails |
| HTTPS | Enforced via deployment platform |
| Role-Based Access | Backend middleware enforcing customer/driver/admin permissions |
| Status Transition Validation | Backend prevents invalid order status changes |

### 5.6 Database Schema

**Core Tables:**
- `users` — Authentication (UUID, email, phone, password hash)
- `user_profiles` — Role, name, address, coordinates, onboarding status
- `products` — Product catalogue (name, size, price, description)
- `orders` — Order records (customer, driver, address, coordinates, status, payment, timestamps)
- `order_items` — Line items per order (product, quantity, price)
- `drivers` — Driver records (status, vehicle info, location, earnings, delivery count)
- `driver_applications` — Onboarding applications with document references
- `sessions` — Server-side session storage
- `push_subscriptions` — Web Push subscription endpoints per user
- `chat_messages` — In-app messaging (order chat + admin-driver chat)

---

## 6. Order Lifecycle

```
Customer places order
        |
        v
  Yoco card payment
        |
        v
  Payment verified ──> Email confirmation sent
        |
        v
  Order visible to nearby drivers (within 10km)
        |
        v
  Push notification sent to available drivers
        |
        v
  Driver accepts order ──> Customer notified
        |
        v
  Driver marks "Picked Up" ──> Customer notified
        |
        v
  Driver marks "In Transit" ──> Live GPS tracking begins
        |                        Customer sees driver on map
        v
  Driver marks "Delivered" ──> Customer notified
        |                      Commission calculated & credited
        v
     Complete
```

---

## 7. Payment Flow

1. Customer selects products and confirms delivery address
2. Order summary displayed with transparent breakdown:
   - Subtotal (product prices)
   - Delivery fee (R29)
   - Card processing fee (2.6% + 15% VAT)
   - **Total**
3. Customer redirected to Yoco secure checkout page
4. Payment processed (Visa, Mastercard, Amex, Apple Pay, Google Pay)
5. Customer redirected back to Gaslite (success/cancel/failure page)
6. Payment verified via Yoco API + webhook
7. On successful payment:
   - Order confirmed
   - Email receipt sent
   - Push notifications sent to nearby drivers

---

## 8. Communication Features

### Email Notifications
- Professional branded HTML emails
- Order confirmation with full breakdown (items, fees, total)
- Payment receipt
- Delivery address confirmation
- "What happens next" guidance

### Push Notifications
- New order alerts for nearby drivers
- Order accepted notification for customers
- Status change notifications (picked up, in transit, delivered)
- Order cancellation alerts for drivers

### In-App Chat
- Customer-to-driver messaging on active orders
- Driver-to-admin support chat
- Real-time polling (5-second refresh)
- Floating chat panel accessible from dashboards

---

## 9. Legal Compliance

| Document | Compliance |
|----------|------------|
| Terms of Service | Full platform T&Cs covering all user roles |
| Privacy Policy | POPIA (Protection of Personal Information Act) compliant |
| Refund Policy | CPA (Consumer Protection Act) compliant |

All legal pages accessible from the landing page footer and cross-linked.

---

## 10. Landing Page

The public-facing landing page is designed to convert visitors into customers and recruit drivers:

- **Hero Section**: Animated headline with gradient text, call-to-action buttons
- **Social Proof**: 10,000+ happy customers, 4.9/5 rating with animated counters
- **How It Works**: 3-step visual guide (Order, Pay, Receive)
- **Product Pricing**: Interactive cards for all three cylinder sizes with real product images
- **Testimonials**: Customer review carousel
- **Driver Recruitment**: Commission rates, earnings potential, sign-up call-to-action
- **Dark/Light Mode**: Full theme toggle with smooth transitions
- **Responsive Design**: Optimised for mobile, tablet, and desktop
- **Legal Footer**: Links to Terms, Privacy Policy, and Refund Policy

---

## 11. Hosting & Deployment

| Aspect | Detail |
|--------|--------|
| Platform | Replit (cloud-hosted) |
| Database | PostgreSQL (Neon-backed, managed) |
| File Storage | Google Cloud Storage |
| SSL/TLS | Automatic HTTPS |
| Domain | `.replit.app` (custom domain configurable) |
| Deployment | One-click publish with automatic health checks |
| Rollback | Automatic checkpoints with code + database rollback |

---

## 12. Revenue Model

| Revenue Stream | Detail |
|---------------|--------|
| Product Margin | Difference between wholesale cost and retail price |
| Delivery Fee | R29 per order |
| Card Processing Spread | Margin on Yoco processing fees |
| Driver Subscriptions | R39/month per active driver |

---

## 13. Key Metrics (Dashboard)

**Admin can track:**
- Total orders (all time, by period)
- Total revenue
- Active drivers and their status
- Customer count
- Order status distribution
- Driver performance (deliveries, earnings)

**Drivers can track:**
- Today's earnings
- This week's earnings
- This month's earnings
- Total lifetime earnings
- Total deliveries completed
- Active order count

---

*Document prepared: February 2026*
*Platform: Gaslite v1.0*
*Market: South Africa*
