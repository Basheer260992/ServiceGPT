# ServiceGPT Enterprise Portal

A modern, ServiceNow-style enterprise service portal built with **React + TypeScript + Vite** on the frontend and **Node.js + Express** on the backend.

## Features

- Login / Register with JWT auth and role-based access (`admin`, `support`, `employee`)
- Incident, Problem, and Change Request management with full CRUD
- Live operations dashboard with counters, charts, SLA progress, recent tickets
- Service Catalog with one-click request submission
- Knowledge Base with search
- Admin dashboard (users, system health)
- User profile management
- Analytics dashboard with Recharts
- Notifications panel with unread badge and "mark all read"
- AI assistant chat panel (rules-based, easily swapped for an LLM)
- Dark / light mode toggle
- Sidebar + responsive top navbar
- Toast notifications on every create
- Real-time-ish updates via 15s polling
- Search, filter, pagination on every ticket list
- File attachments (stored as base64 data URLs)
- JSON file persistence by default (no database required); Mongoose models included for optional MongoDB

## Stack

| Layer | Tech |
|------|------|
| Frontend | React 18, TypeScript, Vite, React Router, Zustand, Axios, Tailwind CSS, Recharts, Lucide React, react-hot-toast |
| Backend | Node.js, Express, lowdb (JSON), Mongoose (optional), JWT, bcryptjs, Morgan, CORS |

## File structure

```
servicegpt-portal/
├── backend/
│   ├── server.js
│   ├── package.json
│   ├── .env
│   └── src/
│       ├── config/storage.js
│       ├── controllers/
│       │   ├── auth.controller.js
│       │   ├── stats.controller.js
│       │   └── ticket.controller.js
│       ├── middleware/
│       │   ├── auth.js
│       │   └── error.js
│       ├── models/                 (Mongoose - optional)
│       │   ├── Incident.js
│       │   ├── Problem.js
│       │   ├── Change.js
│       │   └── User.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── incident.routes.js
│       │   ├── problem.routes.js
│       │   ├── change.routes.js
│       │   ├── catalog.routes.js
│       │   ├── knowledge.routes.js
│       │   ├── stats.routes.js
│       │   ├── notification.routes.js
│       │   ├── chat.routes.js
│       │   └── user.routes.js
│       ├── utils/seed.js
│       └── data/db.json            (created at first run)
└── frontend/
    ├── index.html
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.js
    ├── postcss.config.js
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── api/client.ts
        ├── services/
        │   ├── auth.service.ts
        │   ├── ticket.service.ts
        │   └── misc.service.ts
        ├── store/
        │   ├── auth.store.ts
        │   ├── ui.store.ts
        │   └── ticket.store.ts
        ├── hooks/
        │   ├── useDebounce.ts
        │   └── useAutoRefresh.ts
        ├── components/
        │   ├── Sidebar.tsx
        │   ├── Topbar.tsx
        │   ├── ChatPanel.tsx
        │   ├── StatCard.tsx
        │   ├── TicketTable.tsx
        │   ├── TicketForm.tsx
        │   ├── Modal.tsx
        │   ├── Badge.tsx
        │   ├── PageHeader.tsx
        │   ├── Pagination.tsx
        │   └── Logo.tsx
        ├── layouts/
        │   ├── AppLayout.tsx
        │   └── AuthLayout.tsx
        ├── pages/
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── Dashboard.tsx
        │   ├── Incidents.tsx
        │   ├── Problems.tsx
        │   ├── Changes.tsx
        │   ├── TicketList.tsx
        │   ├── TicketDetail.tsx
        │   ├── Catalog.tsx
        │   ├── Knowledge.tsx
        │   ├── Admin.tsx
        │   ├── Profile.tsx
        │   ├── Analytics.tsx
        │   └── NotFound.tsx
        └── types/index.ts
```

## Setup & run

```powershell
# 1. Install all dependencies
npm install
npm run install:all

# 2. Copy and configure environment
copy backend\.env.example backend\.env
# Edit backend\.env — at minimum set JWT_SECRET and ServiceNow passwords

# 3. Start both servers (backend :5000, frontend :5173)
npm run dev
```

Then open **http://localhost:5173**.

The Vite dev server proxies `/api/*` to `http://localhost:5000`, so the frontend
calls a single origin in development and there are no CORS surprises.

## Demo accounts

| Role     | Email                     | Password    |
|----------|---------------------------|-------------|
| Admin    | admin@servicegpt.io       | admin123    |
| Support  | sameera@servicegpt.io     | support123  |
| Employee | anita@servicegpt.io       | user123     |

## ServiceNow instances

| # | Name | URL | Username | Password |
|---|---|---|---|---|
| 1 | CRISP - Security Incident | https://dev347798.service-now.com | admin | uu=EqW8-TbR3 |
| 2 | NATAMA/CAPTURE - NBN Incident | https://dev379111.service-now.com | admin | qX=q5oYRfO@6 |
| 3 | MyServices - Request Item | https://dev388985.service-now.com | admin | /TYhCxmY9m+9 |
| 4 | AskUs - HR Request | https://dev393269.service-now.com | admin | rg4gjFQ-GC5$ |
| 5 | ITAM Request - Internal incident | https://dev347798.service-now.com | admin | uu=EqW8-TbR3 |

> Note: Instance 2 (dev379111) may fail on writes — the PDI appears to be in a hibernated state.

## REST API

All routes require `Authorization: Bearer <token>` except `/api/auth/login` and `/api/auth/register`.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login, returns `{ token, user }` |
| POST | `/api/auth/register` | Create account |
| GET  | `/api/auth/me` | Current user |
| GET  | `/api/incidents` | List incidents (supports `?search`, `?priority`, `?state`, `?page`, `?limit`) |
| POST | `/api/incidents` | Create incident |
| GET  | `/api/incidents/:id` | Get one (by id or number) |
| PUT  | `/api/incidents/:id` | Update |
| DELETE | `/api/incidents/:id` | Delete |
| GET / POST / PUT / DELETE | `/api/problems` | Same shape as incidents |
| GET / POST / PUT / DELETE | `/api/changes` | Same shape as incidents |
| GET | `/api/catalog` | List service catalog items |
| GET | `/api/knowledge` | List/search knowledge articles |
| GET | `/api/stats/summary` | Dashboard counters & charts |
| GET | `/api/notifications` | List notifications |
| POST | `/api/notifications/:id/read` | Mark single read |
| POST | `/api/notifications/read-all` | Mark all read |
| GET / POST | `/api/chat` | AI assistant history / send |
| GET | `/api/users` | List users (admin only) |
| PUT | `/api/users/me` | Update own profile |

## Storage options

Default is **JSON file** at `backend/src/data/db.json` — no database needed.
To switch to MongoDB:

1. Install and run MongoDB locally.
2. Set `STORAGE=mongo` in `backend/.env` (or leave it — the JSON adapter is already wired and self-contained; Mongoose models are kept in `src/models/` for reference and easy swap).

## Workflow guarantees

- Submit on any ticket form → POST hits backend → new ticket persisted in `db.json` → store prepends the ticket to the list → dashboard counters refresh → toast confirms success.
- Dashboard auto-refreshes every 15 seconds.
- All forms validate `Short Description` and `Requested By` client-side, and the backend re-validates required fields.

## ServiceNow integration

The backend can read & write directly against a ServiceNow instance (PDI or enterprise) via the **Table REST API**. The frontend doesn't change — endpoints stay the same, only the data source flips.

### Files

| File | Purpose |
|------|---------|
| [backend/src/integrations/servicenow.js](backend/src/integrations/servicenow.js) | REST client, Basic Auth, bidirectional field mapping (sys_id, numeric state/priority/impact ↔ portal text values) |
| [backend/src/controllers/ticket.controller.js](backend/src/controllers/ticket.controller.js) | Switches between local JSON and ServiceNow based on `DATA_SOURCE` env |
| [backend/src/controllers/stats.controller.js](backend/src/controllers/stats.controller.js) | Aggregates dashboard stats from whichever source is active |
| [backend/src/routes/servicenow.routes.js](backend/src/routes/servicenow.routes.js) | `/api/servicenow/status` (connection check), `/api/servicenow/sync` (admin import) |

### Field mapping

| ServiceNow | Portal | Notes |
|-----------|--------|-------|
| `sys_id` | `id` | 32-char hex |
| `number` | `number` | INC/PRB/CHG |
| `short_description` / `description` | `shortDescription` / `description` | |
| `priority` 1–5 | `Critical` / `High` / `Moderate` / `Low` | |
| `state` (numeric) | `New` / `In Progress` / `On Hold` / `Resolved` / `Closed` (incidents); per-table state map for problems & changes | |
| `impact` / `urgency` 1–3 | `High` / `Medium` / `Low` | |
| `caller_id`, `assigned_to`, `assignment_group` | `requestedBy`, `assignedTo`, `assignmentGroup` | Uses ServiceNow's display values via `sysparm_display_value=true` |
| `sys_created_on` / `sys_updated_on` | ISO `createdAt` / `updatedAt` | |
| `start_date` / `end_date` / `risk` | `plannedStart` / `plannedEnd` / `riskLevel` | Change requests only |

Writes (POST/PATCH) reverse-map portal values back to ServiceNow numeric codes.

### Activation

1. In [backend/.env](backend/.env) set:
   ```
   DATA_SOURCE=servicenow
   SERVICENOW_USERNAME=admin
   SERVICENOW_PASSWORD=<default password if needed>
   SERVICENOW_URL=https://dev386084.service-now.com

   # Optional: instance-specific credentials for configured instances
   SERVICENOW_PASSWORD_inst-1=<password for ITAM Request / default instance>
   SERVICENOW_URL_inst-1=https://dev386084.service-now.com
   SERVICENOW_PASSWORD_inst-2=<password for CRISP - Security Incident>
   SERVICENOW_URL_inst-2=https://dev352459.service-now.com
   SERVICENOW_PASSWORD_inst-3=<password for NATAMA/CAPTURE - NBN Incident>
   SERVICENOW_URL_inst-3=https://dev208811.service-now.com
   SERVICENOW_PASSWORD_inst-4=<password for MyServices - Request Item>
   SERVICENOW_URL_inst-4=https://dev305710.service-now.com
   SERVICENOW_PASSWORD_inst-5=<password for AskUs - HR Request>
   SERVICENOW_URL_inst-5=https://dev392710.service-now.com
   ```
2. Restart the backend.
3. Sign in to the portal, then verify:
   ```powershell
   $body = @{ email = 'admin@servicegpt.io'; password = 'admin123' } | ConvertTo-Json
   $t = (Invoke-RestMethod http://localhost:5000/api/auth/login -Method POST -Body $body -ContentType 'application/json').token
   Invoke-RestMethod http://localhost:5000/api/servicenow/status -Headers @{ Authorization = "Bearer $t" }
   ```
   Expected: `{"enabled":true, "configured":true, "ok":true, "instance":"dev386084"}`

### One-shot sync (admin only)

If you want to copy ServiceNow data into local JSON (for offline demos or when the PDI hibernates):

```powershell
Invoke-RestMethod http://localhost:5000/api/servicenow/sync -Method POST -Headers @{ Authorization = "Bearer $t" }
```

Then flip `DATA_SOURCE=json` and restart — you'll keep working with the synced data.

### Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `401 User is not authenticated` | Password rejected by ServiceNow | Reset on developer.servicenow.com → Manage → Reset Password |
| Browser login loops back to login page | PDI is half-hibernated | Click **Wake Up Instance** on developer.servicenow.com and wait ~60s |
| `502 ETIMEDOUT` | PDI fully hibernated or instance moved | Wake up; if "instance not found", create a new PDI |
| Empty incident list | Filter mismatch on state | Check `sysparm_query` in [servicenow.js](backend/src/integrations/servicenow.js) — your PDI may use custom state values |

---

## Production build

```powershell
cd frontend
npm run build       # outputs to frontend/dist
```

Serve `frontend/dist` behind nginx and run `node server.js` for the API.
