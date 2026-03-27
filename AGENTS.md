# 🚀 Tansi Motors Hiring Dashboard — FINAL AGENT v2

## 🧠 SYSTEM ROLE

You are a **senior full-stack Next.js engineer** shipping a **Next.js 16.2 App Router application** with zero shortcuts.

- Write **complete production-ready code**
- Follow constraints **strictly and literally**
- Avoid unnecessary abstractions
- **Never leave TODOs, stubs, or partial code**
- Every file fully implemented before moving to the next

---

## ⚙️ STACK

| Layer         | Choice                                                   |
| ------------- | -------------------------------------------------------- |
| Framework     | **Next.js 16.2** (App Router only, Turbopack default)    |
| Language      | **TypeScript strict** (no `any`)                         |
| UI            | **shadcn/ui** (all interactive elements)                 |
| Styling       | **Tailwind CSS v4** (zero custom CSS files)              |
| Database      | **Google Sheets API v4**                                 |
| Auth          | Simple password gate via cookies                         |
| Async state   | React `useTransition` (never raw `useState` for loading) |
| Smooth scroll | `@studio-freight/lenis`                                  |
| Charts        | **shadcn Charts** (Recharts AreaChart + BarChart)        |

---

## 🔐 ENVIRONMENT VARIABLES

```env
GOOGLE_CLIENT_EMAIL=
GOOGLE_PRIVATE_KEY=
SHEET_ID=
TAB_NAME=Applicants
DASHBOARD_PASSWORD=
```

**Rules:**

- All in `.env.local` — never hardcoded
- Confirm `.gitignore` includes `.env.local`
- `GOOGLE_PRIVATE_KEY` must do `.replace(/\\n/g, "\n")` — **critical auth fix**
- No `NEXT_PUBLIC_` prefix needed for any of these

---

## 📊 GOOGLE SHEETS SCHEMA

**Sheet name:** `Applicants` (or value of `TAB_NAME` env var)

**Columns A → H:**

| Col | Field          | Type   | Notes                                                     |
| --- | -------------- | ------ | --------------------------------------------------------- |
| A   | `created_time` | string | ISO datetime, auto on create                              |
| B   | `position`     | string | Role title (Sales/Service)                                |
| C   | `full_name`    | string | Full name, no truncation                                  |
| D   | `phone`        | string | Exactly 10 digits                                         |
| E   | `email`        | string | Valid email                                               |
| F   | `status`       | string | `pending` / `rejected` / `interested` / `inprocess`       |
| G   | `feedback`     | string | Max 300 chars                                             |
| H   | `updated`      | string | `JSON.stringify(string[])` — ISO date array (append-only) |

**`updated` field logic:**

- **On create:** `JSON.stringify([new Date().toISOString()])`
- **On every save:** parse → append today's ISO → re-stringify
- **Display last date:** `updated[updated.length - 1]`
- **Display count:** `updated.length` (e.g., "Updated 3×")

---

## 🧱 CORE FEATURES

### ✅ 1. SERVER CACHE (5 MINUTES TTL)

In-memory cache for applicants and analytics (shared across requests):

```ts
// src/lib/cache.ts
const cache = new Map<string, { data: any; expiry: number }>();

export const getCache = (key: string) => {
  const item = cache.get(key);
  if (!item || Date.now() > item.expiry) return null;
  return item.data;
};

export const setCache = (key: string, data: any) => {
  cache.set(key, {
    data,
    expiry: Date.now() + 1000 * 60 * 5, // 5 minutes
  });
};

export const clearCache = () => cache.clear();
```

---

### 🚦 2. RATE LIMITING (60 req/min per IP)

```ts
// src/lib/rateLimit.ts
const store = new Map<string, { count: number; time: number }>();

export function rateLimit(ip: string) {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const entry = store.get(ip);

  if (!entry || now - entry.time > windowMs) {
    store.set(ip, { count: 1, time: now });
    return true;
  }

  if (entry.count >= 60) return false;
  entry.count++;
  return true;
}
```

**Usage in all API routes:**

```ts
const ip = req.headers.get("x-forwarded-for") ?? "127.0.0.1";
if (!rateLimit(ip)) {
  return new Response("Too Many Requests", { status: 429 });
}
```

---

### 📦 3. SHEETS CLIENT

```ts
// src/lib/sheets.ts
import { google } from "googleapis";

const auth = new google.auth.JWT({
  email: process.env.GOOGLE_CLIENT_EMAIL,
  key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n"), // CRITICAL
  scopes: ["https://www.googleapis.com/auth/spreadsheets"],
});

export const sheets = google.sheets({ version: "v4", auth });
export const SHEET_ID = process.env.SHEET_ID!;
export const TAB_RANGE = `${process.env.TAB_NAME}!A:H`;
```

---

### 🧠 4. DATA MAPPING

```ts
// src/lib/mapRow.ts
import type { Applicant } from "@/types";

export const mapRow = (row: (string | number)[], index: number): Applicant => ({
  id: String(index + 2), // row number in sheet
  created_time: String(row[0] ?? ""),
  position: String(row[1] ?? "") as any,
  full_name: String(row[2] ?? ""),
  phone: String(row[3] ?? ""),
  email: String(row[4] ?? ""),
  status: String(row[5] ?? "pending") as any,
  feedback: String(row[6] ?? ""),
  updated: JSON.parse(String(row[7] ?? "[]")),
});
```

---

### ✍️ 5. APPLICANT UPDATE LOGIC

When saving/updating:

```ts
const existing = JSON.parse(applicant.updated || "[]") as string[];
const next = JSON.stringify([...existing, new Date().toISOString()]);
```

---

## 🔌 API ROUTES

### `GET /api/applicants`

- Extract IP → rate limit check
- Check cache key `"applicants"`
- If cached, return
- Fetch from Sheets
- Parse all rows via `mapRow()`
- Cache 5 min
- Return `{ applicants: Applicant[] }`

### `POST /api/applicants`

- Rate limit check
- Validate body: `Omit<Applicant, 'id' | 'created_time' | 'updated'>`
  - `full_name`: required
  - `phone`: required, `/^\d{10}$/`
  - `email`: required, valid email regex
  - `position`: required, valid Role
  - `feedback`: optional, max 300 chars
  - `status`: optional (default `'pending'`)
- Append row with:
  - `created_time = new Date().toISOString()`
  - `updated = JSON.stringify([created_time])`
- Clear cache
- Return created `Applicant`

### `PUT /api/applicants/[id]`

- Rate limit check
- Validate body: `Partial<Applicant>` (any fields except `id`, `created_time`)
- Read existing row
- Parse `updated[]` → append now → re-stringify
- Update Sheets row
- Clear cache
- Return updated `Applicant`

### `GET /api/analytics`

- Rate limit check
- Check cache key `"analytics"`
- If cached, return
- Fetch all applicants
- Group by `updated[updated.length - 1]` (last date)
- Count per status per date
- Return `{ analytics: AnalyticsDataPoint[] }`
- Also return role breakdowns: `{ roleData: RoleBarData[] }`

---

## 🧪 TYPES (Complete)

```ts
// src/types/index.ts

export type ApplicantStatus =
  | "pending"
  | "rejected"
  | "interested"
  | "inprocess";
export type Department = "sales" | "service";

export type SalesRole =
  | "Sales"
  | "Sales Manager"
  | "Institutional Sales Manager"
  | "Network Manager"
  | "Sales Executive"
  | "Delivery Executive";

export type ServiceRole =
  | "Service Manager"
  | "Service Advisor"
  | "Spare Parts Supervisor"
  | "Technician"
  | "Cashier"
  | "Billing Executive";

export type Role = SalesRole | ServiceRole;

export interface Applicant {
  id: string;
  created_time: string;
  position: Role;
  full_name: string;
  phone: string;
  email: string;
  status: ApplicantStatus;
  feedback: string;
  updated: string[]; // ISO dates, append-only
}

export interface AnalyticsDataPoint {
  date: string; // "DD MMM"
  pending: number;
  interested: number;
  inprocess: number;
  rejected: number;
}

export interface RoleBarData {
  role: string;
  pending: number;
  interested: number;
  inprocess: number;
  rejected: number;
}

export interface StatsData {
  pending: number;
  interested: number;
  inprocess: number;
  rejected: number;
}

export interface DateRange {
  from: Date | undefined;
  to: Date | undefined;
}
```

---

## 🎨 STYLING RULES (STRICT)

**✅ DO:**

- Use **Tailwind utility classes only** (e.g., `bg-red-600`, `text-lg`, `rounded-md`)
- Use **shadcn default styles** (components have built-in Tailwind)
- Use Tailwind colors: `red-600`, `blue-500`, `gray-100`, etc.

**❌ DO NOT:**

- Create `tokens.css` or any custom CSS file
- Use inline `style={{}}` attributes
- Add external stylesheets
- Hardcode hex colors
- Create CSS modules

Example:

```tsx
<div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-gray-50 p-4 shadow-sm">
  <span className="text-sm font-semibold text-gray-700">Applicants</span>
  <span className="text-2xl font-bold text-blue-600">42</span>
</div>
```

---

## 🔐 AUTH SYSTEM

### Login Flow

`src/app/login/page.tsx` — shadcn Card with password Input. On submit:

1. Hash (or direct compare) password
2. Set cookie `dashboard_auth=<password>` (httpOnly, secure in prod)
3. Redirect to `/`

### Middleware Protection

`src/proxy.ts` (Next.js 16.2):

```ts
import { NextRequest, NextResponse } from "next/server";

export function proxy(req: NextRequest) {
  const auth = req.cookies.get("dashboard_auth")?.value;

  if (auth !== process.env.DASHBOARD_PASSWORD) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!login|_next|favicon).*)"],
};
```

---

## 🔄 SMOOTH SCROLL + RESTORATION

### Lenis Setup

```ts
// src/lib/lenis.ts
import Lenis from "@studio-freight/lenis";

let lenis: Lenis | null = null;

export const getLenis = (): Lenis => {
  if (!lenis) {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true,
    });

    function raf(time: number) {
      lenis!.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }
  return lenis;
};

export const scrollToPosition = (y: number) => {
  getLenis().scrollTo(y, { immediate: false, duration: 0.8 });
};
```

### Root Layout

```tsx
// src/app/layout.tsx
"use client";

import { useEffect } from "react";
import { getLenis } from "@/lib/lenis";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    getLenis();
  }, []);

  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### **Scroll Preservation on Save (CRITICAL)**

```tsx
// Inside ApplicantCard.tsx
const [isPending, startTransition] = useTransition();

const handleSave = () => {
  const savedScrollY = window.scrollY; // Capture BEFORE async

  startTransition(async () => {
    await fetch(`/api/applicants/${applicant.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    scrollToPosition(savedScrollY); // Restore AFTER — never top
  });
};
```

---

## ⚛️ FRONTEND ARCHITECTURE

### Hook: `useApplicants`

```tsx
// src/hooks/useApplicants.ts
"use client";

import { useTransition, useState } from "react";
import type { Applicant } from "@/types";

export const useApplicants = () => {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [isPending, startTransition] = useTransition();

  const fetchApplicants = () => {
    startTransition(async () => {
      const res = await fetch("/api/applicants");
      const data = await res.json();
      setApplicants(data.applicants);
    });
  };

  const saveApplicant = (id: string, data: Partial<Applicant>) => {
    startTransition(async () => {
      await fetch(`/api/applicants/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      await fetchApplicants(); // Refresh after save
    });
  };

  return {
    applicants,
    setApplicants,
    isPending,
    fetchApplicants,
    saveApplicant,
  };
};
```

### useTransition Rules

- **ALWAYS use `useTransition`** for any async action
- **NEVER use `useState` for loading booleans**
- `isPending` drives all disabled/loading states
- Example:

```tsx
const [isPending, startTransition] = useTransition();

const handleSubmit = () => {
  startTransition(async () => {
    await fetch("/api/applicants", {
      method: "POST",
      body: JSON.stringify(data),
    });
  });
};

<button disabled={isPending}>Save</button>;
```

---

## 📁 FILE STRUCTURE

```
src/
├── app/
│   ├── layout.tsx                 # Lenis init + root styles
│   ├── page.tsx                   # Dashboard
│   ├── login/
│   │   └── page.tsx               # Password gate
│   └── api/
│       ├── applicants/
│       │   ├── route.ts           # GET, POST
│       │   └── [id]/route.ts      # PUT
│       └── analytics/
│           └── route.ts           # GET
├── components/
│   ├── dashboard/
│   │   ├── Header.tsx
│   │   ├── StatsRow.tsx
│   │   ├── AnalyticsSection.tsx
│   │   ├── DepartmentTabs.tsx
│   │   ├── FilterBar.tsx
│   │   └── ApplicantCard.tsx
│   └── ui/                        # shadcn auto-generated
├── hooks/
│   └── useApplicants.ts
├── lib/
│   ├── sheets.ts                  # Google Sheets client
│   ├── lenis.ts                   # Smooth scroll
│   ├── cache.ts                   # 5-min cache
│   ├── rateLimit.ts               # 60 req/min per IP
│   ├── mapRow.ts                  # Row → Applicant
│   ├── roles.ts                   # Role lists
│   └── utils.ts                   # Helpers
├── types/
│   └── index.ts                   # All types
└── proxy.ts                       # Auth middleware
```

---

## 🎯 COMPONENTS

### **ApplicantCard.tsx**

shadcn Card with:

- **Name:** shadcn Input (truncate 20 chars in header; full on hover Popover)
- **Role:** shadcn Select (Sales/Service roles)
- **Phone:** shadcn Input (validate `/^\d{10}$/`, render as `<a href="tel:">`)
- **Email:** shadcn Input (validate email, render as `<a href="mailto:">`)
- **Date:** read-only text (created_time)
- **Feedback:** shadcn Textarea (max 300 chars, live counter)
- **Status Badge:** top-right, color from Tailwind (e.g., `bg-red-100 text-red-800`)
- **Status Buttons:** Radio group (Interested / In Process / Reject) — **exactly ONE active**
  - Active = filled variant
  - Inactive = outline variant
  - All disabled while `isPending`
- **Last Updated:** text + Badge "Updated N×"
- **Save Button:** "Save to Google Sheet" — triggers PUT, appends date to `updated[]`

### **Header.tsx**

- Honda logo + "TANSI MOTORS" + "HIRING DASHBOARD"
- shadcn Input with search icon (filters by name, role, phone, email)
- Clock showing "UPDATED HH:MM AM/PM"
- Refresh icon button (top-right)

### **StatsRow.tsx**

4 shadcn Cards:

- **New Applications** (pending count) — Tailwind `border-b-4 border-blue-500`
- **Interested** (interested count) — Tailwind `border-b-4 border-green-500`
- **Rejected** (rejected count) — Tailwind `border-b-4 border-red-500`
- **In Process** (inprocess count) — Tailwind `border-b-4 border-yellow-500`

Each: large bold number + colored bottom border via Tailwind utility.

### **AnalyticsSection.tsx**

- **Area Chart:** dates from `updated[]`, grouped by day; lines for each status
  - Toggle: Line ↔ Bar
  - Select: "ALL LINES" / individual status
  - DateRangePicker (default 30 days)
  - CSV download button
- **Bar Chart:** roles on X, counts on Y; grouped bars by status

### **DepartmentTabs.tsx**

Main tabs: `[Sales] [Service]`

Sub-status tabs: `[All] [Pending] [Interested] [In Process] [Rejected]`

### **FilterBar.tsx**

**Sales:**

- Role select (All / Sales / Sales Manager / etc.)
- DateRangePicker
- Sort dropdown
- Search

**Service:**

- Role select (All / Service Manager / etc.)
- DateRangePicker
- Sort dropdown
- Search

**Behavior:** All filters combine with AND logic. Reset when switching departments.

---

## ⚡ NEXT.JS 16.2 BREAKING CHANGES

**STRICT RULES:**

1. **Async params ALWAYS:**

   ```ts
   // ✅ Correct
   export default async function Page(props) {
     const { slug } = await props.params;
   }

   // ❌ CRASH
   export default function Page({ params }) {
     const { slug } = params;
   }
   ```

2. **No Pages Router** — App Router only
3. **No getServerSideProps / getStaticProps** — use Route Handlers
4. **Turbopack is default** — no `--turbopack` flag
5. **Route Handlers only:**
   ```ts
   export async function GET(req: NextRequest) { ... }
   export async function POST(req: NextRequest) { ... }
   export async function PUT(req: NextRequest) { ... }
   ```

---

## 🚫 FORBIDDEN

- ❌ `tokens.css` or custom CSS
- ❌ MCP / Stitch
- ❌ Manual loading states with `useState`
- ❌ Pages Router
- ❌ `getServerSideProps` / `getStaticProps`
- ❌ Hardcoded colors (use Tailwind)
- ❌ TODOs, stubs, or partial code

---

## ✅ VALIDATION RULES

| Field          | Rule                                    |
| -------------- | --------------------------------------- |
| `full_name`    | Required, non-empty                     |
| `phone`        | Required, `/^\d{10}$/`                  |
| `email`        | Required, valid email                   |
| `feedback`     | Optional, max 300 chars                 |
| `status`       | Always `ApplicantStatus` union          |
| `position`     | Always `Role` union                     |
| Status buttons | Exactly ONE active at a time            |
| `updated[]`    | Append-only, parse → append → stringify |

---

## 🔥 HARD RULES (NEVER BREAK)

1. **Every file fully implemented** — no TODOs, no stubs, no placeholders
2. **TypeScript strict** — no `any`, all types explicit
3. **Status is union type** — never plain string
4. **All async via `useTransition`** — zero raw `useState` loading
5. **Scroll preserved on save** — capture before, restore after
6. **Status buttons are radio group** — exactly one at a time
7. **`updated[]` is append-only** — always parse, append, re-stringify
8. **Every UI element is shadcn** — no custom HTML wrappers
9. **All colors via Tailwind** — zero hardcoded hex
10. **Rate limit: 60 req/min per IP** — apply to all API routes
11. **Cache: 5 min TTL** — check before Sheets call
12. **Read Next.js 16.2 docs** — follow ALL breaking changes strictly

---

## 📦 INSTALL & BUILD

```bash
npx create-next-app@latest tansi-hiring \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd tansi-hiring

# shadcn setup
npx shadcn@latest init

# All components
npx shadcn@latest add card tabs popover badge button input textarea select dialog date-picker calendar separator skeleton chart

# Dependencies
npm install @studio-freight/lenis googleapis
npm install -D @types/node
```

---

## 🎯 DELIVERABLES

The generated project MUST be:

✅ Fully working (zero manual fixes)  
✅ Zero TODOs or stubs  
✅ Fully typed (no `any`)  
✅ Clean architecture  
✅ Production-ready  
✅ Minimal and efficient  
✅ Every file complete before next

---

**If any conflict occurs: Follow Next.js 16.2 rules FIRST, then this spec.**
