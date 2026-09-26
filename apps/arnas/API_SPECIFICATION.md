# ARNAS API Specification (REST & Sync Engine)

Base URL: `http://<server-ip>:8080/api/v1`

---

## 1. Authentication & Family Management

### `POST /auth/login`
Authenticates a family member and returns tokens.

* **Request Body:**
```json
{
  "email": "abhijeet@example.com",
  "password": "SecurePassword123!",
  "deviceName": "Abhijeet's iPhone 15 Pro",
  "platform": "ios"
}
```
* **Response `200 OK`:**
```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi...",
  "expiresIn": 86400,
  "user": {
    "id": "usr_991823ab",
    "name": "Abhijeet Raut",
    "email": "abhijeet@example.com",
    "role": "ADMIN",
    "familyId": "fam_0019284",
    "storageQuotaBytes": 107374182400,
    "usedStorageBytes": 2415919104
  }
}
```

---

### `POST /family/members` (Admin Only)
Invite/create a new family member account.

* **Request Body:**
```json
{
  "name": "Sarah Raut",
  "email": "sarah@example.com",
  "password": "InitialPassword123!",
  "role": "MEMBER",
  "storageQuotaBytes": 53687091200
}
```
* **Response `201 Created`:**
```json
{
  "id": "usr_771891ac",
  "name": "Sarah Raut",
  "email": "sarah@example.com",
  "role": "MEMBER",
  "storageQuotaBytes": 53687091200
}
```

---

## 2. File & Directory Management

### `GET /files/list`
Lists directory contents. Pass `folderId` as a query param (omit for root).

* **Query Parameters:**
  - `folderId` (optional): Parent folder ID. Omit for root.
  - `vault` (optional): Set to `true` to list shared family vault.
  - `limit` (default: 100), `offset` (default: 0)

* **Response `200 OK`:**
```json
{
  "currentFolder": {
    "id": "fld_root",
    "name": "My Drive",
    "path": "/"
  },
  "items": [
    {
      "id": "fil_109283",
      "name": "IMG_20260924_182011.jpg",
      "isDirectory": false,
      "mimeType": "image/jpeg",
      "sizeBytes": 3491820,
      "checksumSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
      "thumbnailUrl": "/api/v1/files/fil_109283/thumbnail",
      "isSharedVault": false,
      "takenAt": "2026-09-24T18:20:11.000Z",
      "createdAt": "2026-09-24T18:25:00.000Z"
    },
    {
      "id": "fld_99210",
      "name": "Family Trips",
      "isDirectory": true,
      "sizeBytes": 0,
      "isSharedVault": true,
      "createdAt": "2026-09-20T10:00:00.000Z"
    }
  ]
}
```

---

### `GET /files/:id/download`
Streams the raw binary file. Supports HTTP `Range` headers for video streaming.

* **Headers:**
  - `Authorization: Bearer <token>`
  - `Range: bytes=0-1048575` (optional)
* **Response `200 OK` or `206 Partial Content`:**
  - Content-Type: `image/jpeg` / `video/mp4`
  - Accept-Ranges: `bytes`

---

### `GET /files/:id/thumbnail`
Returns a fast WebP thumbnail (256x256 or 512x512).

* **Query Parameters:**
  - `size`: `sm` (128px), `md` (256px), `lg` (512px)
* **Response `200 OK`:**
  - Content-Type: `image/webp`
  - Cache-Control: `public, max-age=31536000, immutable`

---

## 3. Resumable Upload & Differential Sync Engine

### `POST /sync/status`
Mobile client sends signatures of recent local media to compute delta sync.

* **Request Body:**
```json
{
  "deviceId": "dev_iphone15_01",
  "assets": [
    {
      "localId": "ph_asset_001",
      "checksumSha256": "4a536f98...",
      "sizeBytes": 4518290,
      "modifiedAt": "2026-09-24T17:00:00.000Z"
    }
  ]
}
```
* **Response `200 OK`:**
```json
{
  "missingAssets": ["ph_asset_001"],
  "syncedAssets": []
}
```

---

### `POST /sync/upload/init`
Initializes a multi-part resumable chunked upload.

* **Request Body:**
```json
{
  "filename": "camera_backup_20260924.mov",
  "mimeType": "video/quicktime",
  "totalSizeBytes": 52428800,
  "chunkSizeBytes": 2097152,
  "expectedSha256": "9b71d224bd62f3785d96d46ad3ea3d73319bfbc2890caadae2dff72519673ca7",
  "isSharedVault": false,
  "parentFolderId": null,
  "takenAt": "2026-09-24T18:15:00.000Z"
}
```
* **Response `201 Created`:**
```json
{
  "uploadId": "upl_8192a001fb",
  "chunkSizeBytes": 2097152,
  "totalChunks": 25,
  "uploadedChunks": [],
  "expiresAt": "2026-09-25T19:00:00.000Z"
}
```

---

### `PUT /sync/upload/chunk`
Uploads a single chunk of data.

* **Headers:**
  - `Content-Type: application/octet-stream`
  - `X-Upload-Id: upl_8192a001fb`
  - `X-Chunk-Index: 0`
  - `X-Chunk-Sha256: 7e2d9a...`
* **Body:** Raw binary chunk data.
* **Response `200 OK`:**
```json
{
  "uploadId": "upl_8192a001fb",
  "chunkIndex": 0,
  "status": "ACCEPTED",
  "receivedBytes": 2097152
}
```

---

### `POST /sync/upload/finalize`
Merges chunks, verifies whole-file SHA-256, generates thumbnails, and saves record.

* **Request Body:**
```json
{
  "uploadId": "upl_8192a001fb"
}
```
* **Response `201 Created`:**
```json
{
  "file": {
    "id": "fil_991827",
    "name": "camera_backup_20260924.mov",
    "sizeBytes": 52428800,
    "checksumSha256": "9b71d224...",
    "mimeType": "video/quicktime",
    "thumbnailUrl": "/api/v1/files/fil_991827/thumbnail",
    "createdAt": "2026-09-24T19:06:00.000Z"
  }
}
```
