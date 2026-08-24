#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 /path/to/backup.sql.gz"
  exit 1
fi

BACKUP_FILE="$1"
CONTAINER_NAME="eduerp-postgres"
DB_NAME="eduerp_prod"
DB_USER="eduerp_app"

if [ ! -f "$BACKUP_FILE" ]; then
  echo "❌ Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "=== Restoring EduERP Database from $BACKUP_FILE ==="
gunzip -c "$BACKUP_FILE" | docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d "$DB_NAME"

echo "✅ Database restore completed successfully!"
