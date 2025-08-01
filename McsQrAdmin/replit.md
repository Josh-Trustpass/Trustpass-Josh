# Employee Verification System - replit.md

## Overview

This is a full-stack employee verification system operated by Trust Pass - Powered By MCS (Trust Pass is the company that created and operates the site, MCS is the client). The application allows administrators to manage employee records and generates QR codes for employee verification. When scanned, these QR codes display employee information and verification status to confirm their employment with the company.

## System Architecture

The system follows a modern full-stack architecture with clear separation between frontend and backend concerns:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Framework**: Tailwind CSS with shadcn/ui component library
- **Styling**: PostCSS with Tailwind CSS using CSS variables for theming
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js for REST API
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Database Provider**: Neon serverless PostgreSQL
- **File Upload**: Multer for handling employee photo uploads
- **Session Management**: Built-in session handling

## Key Components

### Database Schema
The system uses four main tables:
- **employees**: Stores employee information including ID, name, email, DBS number, DBS expiry date, position, start date, photo URL, active status, and suspension status
- **verifications**: Tracks verification events with employee references, timestamps, and verifier IP addresses
- **admin_users**: Stores admin authentication credentials with secure password hashing
- **notifications**: Tracks email notifications sent to prevent duplicates (types: dbs_expiry, dbs_expired, employee_suspended, employee_deactivated)

### API Endpoints
#### Protected Endpoints (Admin Authentication Required)
- `GET /api/employees` - Retrieve all employees
- `POST /api/employees` - Create new employee with photo upload
- `PATCH /api/employees/:id` - Update employee information
- `DELETE /api/employees/:id` - Soft delete employee
- `GET /api/stats` - Get system statistics
- `GET /api/employees/:id/qr-url` - Generate QR code URL for employee
- `GET /api/employees/verify/:employeeId` - Get employee for verification (now private)

#### Authentication Endpoints
- `POST /api/auth/login` - Admin login
- `POST /api/auth/logout` - Admin logout
- `GET /api/auth/me` - Check authentication status
- `POST /api/create-admin` - Create admin user (setup only)

### Frontend Pages
- **Login Page** (`/login`): Admin authentication interface
- **Admin Dashboard** (`/admin` or `/`): Protected employee management interface with CRUD operations
- **Employee Verification** (`/verify/:employeeId`): Private verification page accessed via QR codes (requires admin authentication)
- **404 Page**: Not found handler

### Key Features
- Employee photo upload and storage
- QR code generation for employee verification (private access only)
- Real-time employee statistics including suspended employees count
- Employee suspension status management with admin toggle controls
- DBS expiry date tracking and comprehensive email notification system
- Automated daily email alerts for DBS certificates expiring within 2 months
- Immediate email alerts for expired DBS certificates
- Real-time email notifications for employee suspension and deactivation events
- Smart notification deduplication prevents spam (7-day cooldown for DBS, 1-day for status changes)
- QR code verification shows suspension status and DBS validity warnings
- Responsive design for mobile and desktop
- Search and filter functionality with suspension filter
- Toast notifications for user feedback
- Session-based admin authentication system
- Protected admin routes with automatic redirects
- QR code verification publicly accessible for mobile scanning
- Admin panel completely private - only accessible from company networks
- Network-level blocking of admin access from external internet

### Authentication System
- **Admin Credentials**: 
  - joshua@mcsclean.co.uk / Mcscleaning1!
  - amy@mcsclean.co.uk / Mcscleaning1!
  - kelly@mcsclean.co.uk / Mcscleaning1!
- **Session Management**: Express sessions with secure cookies
- **Protected Routes**: All admin endpoints require authentication
- **Auto-redirect**: Unauthenticated users redirected to login page

### Support Contact Information
- **Phone**: 01530 382006
- **Email**: joshua@trustpass.uk
- Contact details displayed on verification pages for support inquiries

## Data Flow

1. **Employee Management**: Administrators access the dashboard to add, edit, or remove employees
2. **Photo Upload**: Employee photos are uploaded to the `/uploads` directory during creation
3. **QR Code Generation**: Each employee gets a unique QR code linking to their verification page
4. **Verification Process**: Authenticated admin users scan QR codes to access employee verification information
5. **Statistics Tracking**: System tracks verification events and provides dashboard statistics

## External Dependencies

### Frontend Dependencies
- React ecosystem (React, React DOM)
- TanStack Query for data fetching
- Wouter for routing
- Radix UI primitives for accessible components
- Tailwind CSS for styling
- Date-fns for date formatting
- Various Lucide icons

### Backend Dependencies
- Express.js web framework
- Drizzle ORM for database operations
- Neon serverless PostgreSQL client
- Multer for file uploads
- Zod for schema validation
- Various TypeScript types

### Development Dependencies
- Vite for build tooling
- TypeScript for type safety
- ESBuild for server bundling
- Replit-specific plugins for development environment

## Deployment Strategy

The application is configured for deployment on Replit's autoscale infrastructure:

### Build Process
1. **Frontend**: Vite builds the React application to `dist/public`
2. **Backend**: ESBuild bundles the Express server to `dist/index.js`
3. **Assets**: Static files and uploads are served directly

### Environment Configuration
- **Development**: Uses `npm run dev` with TSX for hot reloading
- **Production**: Uses `npm run start` with the compiled JavaScript bundle
- **Database**: Requires `DATABASE_URL` environment variable for PostgreSQL connection

### Deployment Settings
- **Platform**: Replit autoscale deployment
- **Port**: Internal port 5000, external port 80
- **Build Command**: `npm run build`
- **Start Command**: `npm run start`

The system is designed to handle file uploads in the `/uploads` directory and serves them statically. The database schema is managed through Drizzle migrations in the `/migrations` directory.

## Changelog

```
Changelog:
- June 26, 2025. Initial setup
- June 26, 2025. Updated entire application color scheme from blue to green
- June 26, 2025. Integrated MCS logo on verification page
- June 26, 2025. Changed QR code color to green (#16A34A)
- July 1, 2025. Added DBS expiry date tracking and automated email notifications
- July 1, 2025. Implemented selective privacy: QR verification publicly accessible, admin areas private
- July 1, 2025. Network-level blocking protects admin panel while allowing QR scanning from external phones
- August 1, 2025. Added employee suspension status with admin toggle and QR verification warnings
- August 1, 2025. Enhanced QR verification with DBS expiry warnings and suspension status alerts
- August 1, 2025. Implemented comprehensive email notification system with smart deduplication
- August 1, 2025. Extended DBS expiry alerts to 2-month advance notice with separate expired certificate alerts
- August 1, 2025. Added real-time notifications for employee suspension and deactivation events
- August 1, 2025. Updated branding throughout system to reflect Trust Pass as operator powered by MCS
- August 1, 2025. Implemented dual-logo system: Trust Pass logo as primary operating logo, MCS logo retained for client identification
- August 1, 2025. Updated support contact information to joshua@trustpass.uk while maintaining phone number
- August 1, 2025. Removed DBS number from QR verification page while keeping it in admin portal for management purposes
- August 1, 2025. Added employment type system with permanent/temporary staff options and valid employment until dates for temporary workers
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```