# Graphura CRM — Production Deployment Guide

> **Stack:** Express (Node.js) backend on **Render** · React (Vite) frontend on **Vercel**  
> **Database:** MongoDB Atlas · **Cache:** Redis (Render Redis or Upstash)  
> Track every checkbox below. When all boxes are ticked, you are live in production.

---

## Table of Contents

1. [Pre-flight Checklist](#1-pre-flight-checklist)
2. [MongoDB Atlas Setup](#2-mongodb-atlas-setup)
3. [Redis Setup (Upstash — free)](#3-redis-setup-upstash--free)
4. [Backend Code Changes Before Deploy](#4-backend-code-changes-before-deploy)
5. [Deploy Backend to Render](#5-deploy-backend-to-render)
6. [Frontend Code Changes Before Deploy](#6-frontend-code-changes-before-deploy)
7. [Deploy Frontend to Vercel](#7-deploy-frontend-to-vercel)
8. [Wire Frontend ↔ Backend](#8-wire-frontend--backend)
9. [Environment Variables Reference](#9-environment-variables-reference)
10. [Post-Deploy Smoke Tests](#10-post-deploy-smoke-tests)
11. [Razorpay Webhook Update](#11-razorpay-webhook-update)
12. [Firebase FCM in Production](#12-firebase-fcm-in-production)
13. [Cloudinary in Production](#13-cloudinary-in-production)
14. [Custom Domain (Optional)](#14-custom-domain-optional)
15. [Ongoing Maintenance](#15-ongoing-maintenance)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Pre-flight Checklist

Complete every item before you touch Render or Vercel.

- [ ] Git repository is pushed to GitHub / GitLab (Render and Vercel pull from it)
- [ ] `node_modules/` is in `.gitignore` for both `/backend` and `/frontend`
- [ ] `.env` files are in `.gitignore` — **never commit secrets**
- [ ] MongoDB Atlas cluster is created (see Section 2)
- [ ] Redis URL is ready (see Section 3)
- [ ] Cloudinary account credentials are ready
- [ ] Razorpay live/test keys are ready
- [ ] Firebase service-account JSON is ready
- [ ] Brevo (email) API key is ready

---

## 2. MongoDB Atlas Setup

If you already have an Atlas cluster, skip to **Step 5**.

### Steps

1. Go to [https://cloud.mongodb.com](https://cloud.mongodb.com) → **Create a free cluster** (M0 Sandbox is free forever).
2. Choose a region close to your Render server region (e.g., AWS Mumbai if you pick Render Singapore).
3. **Database Access** → Add a new database user:
   - Username: `graphura_prod`
   - Password: generate a strong random password (save it)
   - Role: **Read and Write to Any Database**
4. **Network Access** → Add IP Address → choose **Allow Access from Anywhere** (`0.0.0.0/0`)
   - Render servers use dynamic IPs, so you must allow all IPs.
5. **Connect** → **Connect your application** → copy the connection string:
   ```
   mongodb+srv://graphura_prod:<password>@<cluster>.mongodb.net/graphura_crm?retryWrites=true&w=majority
   ```
   Replace `<password>` with the password you created.

- [ ] Atlas cluster created
- [ ] Database user created with read/write access
- [ ] Network access set to 0.0.0.0/0
- [ ] Connection string copied and saved securely

---

## 3. Redis Setup (Upstash — free)

The backend uses Redis for rate limiting and caching. Upstash provides a free serverless Redis.

### Steps

1. Go to [https://upstash.com](https://upstash.com) → Sign up → **Create Database**
2. Choose **Redis**, name it `graphura-crm-prod`, pick a region matching Render.
3. After creation, copy the **Redis URL** from the dashboard:
   ```
   rediss://:PASSWORD@HOST:PORT
   ```
4. This becomes your `REDIS_URL` environment variable.

- [ ] Upstash account created
- [ ] Redis database created
- [ ] Redis URL copied and saved securely

> **Alternative:** Render also offers a managed Redis add-on. You can attach it to your backend service and Render injects `REDIS_URL` automatically.

---

## 4. Backend Code Changes Before Deploy

Make these changes in your local codebase and push to Git before deploying.

### 4.1 — Verify `start` script in `backend/package.json`

Your `package.json` already has the correct start script. Confirm it looks like this:

```json
"scripts": {
  "start": "node src/server.js"
}
```

- [ ] `"start": "node src/server.js"` exists in `backend/package.json`

### 4.2 — Add a `render.yaml` (optional but recommended)

Create `backend/render.yaml` for infrastructure-as-code deploys:

```yaml
services:
  - type: web
    name: graphura-crm-backend
    runtime: node
    rootDir: backend
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
```

- [ ] `render.yaml` created (optional)

### 4.3 — Set `NODE_ENV` guard in CORS

Your `server.js` CORS already reads `process.env.FRONTEND_URL`. In production this will be your Vercel URL. No code change needed — just set the env var correctly in Render (Section 5).

- [ ] Confirmed CORS reads `FRONTEND_URL` from environment

### 4.4 — Ensure `PORT` is dynamic

Your server already does:
```js
const PORT = process.env.PORT || 3000;
```
Render injects `PORT` automatically. No change needed.

- [ ] Confirmed `PORT` uses `process.env.PORT`

### 4.5 — Remove any hardcoded `localhost` references

Search your backend for any hardcoded `localhost` URLs that should come from env vars instead.

```bash
# Run this in the backend folder to find hardcoded localhost
grep -r "localhost" src/ --include="*.js"
```

All `localhost` references in business logic must be replaced with environment variables.

- [ ] No hardcoded localhost URLs in backend source

### 4.6 — Add `.gitignore` entries if missing

Make sure `backend/.gitignore` contains at minimum:
```
node_modules/
.env
.env.local
uploads/
```

- [ ] `.gitignore` is correct

---

## 5. Deploy Backend to Render

### 5.1 — Create the Web Service

1. Go to [https://render.com](https://render.com) → **New** → **Web Service**
2. Connect your GitHub/GitLab repository
3. Configure:

| Setting | Value |
|---|---|
| **Name** | `graphura-crm-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `npm start` |
| **Instance Type** | Free (or Starter $7/mo for no sleep) |
| **Region** | Choose closest to your users |

4. Click **Advanced** → **Add Environment Variables** and add all variables from Section 9.
5. Click **Create Web Service**.

- [ ] Web Service created on Render
- [ ] Root directory set to `backend`
- [ ] Build and start commands confirmed
- [ ] All environment variables added (see Section 9)
- [ ] First deploy triggered

### 5.2 — Watch the Deploy Logs

After clicking Create, Render runs your build. Watch the logs for:

```
📍 Registering API routes...
✅ Server running on port 10000 (production mode)
```

If you see errors, check Section 16 (Troubleshooting).

- [ ] Build log shows no errors
- [ ] Server start log shows port and production mode

### 5.3 — Copy Your Backend URL

After deploy succeeds, Render gives you a URL like:
```
https://graphura-crm-backend.onrender.com
```

Save this — you will need it in Section 7 (frontend deploy) and Section 9 (env vars).

- [ ] Backend URL noted: `https://______________________.onrender.com`

---

## 6. Frontend Code Changes Before Deploy

### 6.1 — Update `vite.config.js` for production

Your current `vite.config.js` sets up a dev proxy. In production builds (Vercel), there is no dev server — the built JS makes direct API calls using `VITE_API_URL`. The config is already correct; just confirm:

```js
// vite.config.js — already correct, no change needed
server: {
  proxy: {
    '/api': {
      target,   // only active during `vite dev`
      changeOrigin: true,
    }
  }
}
```

In production, every `axios` call must use the full backend URL. Check how your frontend calls the API.

### 6.2 — Confirm axios base URL uses `VITE_API_URL`

Find your axios instance (likely in `frontend/src/services/` or `src/utils/`). It should look like:

```js
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

export default api;
```

- [ ] Axios baseURL uses `import.meta.env.VITE_API_URL`
- [ ] `withCredentials: true` is set (needed for cookies/JWT)

### 6.3 — Do NOT commit `.env` to Git

Vercel reads env vars from its dashboard (Section 7). Your `.env` file stays local only.

- [ ] `frontend/.gitignore` includes `.env`

### 6.4 — Test the production build locally

Run this in the `frontend/` folder before pushing:

```bash
# Windows CMD
set VITE_API_URL=https://graphura-crm-backend.onrender.com/api
set VITE_BACKEND_URL=https://graphura-crm-backend.onrender.com
npm run build
```

Fix any build errors before deploying to Vercel.

- [ ] `npm run build` succeeds with zero errors locally

---

## 7. Deploy Frontend to Vercel

### 7.1 — Import Project

1. Go to [https://vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub/GitLab repository
3. Configure:

| Setting | Value |
|---|---|
| **Root Directory** | `frontend` |
| **Framework Preset** | Vite |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |
| **Install Command** | `npm install` |

### 7.2 — Add Environment Variables in Vercel

Go to **Settings** → **Environment Variables** and add:

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://graphura-crm-backend.onrender.com/api` |
| `VITE_BACKEND_URL` | `https://graphura-crm-backend.onrender.com` |

Set these for **Production**, **Preview**, and **Development** environments.

- [ ] `VITE_API_URL` added pointing to Render backend `/api`
- [ ] `VITE_BACKEND_URL` added pointing to Render backend

### 7.3 — Add `vercel.json` for SPA Routing

React Router requires all routes to fall back to `index.html`. Create `frontend/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

Without this, refreshing any page other than `/` will return a 404.

- [ ] `frontend/vercel.json` created with SPA rewrite rule

### 7.4 — Deploy

Click **Deploy**. Watch the build log. A successful build ends with:
```
✓ Build Completed in /vercel/output
```

- [ ] Vercel deploy log shows no errors
- [ ] Site is accessible at `https://your-project.vercel.app`
- [ ] Frontend URL noted: `https://______________________.vercel.app`

---

## 8. Wire Frontend ↔ Backend

After both are deployed, update the backend env vars to point to the real frontend URL.

### 8.1 — Update Render Environment Variables

Go to your Render service → **Environment** and update:

| Variable | New Value |
|---|---|
| `FRONTEND_URL` | `https://your-project.vercel.app` |
| `BACKEND_PUBLIC_URL` | `https://graphura-crm-backend.onrender.com` |

After saving, Render will automatically redeploy the backend.

- [ ] `FRONTEND_URL` updated to Vercel URL in Render
- [ ] `BACKEND_PUBLIC_URL` updated to Render URL in Render

### 8.2 — Verify CORS works

Open browser DevTools → Network tab → make a login request. You should NOT see:
```
CORS: origin not allowed
```

If you do, double check that `FRONTEND_URL` in Render exactly matches the URL shown in the browser (no trailing slash).

- [ ] No CORS errors in browser console

---

## 9. Environment Variables Reference

### Backend — Set in Render Dashboard

> ⚠️ Never put these in Git. Add them in Render → Environment.

| Variable | Description | Example |
|---|---|---|
| `NODE_ENV` | Runtime mode | `production` |
| `PORT` | Auto-injected by Render | (leave blank, Render sets it) |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://...` |
| `REDIS_URL` | Upstash or Render Redis URL | `rediss://:password@host:port` |
| `JWT_ACCESS_SECRET` | 64+ char random string | generate with `openssl rand -hex 32` |
| `JWT_SECRET` | Same as above (or separate) | generate with `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | 64+ char random string | generate with `openssl rand -hex 32` |
| `JWT_ACCESS_EXPIRES` | Access token TTL | `1h` |
| `JWT_REFRESH_EXPIRES` | Refresh token TTL | `7d` |
| `FRONTEND_URL` | Your Vercel deployment URL | `https://your-app.vercel.app` |
| `BACKEND_PUBLIC_URL` | Your Render backend URL | `https://your-backend.onrender.com` |
| `BREVO_API_KEY` | Brevo email API key | `xkeysib-...` |
| `BREVO_SENDER_EMAIL` | From address for emails | `noreply@yourdomain.com` |
| `BREVO_SENDER_NAME` | From name for emails | `Graphura CRM` |
| `FIREBASE_PROJECT_ID` | Firebase project ID | `graphura-crm` |
| `FIREBASE_PRIVATE_KEY` | Firebase private key (with `\n`) | `"-----BEGIN PRIVATE KEY-----\n..."` |
| `FIREBASE_CLIENT_EMAIL` | Firebase service account email | `firebase-adminsdk@...` |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | `your_cloud` |
| `CLOUDINARY_API_KEY` | Cloudinary API key | `123456789` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | `abc...` |
| `ENCRYPTION_KEY` | 64 hex char key for ApiConfig | generate with `openssl rand -hex 32` |
| `RAZORPAY_KEY_ID` | Razorpay key ID | `rzp_live_...` |
| `RAZORPAY_KEY_SECRET` | Razorpay key secret | `...` |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay webhook secret | `...` |

### Frontend — Set in Vercel Dashboard

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://your-backend.onrender.com/api` |
| `VITE_BACKEND_URL` | `https://your-backend.onrender.com` |

---

## 10. Post-Deploy Smoke Tests

Run these manually after the first deploy to confirm everything works end-to-end.

### Backend Health Check

Open in browser or run with curl:
```
GET https://graphura-crm-backend.onrender.com/
```
Expected response:
```json
{
  "message": "Graphura CRM API",
  "version": "1.0.0",
  "status": "Server is running"
}
```
- [ ] Health check returns 200 with correct JSON

### Authentication

- [ ] Login with a valid user account — JWT received in response
- [ ] Refresh token works
- [ ] Accessing a protected route with a valid token returns data
- [ ] Accessing a protected route without a token returns 401

### Frontend

- [ ] Home/login page loads at your Vercel URL
- [ ] Logging in redirects to the correct dashboard
- [ ] No 404 errors when refreshing any page (SPA routing working)
- [ ] No CORS errors in browser DevTools console

### Database

- [ ] Data persists between requests (reads/writes go to Atlas)
- [ ] Atlas dashboard shows incoming connections from Render IP

### Email

- [ ] Trigger any email (registration, password reset, etc.) and verify delivery

### File Uploads (Cloudinary)

- [ ] Upload a profile image or document — confirm URL is a `cloudinary.com` URL

---

## 11. Razorpay Webhook Update

Your backend verifies Razorpay webhooks using raw body bytes. In production you must register the Render URL in the Razorpay Dashboard.

### Steps

1. Log in to [https://dashboard.razorpay.com](https://dashboard.razorpay.com)
2. Go to **Settings** → **Webhooks** → **Add New Webhook**
3. Set **Webhook URL** to:
   ```
   https://graphura-crm-backend.onrender.com/api/payments/webhook
   ```
4. Set a **Webhook Secret** — copy this value.
5. Add `RAZORPAY_WEBHOOK_SECRET` to Render environment variables with this exact value.
6. Select the events you want to receive (e.g., `payment.captured`, `payment.failed`).

- [ ] Razorpay webhook URL updated to Render backend URL
- [ ] `RAZORPAY_WEBHOOK_SECRET` added in Render env vars
- [ ] Webhook test event sent and received successfully

---

## 12. Firebase FCM in Production

Firebase private keys have literal `\n` newline characters that must be preserved.

### Steps

1. Go to Firebase Console → **Project Settings** → **Service Accounts** → **Generate new private key**
2. Download the JSON file
3. In Render env vars, set `FIREBASE_PRIVATE_KEY` to the value of the `private_key` field from the JSON.
   - The value must include `\n` characters, e.g.:
     ```
     -----BEGIN PRIVATE KEY-----\nMIIEvAIB...\n-----END PRIVATE KEY-----\n
     ```
   - In Render, paste the value exactly as-is (with literal `\n`). Render preserves multi-line values.

- [ ] Firebase service account JSON downloaded
- [ ] `FIREBASE_PRIVATE_KEY` added to Render env vars with correct `\n` newlines
- [ ] `FIREBASE_PROJECT_ID` and `FIREBASE_CLIENT_EMAIL` set in Render

---

## 13. Cloudinary in Production

1. Log in to [https://cloudinary.com](https://cloudinary.com)
2. Dashboard shows **Cloud Name**, **API Key**, **API Secret**
3. Add all three to Render env vars.
4. Optionally create a dedicated **Upload Preset** for production and restrict unsigned uploads.

- [ ] Cloudinary credentials added to Render
- [ ] Test file upload works after deploy

---

## 14. Custom Domain (Optional)

### Backend on Render

1. Render dashboard → your service → **Settings** → **Custom Domains**
2. Add `api.yourdomain.com`
3. Create a CNAME record in your DNS: `api` → `graphura-crm-backend.onrender.com`
4. Render provisions a free SSL certificate automatically.

### Frontend on Vercel

1. Vercel dashboard → your project → **Settings** → **Domains**
2. Add `yourdomain.com` or `app.yourdomain.com`
3. Create a CNAME record in your DNS: `app` → `cname.vercel-dns.com`
4. Vercel provisions SSL automatically.

### After Adding Domains

Update these env vars everywhere:

- Render: `FRONTEND_URL` → `https://yourdomain.com`, `BACKEND_PUBLIC_URL` → `https://api.yourdomain.com`
- Vercel: `VITE_API_URL` → `https://api.yourdomain.com/api`, `VITE_BACKEND_URL` → `https://api.yourdomain.com`
- Razorpay: webhook URL → `https://api.yourdomain.com/api/payments/webhook`

- [ ] DNS records created
- [ ] SSL certificates provisioned (automatic)
- [ ] All env vars updated with new domain URLs

---

## 15. Ongoing Maintenance

### Redeploying

- **Backend:** Push to the connected Git branch → Render auto-deploys.
- **Frontend:** Push to the connected Git branch → Vercel auto-deploys.

### Checking Logs

- **Render logs:** Dashboard → your service → **Logs** tab (live streaming)
- **Vercel logs:** Dashboard → your project → **Functions** → **Logs** (for API routes) or **Deployments** for build logs

### Rotating Secrets

When rotating JWT secrets or API keys:
1. Add the new value in Render env vars
2. Trigger a manual redeploy
3. All existing sessions using the old secret will be invalidated — users will need to log in again

### Database Backups (MongoDB Atlas)

- Atlas M0 (free) does not include automated backups. Upgrade to M10+ for continuous backups.
- Or run a manual `mongodump` periodically from your local machine.

### Free Tier Limitations

| Service | Free Tier Limit | Impact |
|---|---|---|
| Render Free | Spins down after 15 min inactivity | First request after sleep takes ~30s |
| MongoDB Atlas M0 | 512 MB storage | Fine for development/small production |
| Upstash Redis | 10,000 commands/day | Fine for rate limiting |
| Vercel Free | 100 GB bandwidth/month | Fine for most apps |

To avoid Render cold starts, upgrade to **Starter ($7/mo)** which keeps the service always-on.

---

## 16. Troubleshooting

### Backend build fails on Render

**Symptom:** `npm install` fails in build logs.  
**Fix:** Check that `package.json` in `backend/` is valid JSON. Also confirm Root Directory is set to `backend` in Render.

### `CORS: origin not allowed` in browser

**Symptom:** API calls fail with CORS error.  
**Fix:** Go to Render → Environment → verify `FRONTEND_URL` exactly matches the URL in your browser address bar (including `https://`, no trailing slash).

### `MongoServerError: Authentication failed`

**Symptom:** Server logs show MongoDB auth error on startup.  
**Fix:** Re-check `MONGODB_URI` in Render env vars. Ensure the password does not contain unescaped special characters (encode `@`, `#`, etc. as `%40`, `%23`).

### Vercel shows blank page or 404 on refresh

**Symptom:** Navigating directly to a URL like `/dashboard` returns 404.  
**Fix:** Confirm `frontend/vercel.json` exists with the rewrite rule from Section 7.3.

### Razorpay webhook signature mismatch

**Symptom:** Webhook endpoint returns 400 with signature error.  
**Fix:** Ensure `RAZORPAY_WEBHOOK_SECRET` in Render exactly matches the secret you set in the Razorpay dashboard. Also confirm the webhook route receives raw bytes (already handled in `server.js`).

### Firebase private key errors

**Symptom:** `Error: DECODER routines::unsupported` or similar.  
**Fix:** The private key must have real newlines OR literal `\n`. In Render, paste the key value as a single line with `\n`. Do not add extra escaping.

### Redis connection refused

**Symptom:** `Error: connect ECONNREFUSED 127.0.0.1:6379`  
**Fix:** Render does not have a local Redis. Ensure `REDIS_URL` is set to your Upstash or Render Redis URL, not `redis://localhost:6379`.

### Render free tier cold start

**Symptom:** First API request after idle period takes 30+ seconds.  
**Fix:** Either upgrade Render to Starter tier, or use a cron service (cron-job.org) to ping your health endpoint every 14 minutes to keep it warm.

---

## Deployment Status Tracker

Use this table to track deployment progress with your team.

| Step | Task | Owner | Status | Notes |
|---|---|---|---|---|
| 2 | MongoDB Atlas cluster created | | ⬜ | |
| 2 | Atlas network access opened | | ⬜ | |
| 3 | Upstash Redis created | | ⬜ | |
| 4 | Backend code reviewed | | ⬜ | |
| 5 | Render Web Service created | | ⬜ | |
| 5 | Backend env vars added in Render | | ⬜ | |
| 5 | Backend first deploy success | | ⬜ | |
| 6 | Frontend build passes locally | | ⬜ | |
| 6 | `vercel.json` added | | ⬜ | |
| 7 | Vercel project created | | ⬜ | |
| 7 | Frontend env vars added in Vercel | | ⬜ | |
| 7 | Frontend first deploy success | | ⬜ | |
| 8 | `FRONTEND_URL` updated in Render | | ⬜ | |
| 8 | CORS tested — no errors | | ⬜ | |
| 10 | Health check passes | | ⬜ | |
| 10 | Login / auth flow tested | | ⬜ | |
| 11 | Razorpay webhook URL updated | | ⬜ | |
| 12 | Firebase FCM key added | | ⬜ | |
| 13 | Cloudinary credentials added | | ⬜ | |
| 14 | Custom domain configured (optional) | | ⬜ | |

Legend: ⬜ Pending · 🔄 In Progress · ✅ Done · ❌ Blocked

---

*Last updated: June 2026 · Graphura CRM v1.0.0*
