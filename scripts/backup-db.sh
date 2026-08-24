#!/bin/bash
set -e

BACKUP_DIR="${BACKUP_DIR:-/opt/backups/eduerp}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/eduerp_backup_${TIMESTAMP}.sql.gz"
CONTAINER_NAME="eduerp-postgres"
DB_NAME="eduerp_prod"
DB_USER="eduerp_app"

mkdir -p "$BACKUP_DIR"

echo "=== Starting EduERP Database Backup: $TIMESTAMP ==="
docker exec "$CONTAINER_NAME" pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE"

# Verify backup size
FILE_SIZE=$(stat -c%s "$BACKUP_FILE" 2>/dev/null || stat -f%z "$BACKUP_FILE" 2>/dev/null || wc -c < "$BACKUP_FILE")

if [ "$FILE_SIZE" -lt 100 ]; then
  echo "❌ ERROR: Backup file is empty or corrupted: $BACKUP_FILE"
  exit 1
fi

echo "✅ Backup successfully created at $BACKUP_FILE ($FILE_SIZE bytes)"

# Retention: Delete backups older than 14 days
find "$BACKUP_DIR" -name "eduerp_backup_*.sql.gz" -type f -mtime +14 -delete || true
echo "=== Backup completed successfully! ==="
