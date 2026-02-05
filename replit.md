# GasGo - On-Demand LPG Gas Delivery Application

## Overview

GasGo is a premium on-demand LPG gas delivery application designed for the South African market. The platform connects customers who need gas cylinder deliveries with drivers who fulfill those orders. The system supports three user roles: customers (ordering gas), drivers (delivering orders), and admins (managing the platform).

The application features a visually stunning premium landing page with Framer Motion animations, glassmorphism effects, and a modern blue/white/cyan gradient color scheme. Key functionality includes product catalog browsing, order placement with location tracking, driver onboarding with document uploads, and real-time order status management.

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
- **Authentication**: Replit Auth (OpenID Connect) with Passport.js
- **Session Management**: PostgreSQL-backed sessions via connect-pg-simple
- **File Uploads**: Multer for memory storage, Google Cloud Storage for object persistence

The backend uses a modular structure with routes registered in `server/routes.ts`, database operations abstracted through `server/storage.ts`, and Replit integrations organized under `server/replit_integrations/`.

### Data Storage
- **Primary Database**: PostgreSQL accessed via Drizzle ORM
- **Schema Location**: `shared/schema.ts` for application entities, `shared/models/auth.ts` for auth entities
- **Key Tables**: products, userProfiles, driverApplications, drivers, orders, orderItems, users, sessions

The schema supports a multi-role user system where authentication users extend into role-specific profiles and capabilities.

### Authentication Flow
- Replit Auth provides OpenID Connect authentication
- Sessions stored in PostgreSQL with 1-week TTL
- User profiles created/updated on login via upsert pattern
- Role-based access (customer/driver/admin) determined by userProfiles table

## External Dependencies

### Third-Party Services
- **Replit Auth**: OpenID Connect authentication provider
- **Google Cloud Storage**: File/document storage for driver applications and uploads
- **PostgreSQL**: Primary database (provisioned via Replit)

### Key NPM Packages
- **@tanstack/react-query**: Server state management
- **drizzle-orm / drizzle-kit**: Database ORM and migrations
- **@uppy/core, @uppy/dashboard, @uppy/aws-s3**: File upload handling
- **framer-motion**: Animation library for premium UI effects
- **react-hook-form + zod**: Form handling with validation
- **passport + openid-client**: Authentication middleware

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `SESSION_SECRET`: Secret for session encryption
- `ISSUER_URL`: OpenID Connect issuer (defaults to Replit)
- `REPL_ID`: Replit deployment identifier