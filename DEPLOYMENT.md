# Deployment, cutover and rollback

Target: the existing server, running Next.js as a long-lived Node process
(PM2/systemd) behind the existing Apache (or nginx) reverse proxy. Serverless
hosting (e.g. Vercel) is **not** suitable while uploads are stored on local disk.

Requires Node ≥ 18.18 (20 LTS or 22 recommended).

## 1. Build

```bash
git clone https://github.com/gmehta-dev/knowledgecapita_next.git /var/www/knowledgecapita-next
cd /var/www/knowledgecapita-next
npm ci
npm run build          # also assembles .next/standalone (postbuild)
```

## 2. Configure (never commit this file)

Create `/var/www/knowledgecapita-next/.env.production.local` (or set the variables
in the PM2 ecosystem / systemd unit):

```bash
NODE_ENV=production
PORT=3100
HOSTNAME=127.0.0.1
MONGODB_URI=<same value as knowledgeCapita-API/.env>
JWT_SECRET=<same value as knowledgeCapita-API/.env>
JWT_EXPIRES_IN=7d
STORAGE_PATH=/var/www/knowledgeCapita-API/src/storage   # existing uploads, shared
ALLOWED_ORIGINS=https://knowledgecapita.com
MONGODB_AUTO_INDEX=false
SITE_URL=https://knowledgecapita.com
# Email (Gmail App Password, https://myaccount.google.com/apppasswords, no spaces)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=<gmail address>
SMTP_PASS=<16-character app password>
CONTACT_NOTIFY_TO=<where contact form messages go, default SMTP_USER>
```

The standalone server loads env files from its own folder, so after every build:

```bash
cp .env.production.local .next/standalone/
```

(or set the same variables in the PM2/systemd environment instead).

Sharing `STORAGE_PATH` with the legacy API means both apps see the same files
during the transition and rollback needs no file copy.

## 3. Run alongside the old app (staging)

The standalone server picks its port and host **before** it reads env files, so
`PORT`/`HOSTNAME` must come from the process environment. Check the port is free
first (`ss -ltnp | grep :3100`) – other apps on the server may already use it.

```bash
PORT=3100 HOSTNAME=127.0.0.1 pm2 start .next/standalone/server.js --name knowledgecapita-next
pm2 save
curl -s http://127.0.0.1:3100/api/health
curl -s http://127.0.0.1:3100/ | grep -o "<title>[^<]*</title>"   # must say KNOWLEDGE CAPITA
```

Expose it on a staging host (e.g. `next.knowledgecapita.com`) and smoke test:
login, directory filters/search, profile detail, register/profile update with
image + bio file upload, calendar add/list, activities (admin), contact form,
change password, logout.

For contract tests against staging, use a **staging copy** of the database
(`mongodump` → `mongorestore` into a `*_test` DB). Never run the contract suite
against production — it creates users and records.

### 3b. Create the first super admin

The only write this migration makes to production data, and only when you run it
(it shows the change and asks for confirmation):

```bash
cd /var/www/knowledgecapita-next
MONGODB_URI='<production uri>' node scripts/make-super-admin.mjs you@example.com
```

## 4. Cutover

Point the proxy at the Next.js process for **all** paths (pages and `/api/*`):

```apache
# Apache (mod_proxy) – replaces the static build DocumentRoot + /api proxy
ProxyPreserveHost On
ProxyPass        / http://127.0.0.1:3100/
ProxyPassReverse / http://127.0.0.1:3100/
```

```nginx
location / {
  proxy_pass http://127.0.0.1:3100;
  proxy_set_header Host $host;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
  client_max_body_size 6m;
}
```

Keep the Express API process and the CRA `build/` folder **running/untouched**.

Verify right after the switch:

```bash
curl -s https://knowledgecapita.com/api/health
curl -sI https://knowledgecapita.com/ | head -1
pm2 logs knowledgecapita-next --lines 100
```

## 5. Rollback (one config change)

1. Restore the previous Apache/nginx vhost (static CRA `build/` + `/api` → Express).
2. Reload the proxy (`apachectl graceful` / `nginx -s reload`).

No data migration happened, uploads are shared and JWTs are compatible, so
users stay logged in either way.

## 6. Decommission (only after a stable period)

Stop the Express process, then archive `knowledgeCapita-API` and `sharecomReactJs`.
Keep `STORAGE_PATH` pointing at the existing upload folder, or move the folder
and update the variable.

## Logging

Server errors are logged with `console.error('Unhandled Error:', err)`, as in
Express, and appear in the PM2/systemd logs. MongoDB connection success and
failure are logged on first use.
