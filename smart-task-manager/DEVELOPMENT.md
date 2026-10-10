# Development record

## Plan

1. Inspect workspace, scaffold npm workspaces, install dependencies.
2. Express foundation, environment validation, MongoDB connection, centralized errors.
3. Registration, login, HttpOnly JWT session, origin protection, authentication middleware.
4. Owned task CRUD, strict validation, indexes, search and filters.
5. Responsive React shell, authentication, reusable accessible components.
6. Axios integration, forms, task detail/edit/delete, state refresh.
7. Real database dashboard statistics, category/priority summaries, Today and deadlines.
8. MongoDB-backed API tests, React interaction tests, lint, build, browser checks.
9. Setup documentation, repository hygiene, assessment preparation.

## Tool provenance

Development performed with Codex. No Code0 executable or connector was available at initial inspection; the user explicitly approved continuing with Codex. No Code0 activity, suggestions, reviews, or terminal operations are claimed. No remote push is authorized.

## Architecture decisions

- Separate frontend/backend npm workspaces; Vite proxies `/api` locally. Production serves the frontend from Express for a same-origin deployment.
- JWT in an HttpOnly cookie; write requests require an exact trusted Origin (including login) to prevent cross-site request forgery. Production requires HTTPS and uses Secure cookies. No browser localStorage token.
- Due dates are calendar dates encoded at UTC midnight. Queries and UI use the user's local calendar date, avoiding midnight timezone shifts. The API validates real calendar dates.
- Tests use an isolated ephemeral real MongoDB process, never an in-memory task mock or an Atlas production database.

## Phase record

1. **Workspace/architecture:** inspected the empty repository, checked Node/npm, created npm workspaces and configuration, installed dependencies. MongoDB's optional binary download stalled; the available installed binary was used instead. Dependencies were locked in package-lock.json.
2. **Backend foundation:** added environment validation, connection handling, Express security middleware, health readiness, and centralized errors. Syntax checks passed; subsequent API and live health checks verified runtime behavior.
3. **Authentication:** created the User schema, registration/login/logout/profile controllers and routes, bcrypt hashing, JWT cookies, origin checks, and protection middleware. Syntax checks passed, then authentication/security cases passed in the MongoDB-backed suite.
4. **Task backend:** added indexed Task schema, owned CRUD/status routes, validation, escaped search, pagination, and filters. Syntax checks and API tests passed, including foreign-owner attempts and MongoDB persistence checks.
5. **React frontend:** created navigation, auth/profile/404 pages, session and notification contexts, shared loading/error/empty components, and native modal dialogs. JSX compiled in the production build and forms were exercised by React Testing Library.
6. **Integration:** connected task forms, lists, details, editing, deletion, and status changes to Axios/Express. Live HTTP smoke tests through Vite's API proxy passed.
7. **Smart features:** implemented database dashboard aggregates, Recharts completion distribution, category and priority summaries, Today/upcoming views, and calendar-based deadline indicators. API and date-rule tests passed.
8. **Validation:** final results: 14 backend tests and 8 frontend tests passed, ESLint passed, and the production build passed. Upgraded Vitest after audit findings; npm reported zero vulnerabilities. Increased slow-environment test/startup timeouts without removing assertions. Added a regression test for stale session-error recovery. Browser/visual checks remain blocked by unavailable browser/native UI tools.
9. **Documentation/preparation:** wrote setup/API/Atlas/production/testing documentation and this factual record; checked ignore rules for secrets and generated files. The user approved Codex as the tool substitution. No GitHub publication was performed.

See VALIDATION.md for exact verification boundaries. Atlas remains unverified because credentials were not supplied. No screenshots or Code0 actions were fabricated.
