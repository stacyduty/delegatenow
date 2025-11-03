# Delig8te - AI Executive Task Delegation Platform

## Overview

Delig8te is a voice-powered task delegation platform designed for executives to efficiently manage teams and tasks. The application enables users to speak their tasks, leveraging AI to analyze, prioritize, and delegate work automatically. Built with a modern tech stack, it features real-time task tracking, team management, and analytics with an emphasis on executive productivity and minimal friction.

**Core Value Proposition:** Transform voice input into structured, delegated tasks with AI-powered analysis including impact assessment, urgency classification, and SMART objectives generation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Build System:**
- React with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management with optimistic updates

**UI Component Strategy:**
- Radix UI primitives for accessible, unstyled components
- shadcn/ui component library using the "new-york" style
- Tailwind CSS for utility-first styling with custom design tokens
- Custom theming system supporting light/dark modes with CSS variables

**Design System:**
- Typography: Inter for headers/UI, IBM Plex Sans for body text
- Spacing: Tailwind scale (2, 4, 6, 8, 12, 16, 20, 24 units)
- Layout: 12-column responsive grid system
- Color system: HSL-based with semantic tokens (primary, secondary, muted, destructive, etc.)

**State Management Approach:**
- Server state handled via React Query with automatic caching and invalidation
- Local UI state managed with React hooks
- No global state management library - preference for component-level state

### Backend Architecture

**Server Framework:**
- Express.js with TypeScript for API routes
- HTTP server for REST endpoints
- Middleware pipeline for logging, authentication, and request parsing

**API Design:**
- RESTful endpoints under `/api` namespace
- Resource-based routing (tasks, team-members, notifications, voice-history)
- JSON request/response format
- Simple demo user authentication (temporary implementation pending proper auth)

**Business Logic:**
- Storage layer abstraction (`IStorage` interface) for database operations
- Service layer for AI integration and task analysis
- Separation of concerns between routes, storage, and external services

### Data Storage

**Database:**
- PostgreSQL via Neon serverless database
- Drizzle ORM for type-safe database queries and schema management
- WebSocket pooling for database connections

**Schema Design:**
- `users`: Executive account holders with Stripe subscription tracking
- `teamMembers`: Unlimited team members per user (Executive Plan feature)
- `tasks`: Delegated tasks with impact/urgency classification, progress tracking, and SMART objectives
- `notifications`: Real-time activity notifications
- `voiceHistory`: Audit trail of voice input transcripts and AI analysis

**Data Relationships:**
- User → TeamMembers (one-to-many, cascade delete)
- User → Tasks (one-to-many, cascade delete)
- TeamMember → Tasks (one-to-many via teamMemberId foreign key)
- User → Notifications (one-to-many)
- User → VoiceHistory (one-to-many)

### Authentication & Authorization

**Current Implementation:**
- Demo user middleware auto-creating `demo@weighpay.com` user
- bcrypt for password hashing
- Session-based authentication with cookies
- Temporary solution - indicates proper auth system is planned

**Authorization Pattern:**
- User context attached to all API requests via middleware
- Resource ownership validated at storage layer

### External Dependencies

**AI/ML Services:**
- OpenAI API (via Replit AI Integrations service)
- Used for voice transcript analysis and task intelligence
- Generates SMART objectives, impact/urgency classification, and assignee suggestions
- No direct OpenAI API key required - proxied through Replit's service

**Payment Processing:**
- Stripe for subscription management
- Executive Plan: $1/month with unlimited team members
- Customer ID and subscription status tracked in user records
- Webhook handling for subscription events (indicated by raw body parsing)

**Third-party UI Libraries:**
- Radix UI component primitives (20+ components)
- Lucide React for icons
- date-fns for date formatting
- cmdk for command palette functionality
- Embla Carousel for carousel components
- Recharts for data visualization (charts/analytics)

**Development Tools:**
- Replit-specific plugins for development experience (cartographer, dev banner, runtime error overlay)
- ESBuild for production bundling
- Drizzle Kit for database migrations

### Key Architectural Decisions

**Monorepo Structure:**
- `/client` - React frontend application
- `/server` - Express backend application  
- `/shared` - Shared TypeScript types and schemas (Zod validation)
- Enables code sharing and type safety across frontend/backend boundary

**Voice Input Processing:**
- Client captures voice input (implementation details not visible in files)
- Transcript sent to `/api/tasks/analyze` endpoint
- Server uses OpenAI to extract structured task data
- Immediate task creation with AI-generated metadata
- Optimistic UI updates via React Query invalidation

**Real-time Features:**
- Notification system for task assignments, completions, and updates
- Mark as read functionality for notification management
- Dashboard statistics computed server-side on demand
- No WebSocket implementation - relies on polling via React Query refetch

**Styling Philosophy:**
- Utility-first with Tailwind
- Custom elevation system (`hover-elevate`, `active-elevate-2`) for consistent interaction states
- Design tokens stored in CSS variables for theme flexibility
- Component-scoped styling via className composition

**Error Handling:**
- Toast notifications for user-facing errors
- Centralized API error handling in queryClient
- Zod schema validation on API boundaries with friendly error messages via `zod-validation-error`

**Performance Considerations:**
- Infinite stale time on React Query by default (manual invalidation)
- No automatic refetch on window focus
- Code splitting via dynamic imports for Replit plugins
- Optimistic updates for improved perceived performance