# Minimal Railway Environment Variables (No Auth Version)

## Required Environment Variables

Add these to Railway → Variables tab:

```bash
# Database
DATABASE_URL=postgresql://postgres:Alivenizazu2019%40@db.yziemmoclqtcifbjvkwh.supabase.co:5432/postgres

# JWT Secret (for future use)
JWT_SECRET=stackbird-super-secret-jwt-key-2024

# Node Environment
NODE_ENV=production

# AI API Keys (add at least ONE to enable code generation)
ANTHROPIC_API_KEY=your-anthropic-api-key-here
# OR
OPENAI_API_KEY=your-openai-api-key-here
# OR
GEMINI_API_KEY=your-gemini-api-key-here
```

## Optional (for full features)

```bash
# If you want to use Manus unified API instead of individual AI keys:
BUILT_IN_FORGE_API_KEY=your-manus-api-key
BUILT_IN_FORGE_API_URL=https://api.manus.im
VITE_FRONTEND_FORGE_API_KEY=your-manus-frontend-key
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im
```

## What Works Without Auth

✅ **All features work!**
- Create projects
- Generate code with AI
- Edit files
- View live preview
- Push to GitHub
- Everything accessible without login

## What's Different

- No user login/signup
- Everyone uses "Guest User" account
- All projects are shared (single user mode)
- Perfect for personal use or testing

## Adding Auth Later

When ready to add authentication:
1. Set up Supabase Auth
2. Update `server/_core/context.ts` to use real auth
3. Add login/signup pages
4. Update environment variables with OAuth credentials
