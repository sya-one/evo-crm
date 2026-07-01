# EVO CRM - Financial Services Platform

A production-ready CRM built for financial services companies.

## Tech Stack

- **Next.js 16** (App Router)
- **React 19** + TypeScript
- **Tailwind CSS v4** with shadcn/ui components
- **Prisma ORM** with MySQL
- **NextAuth.js** (credentials provider with RBAC)
- **Recharts** for charts
- **Sonner** for toast notifications
- **Lucide** icons

## Quick Start

### 1. Install Dependencies
\`\`\`bash
npm install
\`\`\`

### 2. Configure Environment
Copy \`.env.example\` to \`.env\` and update values:
\`\`\`bash
cp .env.example .env
# Edit .env with your database connection string
\`\`\`

### 3. Generate Prisma Client
\`\`\`bash
npx prisma generate
\`\`\`

### 4. Push Database Schema
\`\`\`bash
npx prisma db push
\`\`\`

### 5. Seed Database
\`\`\`bash
npx tsx prisma/seed.ts
\`\`\`

### 6. Start Development Server
\`\`\`bash
npm run dev
\`\`\`

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@evocrm.com | Admin@123456 |
| Executive | executive@evocrm.com | Admin@123456 |
| Manager | manager@evocrm.com | Admin@123456 |
| Consultant 1 | consultant1@evocrm.com | Admin@123456 |
| Consultant 2 | consultant2@evocrm.com | Admin@123456 |
| Support Agent | support@evocrm.com | Admin@123456 |

## Features

- **Executive Dashboard**: KPI cards, revenue charts, deal pipeline visualization
- **Deal Management**: Full CRUD, Kanban board (7 stages), list view
- **Claim Management**: Auto-generated claim numbers (CLM-2026-XXXXXX), SLA tracking
- **Query Management**: Auto-generated query numbers (QRY-2026-XXXXXX)
- **Client 360°**: Complete client profiles with deals, claims, queries, activity timeline
- **Role-Based Access**: SUPER_ADMIN, EXECUTIVE, MANAGER, CONSULTANT, SUPPORT_AGENT
- **SLA Engine**: Automatic escalation when SLAs are breached
- **Notifications**: In-app notifications for claims, queries, SLA breaches
- **Reports**: Revenue reports, deal exports with CSV download
- **User Management**: Super admin can manage users

## Project Structure

\`\`\`
src/
├── app/
│   ├── (dashboard)/     # Protected dashboard routes
│   │   ├── dashboard/   # Executive dashboard
│   │   ├── deals/       # Deal management
│   │   ├── claims/      # Claim management
│   │   ├── queries/     # Query management
│   │   ├── clients/     # Client 360° profiles
│   │   ├── users/       # User management (admin)
│   │   ├── reports/     # Reporting module
│   │   ├── notifications/
│   │   └── settings/
│   ├── api/             # API routes
│   ├── login/           # Login page
│   └── layout.tsx       # Root layout
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── sidebar.tsx      # Navigation sidebar
│   └── header.tsx       # Dashboard header
├── lib/
│   ├── auth.ts          # NextAuth configuration
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Utility functions
└── types/               # TypeScript types
\`\`\`