# Deleg8te.ai - Design Guidelines

## Design Approach

**Selected Approach:** Hybrid System - Enterprise Productivity Platform
Drawing inspiration from Linear's precision, Asana's clarity, and Monday.com's hierarchy, combined with voice-first interaction patterns from modern AI assistants.

**Core Principle:** Executive efficiency through voice-activated simplicity, minimalist information architecture, and real-time transparency.

---

## Typography System

**Font Stack:**
- Primary: Inter (via Google Fonts) - Headers, UI elements, dashboard metrics
- Secondary: IBM Plex Sans - Body text, task descriptions, form labels

**Hierarchy:**
- H1: 2.5rem (40px), font-weight: 700 - Page titles, dashboard headers
- H2: 1.875rem (30px), font-weight: 600 - Section headers, modal titles
- H3: 1.5rem (24px), font-weight: 600 - Card headers, widget titles
- H4: 1.25rem (20px), font-weight: 500 - Subsection headers
- Body Large: 1.125rem (18px), font-weight: 400 - Task titles, primary content
- Body: 1rem (16px), font-weight: 400 - Standard text, descriptions
- Small: 0.875rem (14px), font-weight: 400 - Metadata, timestamps, secondary info
- Micro: 0.75rem (12px), font-weight: 500 - Labels, badges, status indicators

---

## Layout & Spacing System

**Spacing Units:** Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Micro spacing (buttons, inputs): p-2, p-4
- Component spacing (cards, sections): p-6, p-8
- Section spacing (page margins): p-12, p-16, p-20, p-24

**Grid System:**
- Dashboard: 12-column grid with gap-6
- Task cards: 3-column grid on desktop (lg:grid-cols-3), 2-column tablet (md:grid-cols-2), single column mobile
- Team member list: 4-column grid for avatars/cards (lg:grid-cols-4)

**Container Widths:**
- Full dashboard: max-w-[1600px] mx-auto
- Content sections: max-w-7xl
- Forms/modals: max-w-2xl
- Voice input overlay: max-w-3xl

---

## Core Component Library

### Navigation & Shell

**Executive Dashboard Shell:**
- Persistent left sidebar (w-64) with navigation menu
- Top bar (h-16) containing: voice activation button, notifications bell, executive profile, subscription status badge
- Main content area with breadcrumb navigation
- Sidebar items: Dashboard, Active Tasks, Team Members, Analytics, Voice History, Settings

**Mobile Navigation:**
- Bottom tab bar (h-16) with 5 key sections
- Hamburger menu for secondary options
- Floating voice activation button (bottom-right, fixed position)

### Voice Interface

**Voice Activation Center (Primary Feature):**
- Large centered voice button on dashboard (96x96px circular)
- Pulsing animation ring when listening
- Full-screen overlay when activated showing:
  - Waveform visualization (real-time speech input)
  - Transcription text appearing as user speaks
  - AI processing indicator
  - Suggested actions preview
- Voice button states: Idle, Listening, Processing, Success

**Voice Input Card:**
- Floating card overlay (rounded-2xl, shadow-2xl)
- Live transcription text (text-xl)
- Quick action buttons: "Confirm & Delegate", "Edit Details", "Cancel"

### Task Management Components

**Task Card (Primary Component):**
- Card structure: rounded-lg, border, p-6
- Header: Task title (font-semibold, text-lg) + priority badge + urgency indicator
- SMART breakdown section with collapsible details
- Assignee avatar + name
- Progress bar (h-2, rounded-full) showing completion %
- Footer: Due date, time elapsed, status badge
- Hover state: subtle lift (shadow-md)

**Priority Matrix Visualization:**
- 2x2 quadrant grid showing Impact (vertical) vs Urgency (horizontal)
- Tasks plotted as cards within quadrants
- Color-coded quadrant backgrounds (subtle gradients)
- Drag-and-drop functionality for re-prioritization

**Task Detail Modal:**
- Slide-in panel from right (w-full md:w-2/3 lg:w-1/2)
- Sections: Original voice request, AI analysis, SMART objectives, Assignment history, Comments/Updates, Progress timeline
- Fixed action bar at bottom with Update/Complete/Reassign buttons

### Team Management

**Team Member Grid:**
- Card-based layout (4 columns desktop, 2 tablet, 1 mobile)
- Each card: Avatar (large, rounded-full), name, role, active tasks count, performance metrics
- Add member button: Dashed border card with plus icon
- Member detail view: Slide-in panel showing all assigned tasks, completion rate, communication history

**Assignment Interface:**
- Dropdown with searchable team member list
- Avatar + name + current workload indicator
- Quick assign buttons for frequent assignees
- Bulk assignment for multiple tasks

### Alerts & Communication

**Notification Center:**
- Dropdown panel from top-right notification bell
- Grouped by type: Task assignments, Updates, Completions, Team messages
- Each notification: Icon, message, timestamp, action button
- Mark all as read, filter options
- Unread badge count on bell icon

**In-App Alert Cards:**
- Toast notifications (bottom-right, stacked)
- Auto-dismiss after 5 seconds with progress bar
- Types: Success (task delegated), Info (update), Warning (deadline approaching), Error
- Click to expand for full details

**Communication Thread:**
- Chat-style interface for task-specific communication
- Executive messages right-aligned, team member messages left-aligned
- Voice message support with playback controls
- Attachment previews
- Typing indicators

### Dashboard Widgets

**Executive Overview (Hero Section):**
- Large metrics display (3-column grid):
  - Total active tasks (large number + trend indicator)
  - Team productivity score (circular progress)
  - Tasks completed today (count + percentage)
- Voice activation central prominence
- Quick action buttons: "Delegate New Task", "View All Tasks", "Team Overview"

**Real-Time Task Board:**
- Kanban-style columns: To Delegate, Delegated, In Progress, Review, Completed
- Cards move smoothly between columns (animated transitions)
- Column headers with task counts
- Filter/search bar above board

**Analytics Dashboard:**
- Time-series graphs for delegation patterns
- Team performance comparison (bar charts)
- AI delegation accuracy metrics
- Voice usage statistics

### Forms & Inputs

**Standard Form Elements:**
- Input fields: h-12, rounded-lg, border, px-4
- Labels: text-sm, font-medium, mb-2
- Helper text: text-xs, mt-1
- Error states: red border, error message below
- Focus states: ring-2 offset

**Task Edit Form:**
- Multi-section form with clear visual separation
- Inline editing for quick updates
- Auto-save indicators
- Validation feedback inline

### Payment & Subscription

**Subscription Card:**
- Featured card on settings page
- Current plan: "Executive Plan - $1/month/user"
- Team size: "Unlimited members"
- Stripe-powered badge
- Manage subscription button (secondary style)

**Payment Modal:**
- Clean Stripe checkout embedded
- Subscription details summary
- Security badges
- Success confirmation screen

---

## Interaction Patterns

**Voice-First Design:**
- Voice button accessible from every screen
- Keyboard shortcut (Space bar to activate) with visual indicator
- Voice commands list accessible via help icon
- Confirmation dialogs for voice-initiated actions

**Real-Time Updates:**
- Subtle pulse animation on updated elements
- Live badges showing "Just now", "2m ago" timestamps
- Background sync indicator (small icon in top bar)
- Optimistic UI updates with rollback on failure

**Progressive Disclosure:**
- Collapsed details by default, expand on demand
- "Show more" links for long content
- Stepwise forms for complex task creation
- Contextual help tooltips

---

## Responsive Behavior

**Desktop (lg: 1024px+):**
- Full sidebar navigation visible
- 3-4 column grids for content
- Side-by-side detail panels
- Expanded voice interface overlay

**Tablet (md: 768px):**
- Collapsible sidebar
- 2 column grids
- Stacked detail views
- Compact voice interface

**Mobile (base: <768px):**
- Bottom navigation
- Single column layout
- Full-screen modals
- Floating voice button (persistent)
- Swipe gestures for quick actions

---

## Accessibility Standards

- WCAG 2.1 AA compliance throughout
- Keyboard navigation for all interactions
- Screen reader optimized labels and ARIA attributes
- High contrast focus indicators (ring-2)
- Alternative text for all voice-activated features
- Skip navigation links
- Consistent tab order
- Form validation with clear error messaging

---

## PWA Features Visual Treatment

**Install Prompt:**
- Elegant modal with app icon, benefits list, Install/Dismiss buttons
- Appears after 2 meaningful interactions

**Offline Indicator:**
- Subtle banner at top when offline
- Cached tasks available with "sync pending" badges
- Queue counter for pending updates

**Update Available:**
- Non-intrusive notification with "Update Now" action
- Progress indicator during update

---

## Images

**Hero Section Image:** No large hero image. This is a dashboard/productivity app focused on functionality. The voice activation interface serves as the visual centerpiece.

**Supporting Imagery:**
- Team member avatars throughout (user-uploaded, circular crop)
- Empty state illustrations for zero tasks, no team members (simple line art style)
- Success confirmation graphics (checkmark animations, celebration micro-interactions)
- Tutorial/onboarding screenshots showing voice activation in action