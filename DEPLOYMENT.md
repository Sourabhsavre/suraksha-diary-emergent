# Deployment

This repo now includes containerized deployment for the frontend and backend.

## Local production-style run

1. Create a backend env file from the template:

   ```bash
   cp backend/.env.example backend/.env
   ```

2. Fill in `backend/.env` with your real values.

3. Start the stack:

   ```bash
   ./scripts/start.sh
   ```

   Or, if you prefer the raw compose command:

   ```bash
   docker compose up --build
   ```

4. Open:

   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000/api/

## Required env values

- `MONGO_URL`
- `DB_NAME`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `CORS_ORIGINS`
- `AUTH_SESSION_DATA_URL` if you want to override the default Google auth session endpoint
- `REACT_APP_GOOGLE_AUTH_URL` for the frontend if you want a custom Google auth host

## Notes

- The frontend is served through nginx and proxies `/api/` to the backend container.
- The SPA uses same-origin API access by default, so it works cleanly behind a reverse proxy.
- Sevadar reporting remains login-free; only office/admin login uses email/password or Google.
- Google login still needs an external identity provider. That part cannot be fully self-hosted while keeping actual Google sign-in.

## One-command controls

- Start: `./scripts/start.sh`
- Stop: `./scripts/stop.sh`

## VPS checklist

1. Install Docker and Docker Compose plugin.
2. Point your domain to the server.
3. Copy `backend/.env.example` to `backend/.env` and fill secrets.
4. Set `REACT_APP_GOOGLE_AUTH_URL` in your shell or compose environment if you use a custom auth host.
5. Run `./scripts/start.sh`.
6. Put nginx or a load balancer in front if you want TLS termination on 443.
7. Use only HTTPS in production because admin sessions and login flows should not be exposed over plain HTTP.

## GitHub Student Pack Route

If you want to deploy with a custom domain using your GitHub Student Developer Pack, the cleanest setup is:

1. Push this repo to GitHub.
2. Create a backend service from `backend/` using the backend Dockerfile.
3. Create a frontend service from `frontend/` using the frontend Dockerfile.
4. Set the frontend build env `REACT_APP_BACKEND_URL` to your backend public URL, for example `https://api.your-domain.com`.
5. Set the frontend build env `REACT_APP_GOOGLE_AUTH_URL` if you use a custom Google auth host.
6. Set backend secrets in the backend service:
   - `MONGO_URL`
   - `DB_NAME`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `CORS_ORIGINS` to include your frontend domain
7. Map your custom domain:
   - `www.your-domain.com` or `your-domain.com` -> frontend service
   - `api.your-domain.com` -> backend service
8. On the DNS provider, add the records the hosting provider gives you, then wait for SSL to issue.

### Why this split works

- Sevadar reporting stays simple and public.
- Office/admin login remains protected.
- The browser talks to the backend through a stable `api.` subdomain, which is easier to secure with HTTPS and CORS.
- The GitHub repo stays the source of truth, so you can redeploy from the same branch.

### Important limitation

Google sign-in itself cannot be self-hosted; it still depends on an external Google identity endpoint. That is normal and does not block domain deployment.