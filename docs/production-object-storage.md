# Production object storage

All production uploads use Arvan's S3-compatible API. The application never
uses `public/uploads` or a local fallback when `NODE_ENV=production`.

Set these exact runtime environment variables on the production service:

```env
S3_ENDPOINT=https://s3.ir-thr-at1.arvanstorage.ir
S3_BUCKET=qafaseh-prod
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_PUBLIC_BASE_URL=https://qafaseh-prod.s3.ir-thr-at1.arvanstorage.ir
# Optional; defaults to auto when omitted.
S3_REGION=ir-thr-at1
```

`S3_SECRET_ACCESS_KEYS3_PUBLIC_BASE_URL` is not a valid variable name and is
never read. Split it into `S3_SECRET_ACCESS_KEY` and `S3_PUBLIC_BASE_URL`.

The admin storage-health endpoint can be used after deployment to verify the
bucket connection without exposing credentials. Missing required S3 settings
produce a `STORAGE_CONFIG` response; values are never included in logs or API
responses.

Run `npm run storage:inspect-local-paths` for a read-only report of legacy
`/uploads/...` values in book, edition, profile, reference, blog, hero,
site-setting, and static-page image fields.
