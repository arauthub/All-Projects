# ARNAS Backup & Disaster Recovery Guide

The 3-2-1 backup strategy is essential for family data:
- **3** copies of your data (Primary ARNAS host, automated local backup, offsite backup)
- **2** different storage media (e.g. Host NVMe SSD + External HDD)
- **1** offsite copy (Encrypted cloud or family member's remote NAS via Tailscale)

---

## 1. Automated PostgreSQL Database Backups

When running `docker-compose.prod.yml`, the `arnas-db-backup` container runs every night at 3:00 AM UTC:
- Location: `./data/backups/arnas_db_YYYYMMDD_HHMMSS.sql.gz`
- Retention: Backups older than 30 days are automatically pruned.

### Manual Database Dump:
```bash
# Generate immediate database backup
docker exec -t arnas-postgres pg_dump -U arnas_admin arnas_db | gzip > ./data/backups/manual_backup_$(date +%Y%m%d).sql.gz
```

### Database Restore Procedure:
```bash
# 1. Stop the application server
docker stop arnas-server

# 2. Decompress and restore database
gunzip -c ./data/backups/arnas_db_20260924_030000.sql.gz | docker exec -i arnas-postgres psql -U arnas_admin -d arnas_db

# 3. Restart application server
docker start arnas-server
```

---

## 2. Storage Directory Backups (`/data/storage`)

All original files are stored with a standard filesystem hierarchy in `/data/storage`.

### Option A: External USB Drive Sync with `rsync`
```bash
# Mount your external backup drive at /Volumes/BackupDrive
rsync -avz --progress --delete /Users/abhijeetraut/Documents/All-Projects/arnas/data/storage /Volumes/BackupDrive/arnas_mirror/
```

### Option B: Encrypted Offsite Backup with Restic
```bash
# Initialize restic repository (e.g. Backblaze B2, AWS S3, or remote SFTP)
restic -r b2:my-family-backup:arnas init

# Run daily snapshot
restic -r b2:my-family-backup:arnas backup /Users/abhijeetraut/Documents/All-Projects/arnas/data
```

---

## 3. Disaster Recovery (Zero Data Loss Guarantee)

Because ARNAS names every stored file with its exact SHA-256 checksum and preserves file extensions, **even if the PostgreSQL database is completely destroyed**, zero user media is lost!

Files are structured as:
```
data/storage/families/{familyId}/members/{userId}/camera_roll/{YYYY}/{MM}/{sha256}.jpg
```

To reconstruct the database from the disk if needed:
1. Re-run `npm run prisma:migrate` and `npm run prisma:seed`.
2. A simple directory scan script reads the files and re-inserts their metadata into `file_items` matching the host filesystem.
