# Stackbird Deployment Guide - Railway

## Prerequisites
- GitHub repository: https://github.com/kalyank1144/stackbird
- Supabase database created and schema deployed
- Railway account (sign up at https://railway.app)

## Step 1: Create Railway Project

1. Go to https://railway.app
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Authorize Railway to access your GitHub
5. Select the **`kalyank1144/stackbird`** repository
6. Click **"Deploy Now"**

## Step 2: Configure Environment Variables

In Railway dashboard, go to **Variables** tab and add these:

### Required Environment Variables

```bash
# Database
DATABASE_URL=postgresql://postgres:Alivenizazu2019%40@db.yziemmoclqtcifbjvkwh.supabase.co:5432/postgres

# JWT Secret (generate a random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OAuth (Manus Platform)
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://login.manus.im
VITE_APP_ID=your-manus-app-id
OWNER_OPEN_ID=your-owner-openid
OWNER_NAME=Your Name

# App Configuration
VITE_APP_TITLE=Stackbird
VITE_APP_LOGO=https://your-logo-url.com/logo.png

# AI API Keys
ANTHROPIC_API_KEY=your-anthropic-api-key
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# Manus Built-in APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=your-manus-api-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-frontend-api-key

# Analytics (Optional)
VITE_ANALYTICS_ENDPOINT=https://your-analytics-endpoint
VITE_ANALYTICS_WEBSITE_ID=your-website-id

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key
STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=whsec_your-webhook-secret
STRIPE_PRICE_ID_MONTHLY=price_your-monthly-price-id
STRIPE_PRICE_ID_YEARLY=price_your-yearly-price-id
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your-stripe-publishable-key
```

## Step 3: Deploy

1. Railway will automatically build and deploy
2. Wait for deployment to complete (5-10 minutes)
3. Click **"Generate Domain"** to get your public URL
4. Visit the URL to see your deployed app!

## Step 4: Post-Deployment

### Update OAuth Redirect URLs
1. Go to your Manus OAuth app settings
2. Add Railway domain to allowed redirect URLs:
   - `https://your-app.railway.app/api/oauth/callback`

### Test the Deployment
1. Visit your Railway URL
2. Try logging in
3. Create a test project
4. Generate some code with AI

## Troubleshooting

### Build Fails
- Check Railway logs for errors
- Ensure all environment variables are set
- Verify DATABASE_URL is correct

### App Crashes
- Check Runtime logs in Railway
- Verify database connection
- Ensure all required API keys are set

### Database Connection Issues
- Make sure DATABASE_URL password is URL-encoded (`@` becomes `%40`)
- Verify Supabase project is running
- Check if IP is allowed in Supabase (Railway IPs change, use connection pooler)

## Scaling

Railway auto-scales based on usage:
- **CPU**: Scales up automatically
- **Memory**: Adjust in Railway settings if needed
- **Replicas**: Enable in Railway for high availability

## Cost Estimation

- **Starter**: $5/month (500 hours, 512MB RAM)
- **Pro**: $20/month (unlimited hours, 8GB RAM)
- **Team**: Custom pricing for high traffic

## Support

- Railway Docs: https://docs.railway.app
- Stackbird GitHub: https://github.com/kalyank1144/stackbird
