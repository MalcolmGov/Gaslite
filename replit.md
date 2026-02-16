# Gaslite - On-Demand LPG Gas Delivery Application

## Overview

Gaslite is a premium on-demand LPG gas delivery application designed for the South African market. The platform connects customers who need gas cylinder deliveries with drivers who fulfill those orders, using Uber-style real-time delivery tracking. The system supports three user roles: customers (ordering gas), drivers (delivering orders), and admins (managing the platform).

The application features a visually stunning premium landing page with Framer Motion animations, glassmorphism effects, and a modern blue/white/cyan gradient color scheme. Key functionality includes product catalog browsing, order placement with location tracking, driver onboarding with document uploads, real-time GPS tracking with live maps, and Uber-style delivery status management.

### Uber-Style Delivery Tracking
- Order status flow: pending → assigned → picked_up → in_transit → delivered
- Driver GPS location sharing when online (15-second polling)
- Proximity-based order matching (Haversine formula, 10km radius)
- Live Leaflet/OpenStreetMap tracking map for customers showing driver location
- Driver info card with name, phone, vehicle registration during delivery
- Card-only payment (no cash)
- Status transition validation on backend

### Landing Page Features
- Epic hero section with animated 3D gas cylinder and glassmorphism order preview card
- Animated counters for social proof (10,000+ customers, 4.9/5 rating)
- Interactive "How It Works" stepper with scroll-triggered animations
- Bento grid features section with animated stats
- Pricing cards for 9kg, 19kg, 48kg cylinders with hover animations
- Customer testimonials carousel
- Driver recruitment section with earnings calculator
- Modern footer with newsletter signup and social links
- Dark/light mode toggle with smooth transitions
- Scroll progress indicator

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Animations**: Framer Motion for scroll-triggered and interactive animations
- **Build Tool**: Vite with custom plugins for Replit integration

The frontend follows a page-based structure under `client/src/pages/` with role-specific dashboards (customer, driver, admin). Components are organized with UI primitives in `client/src/components/ui/` following shadcn/ui conventions.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Custom email/phone + password auth with bcrypt hashing, session-based (server/auth.ts)
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple, 7-day TTL
- **File Uploads**: Multer for memory storage, Google Cloud Storage for object persistence

The backend uses a modular structure with routes registered in `server/routes.ts`, database operations abstracted through `server/storage.ts`, and auth in `server/auth.ts`.

### Data Storage
- **Primary Database**: PostgreSQL accessed via Drizzle ORM
- **Schema Location**: `shared/schema.ts` for application entities, `shared/models/auth.ts` for auth entities
- **Key Tables**: products, userProfiles, driverApplications, drivers, orders, orderItems, users, sessions, pushSubscriptions

The schema supports a multi-role user system where authentication users extend into role-specific profiles and capabilities.

### Authentication & Onboarding Flow
- Custom email/phone + password authentication (bcrypt, 12 rounds) — no external auth providers
- Users can register with either a **mobile number** or **email address** (both optional, at least one required)
- South African phone numbers normalized (supports 071..., +2771..., 2771... formats)
- `users` table: id (UUID), email (nullable, unique), phone (nullable, unique), password_hash
- Sessions stored in PostgreSQL with 1-week TTL, accessed via `req.session.userId`
- Auth routes: POST `/api/auth/register`, POST `/api/auth/login` (uses `identifier` field for email or phone), POST `/api/auth/logout`, GET `/api/auth/user`
- Sign-up page: two-step flow — 1) choose role (customer/driver), 2) choose sign-up method (mobile/email) + password
- Sign-in page: single `identifier` field accepts email or mobile number
- Role-based access (customer/driver/admin) determined by userProfiles table
- **Onboarding gate**: New users must complete onboarding before accessing dashboards
  - Customer onboarding: collects firstName, lastName, phone, delivery address
  - Driver onboarding: 3-step form (personal info → license/vehicle → document uploads), creates driverApplication linked to userId
- **Intent-based routing**: Sign-up page sets localStorage "gaslite_intent" (customer/driver); App.tsx reads intent to route to correct onboarding
- **Driver approval workflow**: Driver applicants keep role="customer" until admin approves; admin approval creates driver record and sets role="driver"
- **Security**: switch-role endpoint requires approved driver record for driver role; driver-applications endpoint requires authentication; driverApplications.userId has unique constraint

## External Dependencies

### Email Notifications
- **Service**: Gmail API via Replit's Google Mail connector
- **Sender**: "Gaslite" <malcolmgov24@gmail.com>
- **Implementation**: `server/email.ts` — Gmail client, MIME message builder, HTML email template
- **Trigger**: Automatic on order creation (POST `/api/orders`), runs in background (non-blocking)
- **Email content**: Professional branded HTML with order confirmation, item breakdown, payment receipt (subtotal, delivery fee, card processing fee, total), delivery address, order number, and "what happens next" section
- **Security**: HTML escaping on all user-supplied fields to prevent injection

### Yoco Card Payments
- **Service**: Yoco Checkout API (South African payment gateway)
- **Implementation**: `server/yoco.ts` — creates checkout sessions, verifies payment status
- **Flow**: Order created → Yoco checkout session created → customer redirected to Yoco hosted payment page → customer returns to success/cancel/failure page → payment verified via API poll + webhook
- **Endpoints**:
  - POST `/api/orders` — creates order + Yoco checkout, returns `redirectUrl`
  - POST `/api/payments/verify/:orderId` — verifies payment status with Yoco API
  - POST `/api/webhooks/yoco` — receives Yoco webhook events (payment.succeeded)
- **Payment pages**: `/payment/success`, `/payment/cancel`, `/payment/failure`
- **Schema fields**: `orders.paymentStatus` (pending/paid/failed), `orders.yocoCheckoutId`
- **Email/notifications**: Confirmation email + driver notifications sent only after payment verified (not on order creation)
- **Keys**: YOCO_SECRET_KEY (secret), YOCO_PUBLIC_KEY (secret) — currently using test keys
- **Currency**: ZAR only, amount in cents, minimum R2.00

### Third-Party Services
- **Yoco**: Card payment processing (Visa, Mastercard, Amex, Apple Pay, Google Pay)
- **Google Cloud Storage**: File/document storage for driver applications and uploads
- **Gmail API**: Order confirmation and payment receipt emails (via Replit connector)
- **Google Maps Places API**: Address autocomplete for delivery addresses (restricted to South Africa)
- **PostgreSQL**: Primary database (provisioned via Replit)

### Key NPM Packages
- **@tanstack/react-query**: Server state management
- **drizzle-orm / drizzle-kit**: Database ORM and migrations
- **bcryptjs**: Password hashing for custom auth
- **connect-pg-simple + express-session**: Session management
- **@uppy/core, @uppy/dashboard, @uppy/aws-s3**: File upload handling
- **framer-motion**: Animation library for premium UI effects
- **react-hook-form + zod**: Form handling with validation

### Push Notifications
- **Protocol**: Web Push API with VAPID authentication
- **Backend**: `server/push.ts` — web-push library, subscription management, per-user notification delivery
- **Frontend Hook**: `client/src/hooks/use-push-notifications.ts` — subscribe/unsubscribe/permission management
- **Service Worker**: `client/public/sw.js` — handles push events and notification clicks
- **Triggers**: New order → all available drivers; order accepted/status change → customer; order cancelled → assigned driver
- **Storage**: `pushSubscriptions` table with endpoint, p256dh, auth keys per user

### Rate Limiting
- **Implementation**: `server/rate-limit.ts` — in-memory rate limiter with automatic cleanup
- **Protected Routes**: `/api/auth/login`, `/api/auth/register` (10 requests per 5-minute window per IP+path)
- **Response**: HTTP 429 with Retry-After header

### Order Cancellation
- **Route**: POST `/api/orders/:orderId/cancel`
- **Allowed States**: pending, confirmed, assigned (before pickup)
- **Behavior**: Releases assigned driver back to "available" status, notifies driver via push notification

### Legal Pages
- **Routes**: `/legal/terms`, `/legal/privacy`, `/legal/refund`
- **Content**: Terms of Service, Privacy Policy (POPIA compliant), Refund Policy (CPA compliant)
- **Links**: Landing page footer, cross-linked between legal pages

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `GOOGLE_MAPS_API_KEY`: Google Maps API key (requires Places API and Maps JavaScript API enabled)
- `VAPID_PUBLIC_KEY`: VAPID public key for Web Push notifications
- `VAPID_PRIVATE_KEY`: VAPID private key for Web Push notifications
- `VAPID_SUBJECT`: VAPID subject (mailto: URI) for Web Push