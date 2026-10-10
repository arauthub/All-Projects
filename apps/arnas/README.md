# 🛡️ ARNAS — Enterprise Distributed Cloud NAS & Zero-Knowledge E2EE Mobile Sync

[![Fastify](https://img.shields.io/badge/Fastify-000000?style=flat&logo=fastify&logoColor=white)](https://fastify.dev)
[![React Native](https://img.shields.io/badge/React_Native-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat&logo=prisma&logoColor=white)](https://prisma.io)
[![Author: Abhijeet Raut](https://img.shields.io/badge/Author-Abhijeet_Raut-blue.svg?style=flat&logo=github)](https://github.com/arauthub)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg?style=flat)](../../LICENSE)

**ARNAS** (Autonomous Raut Network Attached Storage) is an enterprise-grade, self-hosted, distributed private cloud storage system featuring multi-server storage clustering, instant ingest with background fan-out replication, zero-knowledge end-to-end encryption (E2EE), intelligent sentinel mobile sync, and immutable compliance audit logging.

---

## 🏗 Enterprise Architecture Overview

```text
                       +----------------------------------------------------+
                       |           Mobile Client (iOS / Android / Web)      |
                       |  - Zero-Knowledge AES-256-GCM Client Crypto Engine |
                       |  - Intelligent Sentinel Sync (Wi-Fi/Battery Guard) |
                       |  - Interactive Onboarding Walkthrough & Tutorial   |
                       |  - Multi-Storage Cluster Management UI             |
                       +-------------------------+--------------------------+
                                                 |
                                         HTTPS / TLS 1.3
                                    (Tailscale / LAN / Caddy)
                                                 |
                                                 v
                       +----------------------------------------------------+
                       |            ARNAS Core Engine (Fastify/Node.js)     |
                       |  - Zero-Knowledge Key Exchange & Vault Distribution|
                       |  - High-Concurrency Resumable 2MB Chunk Pipeline   |
                       |  - SHA-256 In-Flight Deduplication & WebP Shaper   |
                       |  - Immutable Compliance Audit Logger               |
                       +-------------------------+--------------------------+
                                                 |
                                     Storage Orchestrator
                                                 |
                       +-------------------------+--------------------------+
                       |                                                    |
                       v                                                    v
          [Primary Storage Node]                               [Secondary Storage Nodes]
        Local High-Speed NVMe/Disk                         MinIO / AWS S3 / Cloudflare R2 / NAS
          - Instant Ingest (HTTP 201)                        - Asynchronous Fan-Out Replication Queue
          - Primary Range Video Stream                       - Automatic Failover Read Mirror
```

---

## 🌟 Key Enterprise Capabilities

1. **Multi-Server Storage Clustering & Redundancy**:
   - **Unified Driver Architecture**: Seamlessly clusters local host disks, remote mounts, and S3-compatible object stores (MinIO, AWS S3, Wasabi, Cloudflare R2).
   - **Instant Ingest + Asynchronous Fan-Out**: Writes commit immediately to the primary disk while background workers replicate chunks with SHA-256 checksum verification.
   - **Automatic Read Failover**: If the primary storage node is degraded or offline, the orchestrator transparently routes downloads to the highest-priority synced replica without client disruption.
   - **Cluster Health Benchmarking**: Live latency tracking (`pingMs`), disk space monitoring, and manual reconciliation queue triggers.

2. **Zero-Knowledge End-to-End Encryption (E2EE)**:
   - **Client-Side Cryptography**: Files and media are encrypted on-device with AES-256-GCM before transmission.
   - **PBKDF2 Key Derivation**: Master keys derived using PBKDF2 (SHA-256) with 100,000 iterations.
   - **Mathematical Zero-Knowledge**: The server never receives plaintext or private keys.
   - **12-Word Recovery Mnemonic**: Offline emergency recovery phrase for identity restoration.

3. **Location Geofencing & Trusted Wi-Fi Auto-Sync**:
   - **Geofenced Perimeter Detection**: Configurable multi-site perimeters (Home HQ, Design Studio, Office/Lab) calculated via real-time Haversine GPS distance algorithms.
   - **Trusted Wi-Fi Validation**: Auto-sync initiates **only** when within the geofence perimeter and connected to pre-approved trusted Wi-Fi SSIDs.
   - **Zero Cellular Leakage**: Sync strictly pauses on mobile data, untrusted coffee shop networks, or when roaming outside designated perimeters.
   - **Testing & Simulator Radar**: Built-in interactive simulation toolbar allowing instant verification on iOS Simulator, Android Emulator, and Web preview.

4. **Comprehensive Enterprise NAS Application Features**:
   - **Cloud File Explorer**: Breadcrumb navigation, folder hierarchy, instant search, and batch multi-select.
   - **File Operations**: In-place rename, duplicate, favorite/starring, and folder moves.
   - **S.M.A.R.T. Health & Live Telemetry**: Real-time read/write throughput meters (MB/s), IOPS monitors, drive temperatures, and S.M.A.R.T. diagnostics.
   - **Volume Breakdown**: Visual usage segmentation across Photos, Videos, Documents, and Zero-Knowledge Encrypted Vaults.
   - **30-Day Recycle Bin (Trash Recovery)**: Soft-deletion buffer with 1-click file restoration and permanent purge controls.
   - **Expiring Secure Share Links**: Share files via customizable expiration timers (1h–7d), passphrase locks, and cross-device QR codes.

5. **External HDD / SSD Wireless NAS Storage**:
   - **Direct Wireless Backup to External Drives**: Auto-routes mobile photos, videos, and vaults over Wi-Fi directly to attached USB 3.2 / Thunderbolt external SSDs or HDDs connected to the server.
   - **Auto-Detection & Canary Testing**: Scans system volumes (`/Volumes`, `/media`, `/mnt`) with `.arnas_canary.json` verification before mounting.
   - **Real-Time I/O Speed Benchmarking**: Live write/read throughput benchmark (MB/s) and random IOPS measurement directly from mobile and web UI.
   - **Safe Ejection Protocol**: Flushes active sync buffers, unregisters target, and safely detaches drive while falling back to server NVMe.

6. **Intelligent Mobile Sentinel Engine**:
   - Adaptive background syncing respecting battery level thresholds (e.g. pauses below 20%).
   - Wi-Fi only mode preventing accidental cellular data consumption.
   - Delta sync determination detecting missing mobile assets via SHA-256 fingerprinting.

7. **User Walkthrough Tutorial & Orientation**:
   - Interactive 6-step onboarding carousel introducing Cloud Sync, Sentinel Policies, Cluster Redundancy, Zero-Knowledge Security, Geofenced Wi-Fi Sync, and External Drive Storage.
   - Auto-triggers on first launch for new users; accessible anytime via Settings ("App Walkthrough Tutorial").

8. **Immutable Compliance Audit Trail**:
   - Cryptographic log entries recording `FILE_UPLOAD`, `FILE_DELETE`, `STORAGE_NODE_ADDED`, and `E2EE_INITIALIZED` with timestamps and client IP.


---

## 📂 Project Organization

```text
apps/arnas/
├── docker-compose.yml        # Multi-container dev composition (PostgreSQL + ARNAS API + Caddy)
├── docker-compose.prod.yml   # Production hardened composition
├── .env.example              # Environment variables template
├── server/                   # Backend Fastify service
│   ├── prisma/               # Schema, migrations & seed scripts
│   ├── src/
│   │   ├── modules/          # Auth, Family, Files, Sync, Storage Cluster, E2EE, Audit
│   │   ├── storage/          # Storage Orchestrator & Drivers (Local, S3/MinIO)
│   │   ├── services/         # Storage and thumbnail processing
│   │   └── server.ts         # Fastify HTTP server entry point
│   └── vitest.config.ts      # Test configuration (100% passing tests)
├── mobile/                   # Expo / React Native Client
│   ├── app/                  # Expo Router file-based screens (Timeline, Files, Sync, Settings)
│   ├── src/
│   │   ├── api/              # Secure API client with token storage
│   │   ├── components/       # StorageClusterModal, E2EESecurityModal, AuditTrailModal, UserTutorialModal
│   │   ├── crypto/           # Zero-Knowledge E2EE cryptographic engine
│   │   ├── services/         # SyncEngine, MediaScanner, SQLite Cache, SentinelService
│   │   └── stores/           # Zustand global state (Auth, Sync, Settings)
└── docs/                     # Documentation for Remote Access & Backups
```

---

## 🚀 Quick Start Guide

### 1. Start the Database & Backend Server

```bash
cd apps/arnas/server
cp .env.example .env
npm install
npx prisma db push
npm run dev
```

* **API Health Check**: `http://localhost:8080/health`
* **Swagger Interactive Docs**: `http://localhost:8080/docs`

### 2. Launch the Mobile Client (Expo)

```bash
cd apps/arnas/mobile
npm install
npm run web    # Or npx expo start --ios / android
```

* **Web Preview**: `http://localhost:8081`
* **Metro Bundler**: `exp://localhost:8081`

---

## 👤 Author & Monorepo
* **Engineer**: Abhijeet Raut ([@arauthub](https://github.com/arauthub))
* **Repository**: [`All-Projects/apps/arnas`](https://github.com/arauthub/All-Projects/tree/main/apps/arnas)
