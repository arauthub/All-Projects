# ARNAS Mobile Sync & Chunking Protocol Specification

This document defines the exact client-server sync protocol for high-reliability mobile synchronization over lossy, intermittent, or metered networks.

---

## 1. Core Principles

1. **Chunk Granularity**: Default chunk size is **2MB (2,097,152 bytes)**. Chunks are small enough to upload rapidly before network timeouts, yet large enough to avoid HTTP request overhead.
2. **Double Integrity Verification**:
   - Each chunk has an `X-Chunk-Sha256` header.
   - The final merged file has an `expectedSha256` header validated prior to permanent commitment.
3. **Idempotent & Resumable**: If an upload terminates at chunk 14 of 20, the client queries `/sync/upload/init` or status and directly sends chunk 15.
4. **Content-Level Deduplication**: If another user (or the same user) has already uploaded the exact same SHA-256 file, ARNAS detects this at `init` or `finalize` and creates a hard link/pointer without re-writing identical bytes to disk.

---

## 2. Sync State Machine

```
              [Local Media Found]
                       │
                       ▼
             [Compute SHA-256 Hash]
                       │
                       ▼
           [Query Server Sync Status]
            /                      \
      (File Exists)          (Missing on Server)
          │                          │
          ▼                          ▼
   [Mark Synced in SQLite]    [POST /sync/upload/init]
                                     │
                                     ▼
                            [Loop: PUT Chunks]
                                     │
                             (Network Drop?) ──► [Wait & Resume]
                                     │
                                     ▼
                          [All Chunks Uploaded]
                                     │
                                     ▼
                         [POST /sync/upload/finalize]
                                     │
                                     ▼
                         [Server Verification OK]
                                     │
                                     ▼
                           [Update Local SQLite]
```

---

## 3. Handling Mobile Edge Cases

### 3.1 Network Loss & Reconnection
- If a chunk upload fails due to socket timeout or connection loss, the mobile client backs off using exponential jitter:
  $$\text{Delay} = \min(120, 2^{\text{attempt}} + \text{random}(0, 1)) \text{ seconds}$$
- When network reconnects, the client calls `POST /sync/upload/init` with the same file signature. The server returns:
  ```json
  {
    "uploadId": "upl_8192a001fb",
    "uploadedChunks": [0, 1, 2, 3, 4]
  }
  ```
  The client immediately resumes from chunk `5`.

### 3.2 Battery & Metered Network Constraints
The mobile sync worker observes:
1. `NetInfo.isWifi`: If setting `uploadOnWifiOnly` is true and connection is cellular, sync is paused.
2. `Battery.isCharging` & `Battery.batteryLevel`: If battery < 20% and not plugged into AC power, background syncing sleeps until device is connected to power.
3. Lock screen / Background App Refresh: Uses native iOS Background Processing & Android WorkManager jobs constrained to `NETWORK_UNMETERED` and `BATTERY_NOT_LOW`.

### 3.3 Deduplication Flow
When the mobile client initializes an upload:
1. Client computes file SHA-256: `a5f2...`
2. Server checks `FileItem` where `checksumSha256 = 'a5f2...' AND isDeleted = false`.
3. If matched:
   - Server immediately creates a new `FileItem` pointing to existing `storagePath`.
   - Returns status: `ALREADY_EXISTS` with file metadata.
   - Zero byte chunks are transferred, saving user bandwidth and disk space.

---

## 4. Mobile Local SQLite Schema

Inside the mobile app (`expo-sqlite`):

```sql
CREATE TABLE IF NOT EXISTS local_sync_journal (
  local_asset_id TEXT PRIMARY KEY,
  file_name TEXT NOT NULL,
  uri TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT,
  mime_type TEXT,
  creation_time INTEGER,
  sync_status TEXT CHECK(sync_status IN ('PENDING', 'UPLOADING', 'COMPLETED', 'FAILED')),
  active_upload_id TEXT,
  last_chunk_index INTEGER DEFAULT 0,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_status ON local_sync_journal(sync_status);
```
