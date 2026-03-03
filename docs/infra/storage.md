# Infrastructure: File Storage (S3)

**Source**: `src/server/s3/index.ts`, `src/app/api/files/[...key]/route.ts`
**SDK**: `@aws-sdk/client-s3` v3.802.0
**Region**: `ap-southeast-1` (hardcoded — not configurable via env)
**Related**: → `engine/export.md` (data URL → upload) · → `contracts/validation.md` (upload rules) · → `risks/security.md`

---

## S3 Client Configuration

```typescript
// server/s3/index.ts:
const s3 = new S3Client({
  region: "ap-southeast-1",          // hardcoded
  endpoint: env.AWS_S3_URL,          // custom S3-compatible endpoint (e.g. is3.cloudhost.id)
  credentials: {
    accessKeyId: env.AWS_S3_ACCESS_KEY,
    secretAccessKey: env.AWS_S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true,              // required for custom S3 endpoints
})
```

The storage backend is S3-compatible but NOT necessarily AWS S3. The endpoint `is3.cloudhost.id` is in `next.config.ts` as an allowed image hostname.

---

## Upload Functions

### `uploadFileToS3(file: File)`

Used for: template preview images.

```typescript
async function uploadFileToS3(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer())
  await s3.send(new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: file.name,                   // ← raw filename, no sanitization, no path prefix
    Body: buffer,
    ACL: "public-read",
    ContentType: file.type,           // ← from browser, unverified
  }))
  return new URL(`${env.AWS_S3_BUCKET_NAME}/${file.name}`, env.AWS_S3_URL).toString()
}
```

**No validation**: No MIME check, no size limit, no filename sanitization. → `risks/security.md`
**Public ACL**: All uploaded files are publicly accessible without auth.
**Key collision**: If two templates use the same filename, the second upload silently overwrites.

### `uploadBufferToS3(buffer: Buffer, key: string, contentType?: string)`

Used for: order submission images.

```typescript
async function uploadBufferToS3(buffer: Buffer, key: string): Promise<string> {
  await s3.send(new PutObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: key,
    Body: buffer,
    ACL: "public-read",
    ContentType: "image/png",         // hardcoded
  }))
  return new URL(`${env.AWS_S3_BUCKET_NAME}/${key}`, env.AWS_S3_URL).toString()
}
```

### `getObjectStream(key: string)`

Used by the S3 proxy route.

```typescript
async function getObjectStream(key: string): Promise<Readable | null> {
  const response = await s3.send(new GetObjectCommand({
    Bucket: env.AWS_S3_BUCKET_NAME,
    Key: key,
  }))
  return response.Body as Readable
}
```

---

## Upload Path Variants

| Context | Function | Key Format | Validation |
|---|---|---|---|
| Template preview (admin) | `uploadFileToS3` | `file.name` (raw) | None |
| Order image (user) | `uploadBufferToS3` | `{username}_{orderNumber}_{sha256}.png` | PNG + 8MB |

Order image key is deterministic: same image content → same key → same URL (deduplication by hash).

---

## S3 Proxy Route

```typescript
// src/app/api/files/[...key]/route.ts:
export async function GET(_, { params }) {
  const key = params.key.join("/")      // catch-all segments → S3 key
  const stream = await getObjectStream(key)
  if (!stream) return new Response(null, { status: 404 })
  return new Response(stream, {
    headers: {
      "Content-Type": "image/png",      // hardcoded regardless of actual file type
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  })
}
```

**No auth check.** Any S3 key is accessible to anyone who knows the URL.
**Content-Type is always `image/png`** regardless of actual file type.
Route is NOT in middleware matcher — middleware does not run on this route.

---

## Assumptions

1. S3 bucket is **public-read** — all uploads use `ACL: "public-read"`. If the bucket policy is private, all image URLs will return 403.
2. URL structure: `{AWS_S3_URL}/{AWS_S3_BUCKET_NAME}/{key}` — specific to this S3 provider's URL format. Different providers may use `{AWS_S3_BUCKET_NAME}.{domain}/{key}`.
3. No CDN layer — images served directly from S3 or via the proxy route.
4. No lifecycle rules configured on the S3 bucket — old unused files accumulate indefinitely.
