# Deleg8te.ai - AI Executive Task Delegation Platform

## Overview

Deleg8te.ai is a voice-powered task delegation platform designed for executives to efficiently manage teams and tasks. It leverages AI to analyze, prioritize, and delegate work automatically from voice, video, or text input. The platform offers real-time task tracking, team management, analytics, and Google Calendar integration. Its core value proposition is transforming various inputs into structured, delegated tasks with AI-powered analysis, including impact assessment, urgency classification, and SMART objectives generation, while incorporating enterprise-grade compliance features like formal task acceptance, expiry tracking, spending limits, and audit trails. Deleg8te.ai aims to combine AI productivity with enterprise compliance at consumer-friendly pricing, offering significant cost savings compared to traditional solutions. Strategic growth involves building a lightweight integrations ecosystem and launching a PRO tier with advanced features.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

The frontend uses React with TypeScript, Vite for building, Wouter for routing, and TanStack Query for server state management. UI components are built with Radix UI primitives and shadcn/ui, styled using Tailwind CSS with a custom theming system supporting light/dark modes. Typography uses Inter and IBM Plex Sans, with a 12-column responsive grid and an HSL-based color system. State management relies on React hooks for local UI state and React Query for server state, avoiding a global state management library.

### Backend Architecture

The backend is built with Express.js and TypeScript, providing RESTful endpoints under the `/api` namespace for resources like tasks, team members, notifications, and voice history. It uses JSON for requests/responses and includes middleware for logging, authentication, and request parsing. Business logic separates concerns into routing, storage, and external services, with a defined `IStorage` interface for database operations and a service layer for AI integration.

### Data Storage

PostgreSQL, managed by Neon, is the primary database, utilizing Drizzle ORM for type-safe queries. The schema includes `users`, `teamMembers`, `tasks` (with compliance fields like `acceptedAt`, `expiryDate`, `spendingLimit`), `notifications`, `voiceHistory`, and `calendarEvents`. Key relationships exist between users and their team members, tasks, notifications, voice history, and calendar events, with tasks optionally linked to calendar events.

### Authentication & Authorization

The current implementation uses a demo user middleware, bcrypt for password hashing, and session-based authentication with cookies. Authorization validates resource ownership at the storage layer via a user context attached to all API requests.

### Key Architectural Decisions

-   **Monorepo Structure:** Organizes the codebase into `/client`, `/server`, and `/shared` for code sharing and type safety.
-   **Task Creation Methods:** Supports voice input, text-based input, and video message delegation. Video delegation involves WebRTC recording, backend audio extraction (ffmpeg), OpenAI Whisper for transcription, and AI analysis for structured task data.
-   **Real-time Features:** Utilizes React Query polling for notifications and dashboard statistics rather than WebSockets.
-   **Offline Functionality:** Implemented via IndexedDB for offline storage of API data, mutation queuing for offline operations, and a service worker for app caching, ensuring seamless online/offline transitions. Video delegation requires online connectivity.
-   **Voice-First & Mobile-First Strategy:** Prioritizes features like a bottom navigation bar, PWA, push notifications, and enhanced voice commands to optimize for mobile and voice interaction.
-   **Styling Philosophy:** Utility-first with Tailwind, custom elevation systems, and design tokens stored in CSS variables.
-   **Error Handling:** Utilizes toast notifications for user-facing errors and centralized API error handling, with Zod schema validation.
-   **Performance Considerations:** Employs infinite stale time, manual invalidation with React Query, no automatic refetch on window focus, code splitting, and optimistic updates.

## External Dependencies

-   **AI/ML Services:** OpenAI API (via Replit AI Integrations service) for voice/video transcript analysis, SMART objective generation, impact/urgency classification, and assignee suggestions. OpenAI Whisper API specifically for video-to-audio transcription.
-   **Video Processing:** ffmpeg (fluent-ffmpeg) for audio extraction from video files (MP4, WebM, QuickTime, AVI), with a maximum file size of 100MB and duration of 10 minutes.
-   **Payment Processing:** Stripe for subscription management and webhook handling.
-   **Google Calendar Integration:** Google Calendar API (via Replit connector) for two-way sync, deadline tracking, and team availability checking.
-   **Slack Integration:** OAuth 2.0 flow for task notifications to Slack, triggered by task creation, assignment, and completion events. Token storage and workspace metadata are managed in the database.
-   **Integration Marketplace:** A UI at `/integrations` provides a professional interface for managing connections to various external services, supporting future integrations with services like Trello, Asana, Monday, GitHub, GitLab, Jira, Teams, Discord, Telegram, Zapier/Make.
-   **Third-party UI Libraries:** Radix UI, Lucide React, date-fns, cmdk, Embla Carousel, Recharts.
-   **Development Tools:** Replit-specific plugins, ESBuild, Drizzle Kit.