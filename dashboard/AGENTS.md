# dashboard/ - Next.js Dashboard

**Purpose:** Next.js (app router) dashboard for managing campaigns, accounts, jobs, and analytics.

## STRUCTURE
```
dashboard/
â”œâ”€â”€ app/                  # Next.js pages (app router)
â”‚   â”œâ”€â”€ layout.tsx        # Root layout with Sidebar + Header
â”‚   â”œâ”€â”€ page.tsx          # Home / overview
â”‚   â”œâ”€â”€ accounts/         # Account management (list + create)
â”‚   â”œâ”€â”€ campaigns/        # Campaign CRUD + detail view
â”‚   â”œâ”€â”€ blast-runner/     # Manual blast trigger UI
â”‚   â”œâ”€â”€ jobs/             # Job queue monitoring
â”‚   â”œâ”€â”€ leads/            # Lead capture view
â”‚   â”œâ”€â”€ settings/         # Runtime settings
â”‚   â”œâ”€â”€ templates/        # Template CRUD
â”‚   â””â”€â”€ analytics/        # Dashboard analytics
â”œâ”€â”€ components/
â”‚   â”œâ”€â”€ layout/           # Header, Sidebar
â”‚   â””â”€â”€ ui/               # Reusable UI components (17 components)
â”œâ”€â”€ lib/                  # Shared utilities, API client, types, hooks
â”œâ”€â”€ public/               # Static assets
â”œâ”€â”€ next.config.mjs
â”œâ”€â”€ tailwind.config.ts
â””â”€â”€ tsconfig.json
```

## KEY FILES

| Path | Purpose |
|------|---------|
| `app/layout.tsx` | Root layout with Sidebar + Header shell |
| `app/page.tsx` | Home dashboard overview |
| `lib/api.ts` | Typed fetch wrapper for backend API |
| `lib/hooks.ts` | Shared React hooks (useAccounts, useCampaigns, etc.) |
| `lib/types.ts` | Shared TypeScript types for UI |
| `lib/constants.ts` | App-wide constants |
| `components/ui/DataTable.tsx` | Reusable data table with sorting/pagination |
| `components/ui/StatusBadge.tsx` | Status indicator badges |
| `components/ui/PlatformIcon.tsx` | Platform-specific icons |
| `components/ui/Dialog.tsx` | Modal dialog component |
| `components/ui/FormField.tsx` | Form input wrapper |
| `components/ui/sonner.tsx` | Toast notifications (sonner) |
| `components/ui/Toaster.tsx` | Toast provider/container |

## STACK
- Next.js 14+ (app router)
- Tailwind CSS
- shadcn/ui-based component library
- React Server Components where applicable

## NOTES

- API routes under `/api/*` proxy to Express backend at configurable `NEXT_PUBLIC_API_BASE`
- Dashboard runs on separate port (`DASHBOARD_PORT`, default 3001)
