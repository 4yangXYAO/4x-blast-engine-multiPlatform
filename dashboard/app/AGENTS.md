# dashboard/app/ - Next.js App Router Pages

**Purpose:** Route handlers and page components for the dashboard UI.

## STRUCTURE
```
app/
â”œâ”€â”€ layout.tsx            # Root layout shell
â”œâ”€â”€ page.tsx              # Home / overview
â”œâ”€â”€ globals.css           # Global styles
â”œâ”€â”€ accounts/
â”‚   â”œâ”€â”€ page.tsx          # Account list
â”‚   â””â”€â”€ new/page.tsx      # Create account
â”œâ”€â”€ campaigns/
â”‚   â”œâ”€â”€ page.tsx          # Campaign list
â”‚   â”œâ”€â”€ new/page.tsx      # Create campaign
â”‚   â””â”€â”€ [id]/page.tsx     # Campaign detail
â”œâ”€â”€ blast-runner/
â”‚   â””â”€â”€ page.tsx          # Manual blast trigger
â”œâ”€â”€ jobs/
â”‚   â””â”€â”€ page.tsx          # Job queue monitor
â”œâ”€â”€ leads/
â”‚   â””â”€â”€ page.tsx          # Lead capture view
â”œâ”€â”€ templates/
â”‚   â”œâ”€â”€ page.tsx          # Template list
â”‚   â””â”€â”€ new/page.tsx      # Create template
â”œâ”€â”€ settings/
â”‚   â””â”€â”€ page.tsx          # Runtime settings
â””â”€â”€ analytics/
    â””â”€â”€ page.tsx          # Dashboard analytics
```

## CONVENTIONS

- Uses Next.js 14+ App Router (server components by default)
- Route segments map 1:1 to URL paths
- Dynamic routes use `[param]` convention (`[id]`)
- `layout.tsx` provides shared Sidebar + Header shell
- Client components in `components/ui/`

## NOTES

- `globals.css` contains Tailwind directives and global resets
- Each page imports from `lib/api.ts` for backend communication
- `analytics/` is a standalone dashboard view
