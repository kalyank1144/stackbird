# Railway Deployment Setup

## Required Environment Variables

Add these environment variables in Railway dashboard (Settings → Variables):

### Database Connection
```
DATABASE_URL=mysql://your-connection-string
```

### Node.js Configuration (IMPORTANT!)
```
NODE_OPTIONS=--dns-result-order=ipv4first
```
**Why?** Railway's network doesn't support IPv6 connections to external databases. This forces Node.js to use IPv4 addresses when resolving DNS, preventing `ENETUNREACH` errors.

### Authentication
```
JWT_SECRET=your-secret-key-here
```

### AI API Keys (at least one required)
```
ANTHROPIC_API_KEY=your-anthropic-key
OPENAI_API_KEY=your-openai-key
GEMINI_API_KEY=your-gemini-key
```

## Deployment Steps

1. **Connect GitHub Repository**
   - Go to Railway dashboard
   - Click "New Project" → "Deploy from GitHub repo"
   - Select `stackbird` repository
   - Railway will auto-detect the build configuration

2. **Add Environment Variables**
   - Go to project Settings → Variables
   - Add all variables listed above
   - **Important:** Add `NODE_OPTIONS=--dns-result-order=ipv4first` to fix database connection

3. **Configure Networking**
   - Go to Settings → Networking
   - Click "Generate Domain"
   - Enter port: `3000`
   - Railway will provide a public URL like `stackbird-production.up.railway.app`

4. **Verify Deployment**
   - Check Deploy logs for errors
   - Look for: `[Seed] Guest user initialized successfully`
   - Visit your Railway URL
   - Create a test project

## Troubleshooting

### Database Connection Errors
- Error: `ENETUNREACH` or `Client network socket disconnected`
- **Fix:** Add `NODE_OPTIONS=--dns-result-order=ipv4first` environment variable

### Guest User Not Found
- Error: `Failed query: select * from users where userId = ?`
- **Fix:** The seed script should run automatically during build. Check Deploy logs for `[Seed] Guest user initialized`

### Build Failures
- Check that all required environment variables are set
- Verify `DATABASE_URL` is correct and accessible from Railway
- Check Deploy logs for specific error messages

## Local Development

For local development, you don't need `NODE_OPTIONS` since your network likely supports both IPv4 and IPv6. Just set:

```bash
DATABASE_URL=your-local-or-cloud-database-url
JWT_SECRET=local-secret
ANTHROPIC_API_KEY=your-key
```

Run:
```bash
pnpm install
pnpm dev
```
