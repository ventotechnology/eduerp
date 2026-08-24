#!/bin/bash
set -e

if [ $# -lt 2 ]; then
  echo "Usage: $0 <path_to_backup.sql.gz> <target_database> [--allow-production-restore]"
  echo "Example safe restore: $0 /opt/backups/eduerp/backup.sql.gz eduerp_restore_test"
  exit 1
fi

BACKUP_FILE="$1"
TARGET_DB="$2"
FLAG="$3"
CONTAINER_NAME="eduerp-postgres"
DB_USER="eduerp_app"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Error: Backup file not found at '$BACKUP_FILE'"
  exit 1
fi

# High-friction safety guard for production database
if [ "$TARGET_DB" = "eduerp_prod" ]; then
  if [ "$FLAG" != "--allow-production-restore" ]; then
    echo "⛔ SAFETY BLOCK: Direct restoration into production database 'eduerp_prod' is REFUSED by default!"
    echo "To restore into a dedicated non-production verification database, use:"
    echo "  $0 $BACKUP_FILE eduerp_restore_test"
    echo ""
    echo "If you INTENTIONALLY want to overwrite production 'eduerp_prod', you must pass --allow-production-restore:"
    echo "  $0 $BACKUP_FILE eduerp_prod --allow-production-restore"
    exit 1
  fi
  echo "⚠️ WARNING: Proceeding with explicit production restore into 'eduerp_prod'..."
fi

echo "=== Ensuring target database '$TARGET_DB' exists ==="
docker exec "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE $TARGET_DB;" 2>/dev/null || true

echo "=== Restoring database '$TARGET_DB' from '$BACKUP_FILE' ==="
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$TARGET_DB"

echo "✅ Database restore into '$TARGET_DB' completed successfully!"
