#!/usr/bin/env bash
#
# Dumps the Postgres database running in the lrwh-postgres docker container
# and uploads the compressed dump to S3 (S3-compatible custom endpoint).
#
# Usage:
#   ./scripts/backup-db.sh
#
# Configuration (env vars, all optional with defaults shown):
#   CONTAINER_NAME   lrwh-postgres
#   POSTGRES_USER    lrwhuser
#   POSTGRES_DB      lrwhdb
#   BACKUP_DIR       /var/backups/lrwh
#   RETENTION_DAYS   7
#   S3_PREFIX        db-backups
#   ENV_FILE         <repo_root>/.env   (source of AWS_S3_* vars, if present)
#
# Required S3 vars (from ENV_FILE or already exported):
#   AWS_S3_ACCESS_KEY, AWS_S3_SECRET_ACCESS_KEY, AWS_S3_URL,
#   AWS_S3_BUCKET_NAME (or AWS_BUCKET_NAME as a fallback)
#
# Requirements on the host: docker, aws-cli v2, gzip.
#
# Example crontab entry (daily at 2am):
#   0 2 * * * /path/to/lrwh-customize-gift/scripts/backup-db.sh >> /var/log/lrwh-db-backup.log 2>&1

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

CONTAINER_NAME="${CONTAINER_NAME:-lrwh-postgres}"
POSTGRES_USER="${POSTGRES_USER:-lrwhuser}"
POSTGRES_DB="${POSTGRES_DB:-lrwhdb}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/lrwh}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"
S3_PREFIX="${S3_PREFIX:-db-backups}"
ENV_FILE="${ENV_FILE:-$REPO_ROOT/.env}"

log() {
	printf '[%s] %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$1"
}

if [[ -f "$ENV_FILE" ]]; then
	log "Loading env vars from $ENV_FILE"
	set -a
	# shellcheck disable=SC1090
	source "$ENV_FILE"
	set +a
fi

AWS_S3_BUCKET_NAME="${AWS_S3_BUCKET_NAME:-${AWS_BUCKET_NAME:-}}"

for var in AWS_S3_ACCESS_KEY AWS_S3_SECRET_ACCESS_KEY AWS_S3_URL AWS_S3_BUCKET_NAME; do
	if [[ -z "${!var:-}" ]]; then
		log "ERROR: required env var $var is not set (checked $ENV_FILE and current environment)"
		exit 1
	fi
done

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
FILENAME="lrwh-db-${TIMESTAMP}.sql.gz"
FILEPATH="${BACKUP_DIR}/${FILENAME}"

log "Dumping database '$POSTGRES_DB' from container '$CONTAINER_NAME'..."
docker exec "$CONTAINER_NAME" pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" | gzip > "$FILEPATH"
log "Dump written to $FILEPATH ($(du -h "$FILEPATH" | cut -f1))"

log "Uploading to s3://${AWS_S3_BUCKET_NAME}/${S3_PREFIX}/${FILENAME} (endpoint: $AWS_S3_URL)..."
# Uses `s3api put-object` (single PUT, known Content-Length) instead of `s3 cp`,
# since `s3 cp` switches to multipart+chunked-encoding above ~8MB and this
# S3-compatible provider rejects those uploads with MissingContentLength.
# AWS_REQUEST_CHECKSUM_CALCULATION=when_required disables aws-cli v2's default
# CRC32 checksum, which otherwise also forces chunked transfer-encoding and
# hits the same MissingContentLength error even on a single PutObject.
AWS_ACCESS_KEY_ID="$AWS_S3_ACCESS_KEY" \
AWS_SECRET_ACCESS_KEY="$AWS_S3_SECRET_ACCESS_KEY" \
AWS_REQUEST_CHECKSUM_CALCULATION=when_required \
AWS_RESPONSE_CHECKSUM_VALIDATION=when_required \
aws s3api put-object \
	--bucket "$AWS_S3_BUCKET_NAME" \
	--key "${S3_PREFIX}/${FILENAME}" \
	--body "$FILEPATH" \
	--endpoint-url "$AWS_S3_URL" \
	--region ap-southeast-1 \
	> /dev/null

log "Upload complete."

log "Removing local backups older than $RETENTION_DAYS day(s)..."
find "$BACKUP_DIR" -maxdepth 1 -name 'lrwh-db-*.sql.gz' -mtime "+$RETENTION_DAYS" -print -delete

log "Backup finished successfully."
