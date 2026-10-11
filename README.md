# Nitte CampusConnect — Smart Venue Booking & Event Calendar

> **"One Campus. One Calendar. Smarter Events."**
> Centralized campus venue booking and event coordination platform designed for **NMAM Institute of Technology (NMAMIT), Nitte**.

---

## 1. Project Overview & Vision

In large collegiate institutions, venue discovery and event reservation often suffer from spreadsheet confusion, email bottlenecks, fragmented phone calls, and double-booking disasters. 

**Nitte CampusConnect** eliminates these inefficiencies by introducing a unified, production-ready campus platform that enables:
1. **Shared Interactive Campus Calendar:** Google Calendar-style views (Month, Week, Day, Agenda) showing confirmed campus events and operational availability.
2. **Comprehensive Venue Directory:** Organized by campus block, venue type, and verified seating capacity.
3. **Smart Venue Booking Wizard:** A multi-step wizard featuring transparent, explainable venue recommendation scoring.
4. **Production-Grade Concurrency Protection:** Atomic database transactions and buffer checks preventing double-bookings.
5. **Alternative Slot Explorer:** Intelligent suggestions when a requested slot is occupied.
6. **Administrative Review Queue:** Operational workflows allowing campus administrators to approve, reject with mandatory reasons, or reassign venues.
7. **QR Check-in & Calendar Export:** Verifiable check-in pass generation and standard `.ics` exports for Google Calendar, Apple Calendar, and Outlook.
8. **Institutional Identity Rules:** Domain validation enforcing `@nmamit.in` and `@nitte.in` accounts, designed for institutional SSO readiness.

---

## 2. Technology Stack

- **Frontend Framework:** React 19 with TypeScript
- **Build System:** Vite
- **Styling:** Vanilla Tailwind CSS with curated SaaS design tokens (deep navy, indigo, restrained status badges)
- **Interactive Calendar:** FullCalendar React (`@fullcalendar/daygrid`, `@fullcalendar/timegrid`, `@fullcalendar/list`, `@fullcalendar/interaction`)
- **Icons & Graphics:** Lucide React
- **Analytics Visualizations:** Recharts (responsive bar and donut charts)
- **QR Code Engine:** `qrcode` canvas generator
- **Form State & Utilities:** Date-fns, clsx, tailwind-merge, canvas-confetti
- **Backend Architecture:** Dual-mode architecture:
  - **Live Mode:** Hosted Supabase PostgreSQL with Row Level Security (RLS) and transactional RPC functions.
  - **Local Demo Mode:** Embedded transactional store with `localStorage` replication and realistic NMAMIT seed data for immediate evaluation without external credentials.

---

## 3. Campus Venues Catalog

### Real NMAMIT Venues (Verified College Data)
These venues represent official facilities at NMAMIT, Nitte:

| Venue Name | Campus Block | Venue Type | Capacity Range | Recommended | Primary Facilities |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Nandini Seminar Hall** | APJ Kalam Block | Seminar Hall | 50 – 100 | 80 Seats | Tiered Theater Seating, Dual AC, Motorized Projector, PA System |
| **Shambavi Seminar Hall** | APJ Kalam Block | Seminar Hall | 100 – 200 | 160 Seats | Dual HD Projectors, VC Bridge, Stage Lighting, Acoustic Wall Panelling |
| **Sambhram Hall** | Ramanujan Block | Auditorium | 200 – 500 (Max 500) | 450 Seats | Grand Proscenium Stage, Central HVAC, Line-Array Sound, VIP Lounge |
| **Phalguni Hall** | Ramanujan Block | Seminar Hall | 50 – 80 | 65 Seats | Cushioned Seating, Interactive Touch Lectern, AC, Whiteboard |

### Demonstration Venues (Clearly Labeled Demo Data)
These facilities illustrate administrative scalability and can be modified or removed by administrators:
- **Conference Room A:** Academic Administration Block (Capacity: 20 people)
- **Innovation Lab:** Innovation and Research Block (Capacity: 40 people)
- **Open-Air Amphitheatre:** Central Campus Lawn (Capacity: 300 people)
- **Boardroom B:** Academic Administration Block (Capacity: 15 people)

---

## 4. Production-Grade Concurrency & Conflict Prevention

A critical requirement of the system is guaranteeing that two users cannot reserve the same venue for overlapping periods, even if both submit simultaneously.

### Strategy Implementation:
1. **Buffered Time Ranges:** All bookings automatically include setup and cleanup buffers (default 15 minutes before and after). Concurrency validation calculates overlap using:
   $$\text{overlap} = \max(\text{start}_A, \text{start}_B) < \min(\text{end}_A, \text{end}_B)$$
2. **Server-Side Transaction Locking:** Final booking approval runs inside PostgreSQL transactional RPC (`approve_booking_transactional`) using `FOR UPDATE` row-level locks on the target venue row, serializing competing requests.
3. **Re-validation on Approval:** If an overlapping booking was approved while an administrator had a pending request open, the system blocks approval and presents an immediate conflict warning.
4. **Maintenance Shutdown Integration:** Venues blocked for maintenance (`venue_blocks`) automatically prevent reservation requests and recommendations during their maintenance window.

---

## 5. Evaluation Personas & Demo Accounts

For grading and demonstration, three accounts are pre-configured with 1-click access:

| Persona | Name | Role | Email | Responsibilities |
| :--- | :--- | :--- | :--- | :--- |
| **Dean / Administrator** | Dr. Rajesh Hegde | `admin` | `dean.studentaffairs@nmamit.in` | Full clearance rights, review queue, conflict monitor, venue management |
| **Faculty Organizer** | Prof. Smitha Rao | `user` | `smitha.rao@nmamit.in` | Department symposium requests, calendar tracking, QR check-in passes |
| **Student Club Lead** | Rohan Kamath | `user` | `rohan.kamath@nitte.in` | Hackathon & cultural bookings, alternative slot selection, cancellation |

*Tip: Use the quick role toggle in the top navbar or the Persona Switcher on the Profile page to switch between Administrator and Organizer views instantly.*

---

## 6. Installation & Local Development

### Prerequisites
- Node.js v18+ (tested on v22)
- npm v9+

### Setup Steps
```bash
# 1. Clone repository
git clone https://github.com/your-username/nitte-campusconnect.git
cd task-2

# 2. Install dependencies
npm install

# 3. Copy environment configuration
cp .env.example .env

# 4. Start the Vite development server
npm run dev
```

The application will start at `http://localhost:5173`.

### Production Build
```bash
# Build production bundle with TypeScript type-checking
npm run build

# Preview production build locally
npm run preview
```

---

## 7. Supabase Database Setup & Migrations

If connecting a hosted Supabase PostgreSQL project:
1. Create a new project in [Supabase](https://supabase.com).
2. Navigate to **SQL Editor** in the Supabase Dashboard.
3. Run the schema migration script:
   - File: `supabase/migrations/20261011_initial_schema.sql`
4. Run the seed data script:
   - File: `supabase/seed.sql`
5. In your `.env` file, populate:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   ```
6. Restart the development server. The navbar status pill will display **"Supabase Live"** with a green pulse.

---

## 8. Deployment Instructions

### Deploy to Vercel
1. Push repository to GitHub.
2. Import project into [Vercel](https://vercel.com).
3. Framework Preset: **Vite**.
4. Root Directory: `./`.
5. Build Command: `npm run build`.
6. Output Directory: `dist`.
7. Add Environment Variables: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` (optional).
8. Click **Deploy**.

### Deploy to Netlify
1. Connect repository in [Netlify](https://netlify.com).
2. Build command: `npm run build`.
3. Publish directory: `dist`.
4. Add environment variables if linking hosted Supabase.
5. Deploy site.

---

## 9. Feature Checklist & Acceptance Verification

- [x] Responsive, modern SaaS interface inspired by Google Calendar & Linear
- [x] Multi-view Campus Calendar (Month, Week, Day, Agenda) with category color coding
- [x] Real NMAMIT Venues accurately represented (Nandini, Shambavi, Sambhram, Phalguni)
- [x] Additional venues clearly flagged as demonstration data
- [x] Multi-step Booking Wizard with progress tracking
- [x] Explainable Venue Recommendation Engine with transparency scores
- [x] Alternative Slot Explorer proposing clash-free time slots and alternative halls
- [x] Booking Status Lifecycle (Draft, Pending Approval, Under Review, Approved, Rejected, Cancelled)
- [x] Administrative Review Queue with server-side transactional recheck
- [x] Conflict Monitor with scheduling pressure analysis
- [x] Real-time In-App Notification Center
- [x] QR Code event admission pass generator
- [x] Export to standard `.ics` iCalendar file
- [x] Reports & Analytics with CSV data export
- [x] Role-Based Access Control (RBAC) with `@nmamit.in` and `@nitte.in` domain validation
- [x] Standalone offline demo provider + Supabase PostgreSQL migration scripts
- [x] Clean, passing TypeScript compilation and zero console errors

---

## 10. License & Academic Attribution
Developed for the **User Interface Design (UID)** subject project at **NMAM Institute of Technology (NMAMIT), Nitte**.
All college venue names and capacities conform to official institutional facilities.
