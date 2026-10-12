# Taskly — Smart Task Management System

A personal task workspace built with MongoDB, Express, React, and Node.js for the StartupMeu Software Engineer Intern assessment. Registration, authentication, task operations, and dashboard statistics.

## Features

- Registration, login, logout, protected navigation, and a read-only profile.
- Create, inspect, edit, delete with confirmation, and change task status.
- Ten categories, three priorities, descriptions, calendar due dates, and timestamps.
- Literal text search across title/description; combined filters; creation/due-date sorting; pagination.
- Database-derived dashboard totals, completion chart, overdue counts, category and priority summaries, recent tasks, and chronological deadlines.
- Today and Upcoming views; overdue and approaching-deadline indicators.
- Responsive sidebar, mobile task cards, accessible form labels, native modal focus trapping, notifications, and loading/error/empty states.

## Stack and architecture

Frontend: React 19, Vite, React Router, Tailwind CSS 4, Axios, Lucide, Recharts. Backend: Node.js, Express 5, Mongoose, JWT, bcryptjs, Zod, Helmet, CORS, and express-rate-limit. Testing: Vitest, React Testing Library, Supertest, and mongodb-memory-server.

```text
React views → central Axios client → Express routes → auth/validation → controllers → Mongoose → MongoDB
```

Development uses Vite's `/api` proxy. Production Express serves the built React app and API from the same origin. Sessions are HttpOnly cookies, never browser localStorage. All mutations require the correct origin header.

```text
smart-task-manager/
├── frontend/
│   ├── public/                 # Favicon
│   ├── src/
│   │   ├── components/         # Task list, forms, dialogs, shared states
│   │   ├── context/            # Session and notifications
│   │   ├── hooks/              # API resource loading
│   │   ├── layouts/            # Responsive application shell
│   │   ├── pages/              # Auth, dashboard, tasks, profile, 404
│   │   ├── services/           # Axios configuration
│   │   ├── utils/              # Calendar rules and task values
│   │   └── test/               # Component and interaction tests
│   └── .env.example
├── backend/
│   ├── config/                 # Environment and MongoDB connection
│   ├── controllers/            # Authentication, tasks, dashboard
│   ├── middleware/             # Authentication and errors
│   ├── models/                 # User and Task schemas/indexes
│   ├── routes/
│   ├── utils/                  # Validation and errors
│   ├── tests/                  # MongoDB-backed API tests
│   ├── app.js                  # App factory, independently testable
│   ├── server.js               # Production startup/shutdown
│   └── .env.example
├── scripts/                    # Local development helper
├── DEVELOPMENT.md             # Factual development record
└── package.json               # npm workspaces
```

## Prerequisites and installation

Use Node.js 20.19+ or 22.12+ and npm. A MongoDB Atlas database or local MongoDB is required for ordinary development. The optional local launcher can start a separate real MongoDB process.

From this directory:

```sh
npm install
```

If MongoDB's optional binary postinstall stalls, use `npm install --ignore-scripts`, then supply an existing MongoDB executable as described below. The ordinary application never needs mongodb-memory-server directly; the backend tests provide it.

## MongoDB Atlas and environment setup

1. Create an Atlas cluster and a database user with read/write access limited to the application database. The database user differs from your Atlas website account.
2. Add your development machine's current IP to Atlas Network Access. For deployment, allow the application server's outbound IP.
3. Copy the Node.js driver connection string. Replace its username, URL-encoded password, and database name. Keep it out of Git and frontend variables.
4. Copy `backend/.env.example` to `backend/.env` and fill in the values below.

```dotenv
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://DATABASE_USER:URL_ENCODED_PASSWORD@YOUR_CLUSTER/smart-task-manager
JWT_SECRET=YOUR_RANDOM_SECRET_AT_LEAST_32_CHARACTERS
CLIENT_ORIGIN=http://127.0.0.1:5173
TRUST_PROXY=0
```

Generate your own secret with `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`. Paste it only into the local backend environment or your deployment secret manager.

The frontend defaults to `/api`. Only copy `frontend/.env.example` to `frontend/.env` if you need to change `VITE_API_URL`. Never put credentials or JWT secrets in a `VITE_` variable; those values leak into the browser bundle.

## Development

```sh
npm run dev
```

Open **http://127.0.0.1:5173**. Use that exact host rather than `localhost`, because origin checks deliberately require an exact match. Backend: http://127.0.0.1:5000/api/health. Start either workload independently or together in the same terminal.

Registration starts an authenticated session. A new account has an empty workspace; add your own tasks.

### Optional local mode without Atlas

```sh
npm run dev:local
```

This starts Vite, Express, and an isolated real MongoDB process. Data is persisted in the Git-ignored `artifacts/local-mongodb` directory across launches. A temporary session signing secret is generated if none exists.

The helper first checks standard Windows MongoDB installations, then downloads a binary if none is configured or cached. To explicitly select an installation, set these environment variables in PowerShell:

```powershell
$env:MONGOMS_SYSTEM_BINARY = 'C:\Program Files\MongoDB\Server\8.0\bin\mongod.exe'
$env:MONGOMS_SYSTEM_BINARY_VERSION_CHECK = 'false'
npm run dev:local
```

Linux/macOS can use `MONGOMS_SYSTEM_BINARY=/path/to/mongod MONGOMS_SYSTEM_BINARY_VERSION_CHECK=false npm run dev:local`. Disabling the helper's version comparison only permits your installed MongoDB version; update the script if incompatible.

## API reference

Successful JSON responses use `{ "data": ... }`; failures use `{ "error": { "message": "...", "fields": [...] } }`, where `fields` is included for validation errors. Deletion and logout return 204 No Content.

| Method | Endpoint                | Purpose                                         |
| ------ | ----------------------- | ----------------------------------------------- |
| POST   | `/api/auth/register`    | `{name,email,password}`; create account/session |
| POST   | `/api/auth/login`       | `{email,password}`; start session               |
| POST   | `/api/auth/logout`      | Clear session cookie                            |
| GET    | `/api/auth/me`          | Current public user profile                     |
| GET    | `/api/tasks`            | Filtered, sorted, paginated owned tasks         |
| GET    | `/api/tasks/:id`        | Task details                                    |
| POST   | `/api/tasks`            | Create a task                                   |
| PUT    | `/api/tasks/:id`        | Replace editable task fields                    |
| PATCH  | `/api/tasks/:id/status` | `{status}` only                                 |
| DELETE | `/api/tasks/:id`        | Delete an owned task                            |
| GET    | `/api/dashboard/stats`  | Real MongoDB aggregates and task previews       |
| GET    | `/api/health`           | API/database readiness (503 when disconnected)  |

Task payload:

```json
{
  "title": "Prepare assessment",
  "description": "Review the project and documentation",
  "category": "Internships",
  "priority": "High",
  "status": "To Do",
  "dueDate": "2026-10-10"
}
```

Task list parameters: `search`, `status`, `priority`, `category`, `sort` (`dueDate`, `-dueDate`, `createdAt`, `-createdAt`), `view` (`all`, `today`, `upcoming`, `overdue`), `today=YYYY-MM-DD`, `page` (1-indexed), `limit` (1–50, default 10).

Due dates are validated calendar dates stored at UTC midnight, not deadline times. The frontend sends the browser's local calendar date for Today/overdue calculations and renders date-only values.

CLI/Postman clients must preserve cookies and include `Origin: http://127.0.0.1:5173` on write requests. Do not submit a user ID; the server assigns ownership.

## Testing and builds

```sh
npm run test -w backend
npm run test -w frontend
npm test
npm run lint
npm run build
npm audit
```

With the local servers running, `npm run smoke` additionally checks real HTTP requests through Vite's proxy: registration, session cookies, persisted CRUD, search, dashboard updates, and logout.

Backend tests create their own disposable MongoDB database and never read `MONGODB_URI`. They test authentication, unique emails, password hashing, cookies, rejected origins, CRUD persistence, creation/due-date ordering, pagination, and dashboard aggregates.

Frontend tests exercise registration validation, login errors, password visibility, task form submission and failed-save behavior, delete confirmation, task details/status controls, and deadline indicators.

See [smart-task-manager/VALIDATION.md](smart-task-manager/VALIDATION.md) for actual executed results and outstanding manual checks.

### Production startup

Run `npm run build`, set `NODE_ENV=production`, configure `CLIENT_ORIGIN` to the exact HTTPS origin, and run `npm start`. Express serves `frontend/dist` and supports React Router deep links. Terminate with SIGTERM or CTRL+C for graceful shutdown.

For a separate frontend host, keep API and frontend same-site and update `VITE_API_URL` and `CLIENT_ORIGIN`. The current Strict cookie design deliberately does not support unrelated cross-site deployments.

## Screenshots

No fabricated screenshots are included. Browser capture was attempted but the browser connector was unavailable. After starting the application, capture the overview, all-tasks page, create-task modal, task details, delete confirmation, and dashboard.

## Known limitations

- Atlas deployment requires your connection string and network configuration; local MongoDB tests do not prove Atlas connectivity.
- No password reset, email verification, task sharing, attachments, recurring tasks, or push/email reminders are included.
- Logout clears this browser's JWT cookie. There is no server-side token revocation list; a copied token remains valid until its eight-hour expiry.
- Rate limits use process memory. Multi-instance deployment should use a shared limiter store.
- Search uses an escaped regular expression scoped to a user; very large datasets would benefit from a dedicated search index.
- The profile is display-only. Deleting a task is permanent.

## Code0 usage confirmation

**Code0 was not used.** No Code0 terminal or connector was available. The user explicitly instructed the developer to continue with Codex. No Code0 suggestions, actions, commits, or reviews are claimed.

## AI Development Experience

The following are truthful examples of **Codex**, not Code0, assistance:

1. **Architecture and security:** generated separate npm workspaces, a testable Express app factory, and HttpOnly-cookie authentication. Chose exact-origin validation for write requests; API tests verify rejected CORS origins.
2. **Calendar behavior:** implemented validated date-only inputs and UTC-midnight storage, with the local calendar date supplied by the UI. Added tests for impossible dates, Today, upcoming ordering, and boundary cases.
3. **React integration:** built reusable task forms, native dialogs, session context, and cancellable Axios resource loading. Component tests verify failed saves keep the form open and success closes the dialog.
4. **Testing/debugging:** the first React run timed out on this machine and leaked unfinished simulated typing into a later test. Increased the runner's timeout without removing assertions; all subsequent runs pass consistently.
5. **Build review:** the production build reported a large initial chart bundle. Changed the dashboard to load lazily so chart code is deferred from authentication pages. Reviewed npm audit findings and confirmed no exploitable vulnerabilities.

These edits were performed by the coding agent through file patches and terminal commands. No separate human code edits or external AI review are claimed. The detailed record is in [smart-task-manager/DEVELOPMENT.md](smart-task-manager/DEVELOPMENT.md).

## GitHub preparation

The repository ignore rules exclude `.env` files, dependencies, builds, test coverage, local MongoDB data, and logs; `.env.example` files are intentionally included. Review `git status`, run the commands above, and verify that only tracked source files appear.
