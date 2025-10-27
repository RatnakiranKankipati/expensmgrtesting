# Overview

This is a full-stack expense tracking application built with React frontend and Express.js backend. The application allows users to manage expenses, budgets, and categories with features like receipt uploads, analytics, and data visualization. It uses TypeScript throughout for type safety and includes comprehensive CRUD operations for expense management.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React 18 with TypeScript and Vite for build tooling
- **UI Library**: Shadcn/ui components built on Radix UI primitives with Tailwind CSS for styling
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Routing**: Wouter for client-side routing (lightweight alternative to React Router)
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **File Uploads**: Uppy with AWS S3 integration for receipt uploads
- **Charts**: Recharts for data visualization and analytics

## Backend Architecture
- **Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Authentication**: Basic session-based approach (expandable)
- **File Storage**: Google Cloud Storage with ACL-based access control
- **API Design**: RESTful API with structured error handling and logging middleware
- **Validation**: Shared Zod schemas between frontend and backend for consistent validation

## Data Storage
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Schema Design**: Three main entities - categories, budgets, and expenses with proper foreign key relationships
- **Connection**: Neon Database serverless PostgreSQL instance
- **Migrations**: Drizzle Kit for schema migrations and database management

## File Management
- **Storage Provider**: Google Cloud Storage for receipt attachments
- **Access Control**: Custom ACL system with object-level permissions
- **Upload Strategy**: Direct-to-cloud uploads with presigned URLs
- **File Organization**: Structured object paths with metadata support

## Development Architecture
- **Build System**: Vite for fast development and optimized production builds
- **Code Organization**: Monorepo structure with shared types and schemas
- **Styling**: Tailwind CSS with custom design system variables
- **Type Safety**: End-to-end TypeScript with shared validation schemas

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Drizzle ORM**: Type-safe database toolkit with PostgreSQL adapter

## Cloud Storage
- **Google Cloud Storage**: Object storage for receipt files and attachments
- **Replit Sidecar**: Authentication service for GCS access in Replit environment

## UI Framework Dependencies
- **Radix UI**: Headless component primitives for accessibility
- **Tailwind CSS**: Utility-first CSS framework
- **Shadcn/ui**: Pre-built component library with consistent design system

## Development Tools
- **Vite**: Build tool with hot module replacement and optimization
- **TanStack Query**: Server state management with caching and synchronization
- **React Hook Form**: Form state management with validation
- **Zod**: Runtime type validation and schema definition
- **Recharts**: Chart library for data visualization

## File Upload Infrastructure
- **Uppy**: File upload library with progress tracking and error handling
- **AWS S3 Uppy Plugin**: Direct-to-S3 upload capabilities (adaptable to other providers)

## Deployment Considerations
- The application is structured for deployment on Replit with specific integrations
- Uses environment variables for database connections and cloud service credentials
- Supports both development and production build configurations