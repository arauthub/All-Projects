#!/bin/sh
set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/arnas_db_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "📦 [$(date)] Starting ARNAS database backup..."

PGPASSWORD="${POSTGRES_PASSWORD}" pg_dump \
  -h "${POSTGRES_HOST}" \
  -U "${POSTGRES_USER}" \
  -d "${POSTGRES_DB}" \
  | gzip > "${BACKUP_FILE}"

echo "✅ [$(date)] Backup completed: ${BACKUP_FILE} ($(du -h "${BACKUP_FILE}" | cut -f1))"

# Retention policy: Keep backups for 30 days
find "${BACKUP_DIR}" -name "arnas_db_*.sql.gz" -mtime +30 -exec rm {} \;
echo "🧹 [$(date)] Retention clean up complete (backups older than 30 days pruned)."
