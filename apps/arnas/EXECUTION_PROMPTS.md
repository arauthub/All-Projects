# ARNAS Phased Execution Prompts

These prompts are tailored specifically for the `/Users/abhijeetraut/Documents/All-Projects/arnas` workspace. Feed them sequentially into Antigravity to build each subsystem with full type safety and test coverage.

---

### 🟢 Prompt 1: Server Scaffolding, Prisma Schema & Storage Foundation

```markdown
Target directory: /Users/abhijeetraut/Documents/All-Projects/arnas/server

Please initialize and scaffold the ARNAS Fastify backend according to the specs in ../EXECUTION_SPEC.md:

1. Create `package.json` with dependencies:
   - fastify, @fastify/cors, @fastify/jwt, @fastify/multipart, @fastify/swagger
   - @prisma/client, prisma, bcrypt, sharp, zod, dotenv
   - Dev dependencies: typescript, tsx, vitest, @types/node, @types/bcrypt
2. Setup `tsconfig.json` and strict TypeScript configuration.
3. Create `prisma/schema.prisma` matching the schema in `arnas/EXECUTION_SPEC.md` (Family, User, Device, FileItem, UploadSession).
4. Create `src/server.ts` and `src/app.ts` with Fastify plugin registration, CORS, error handling, and health check route `GET /health`.
5. Create `src/config/env.ts` with Zod validation for all environment variables.
6. Create `src/services/storage.service.ts` to manage directory creation in `/data/storage` (families, thumbnails, staging).
7. Create `prisma/seed.ts` to create the root family and initial admin user.
8. Add a Dockerfile for the server.

Test that `npm run build` or `npx tsc --noEmit` completes cleanly.
```

---

### 🟢 Prompt 2: Authentication & Family Multi-Tenancy

```markdown
Target directory: /Users/abhijeetraut/Documents/All-Projects/arnas/server

Implement the complete Authentication & Family ACL layer according to `arnas/API_SPECIFICATION.md`:

1. `src/modules/auth/`:
   - `auth.routes.ts`: `POST /api/v1/auth/login`, `POST /api/v1/auth/refresh`, `GET /api/v1/auth/me`.
   - `auth.service.ts`: Password hashing with bcrypt, JWT token generation (access + refresh).
   - `auth.schema.ts`: Zod validation schemas for requests.
2. `src/plugins/authenticate.ts`:
   - Fastify auth decorator to verify JWT Bearer tokens and attach `request.user`.
3. `src/modules/family/`:
   - `family.routes.ts`: `POST /api/v1/family/members` (Admin only), `GET /api/v1/family/members`.
   - Storage quota validation logic (enforce `storageQuotaBytes`).
4. Write unit/integration tests with Vitest verifying:
   - Admin login returns valid tokens.
   - Non-admin cannot invite members.
   - Quota limits trigger a 403 Forbidden.
```

---

### 🟢 Prompt 3: Resumable Chunked Upload & Differential Sync Engine

```markdown
Target directory: /Users/abhijeetraut/Documents/All-Projects/arnas/server

Implement the Resumable Chunked Upload & Delta Sync engine matching `arnas/SYNC_PROTOCOL_SPEC.md`:

1. `src/modules/sync/sync.routes.ts`:
   - `POST /api/v1/sync/status`: Compare client media signatures against DB and return missing vs synced lists.
   - `POST /api/v1/sync/upload/init`: Create `UploadSession` record, verify deduplication SHA-256. If duplicate, link existing storage path immediately.
   - `PUT /api/v1/sync/upload/chunk`: Stream binary chunk to `staging/{uploadId}/chunk_{index}.bin`, calculate and verify chunk hash.
   - `POST /api/v1/sync/upload/finalize`: Assemble all chunks into final file, compute and verify complete SHA-256, move to member storage path, generate WebP thumbnail via `sharp`, create `FileItem`, update user storage counter.
2. `src/modules/files/file.routes.ts`:
   - `GET /api/v1/files/list`: Directory listing with pagination and family vault filter.
   - `GET /api/v1/files/:id/download`: Stream file with HTTP Range support.
   - `GET /api/v1/files/:id/thumbnail`: Serve WebP thumbnail with caching headers.
   - `DELETE /api/v1/files/:id`: Soft delete.
3. Write an end-to-end Vitest test simulating uploading a 6MB file in 3 chunks, checking assembly and SHA-256 verification.
```

---

### 🟢 Prompt 4: Mobile Client Setup & Design System

```markdown
Target directory: /Users/abhijeetraut/Documents/All-Projects/arnas/mobile

Scaffold the React Native Expo client app:

1. Initialize Expo TypeScript app with dependencies:
   - `expo-router`, `expo-secure-store`, `expo-file-system`, `expo-media-library`
   - `expo-sqlite`, `expo-crypto`, `expo-network`, `expo-battery`, `expo-image`
   - `@tanstack/react-query`, `zustand`, `lucide-react-native`
2. Create navigation layout using `expo-router`:
   - `(auth)/login.tsx`: Server URL input, email, password, test connection button.
   - `(tabs)/_layout.tsx`: Bottom tabs (Timeline, Files, Sync Queue, Settings).
3. Design System & Theme:
   - Sleek dark mode by default (`#0B0F17` background, vibrant indigo/cyan accents, `#1E293B` cards).
   - Component primitives: `Card`, `Button`, `ProgressBar`, `StorageMeter`.
4. API Client:
   - Axios or fetch wrapper with base URL from `expo-secure-store` and automatic JWT Bearer injection.
```

---

### 🟢 Prompt 5: Mobile File Browser & Media Viewer

```markdown
Target directory: /Users/abhijeetraut/Documents/All-Projects/arnas/mobile

Build the interactive File Browser and Media Gallery UI:

1. `app/(tabs)/files.tsx`:
   - Toggle between "My Private Drive" and "Family Vault".
   - Breadcrumb navigation for nested folders.
   - List and Grid view toggles.
   - File actions modal: Download offline, share with family, delete.
2. `app/(tabs)/timeline.tsx`:
   - Media gallery grouped by Date (Today, Yesterday, Last Month).
   - Fast image loading with ExpoImage using the thumbnail API.
3. Media Preview modal:
   - Fullscreen photo viewer with pinch-to-zoom.
   - Metadata overlay (EXIF date, file size, SHA-256).
```

---

### 🟢 Prompt 6: Mobile Automated Background Sync Engine

```markdown
Target directory: /Users/abhijeetraut/Documents/All-Projects/arnas/mobile

Implement the automated background media sync worker:

1. `src/services/sqlite.service.ts`:
   - Initialize `local_sync_journal` table matching `arnas/SYNC_PROTOCOL_SPEC.md`.
2. `src/services/media-scanner.service.ts`:
   - Scan device DCIM / Camera Roll via `expo-media-library`.
   - Compute fast local signature and insert into SQLite as `PENDING`.
3. `src/services/chunk-uploader.service.ts`:
   - Read local file in 2MB slices via `expo-file-system`.
   - Execute resumable chunk upload flow against `/api/v1/sync/upload/*`.
   - Update SQLite progress per chunk.
4. `src/services/background-task.ts`:
   - Register `expo-task-manager` / `expo-background-fetch`.
   - Enforce settings: Wi-Fi only check (`expo-network`) and Battery check (`expo-battery`).
5. `app/(tabs)/sync.tsx`:
   - Live visual upload queue showing current uploading file, chunk progress bar, upload speed, and manual "Sync Now" button.
```
