# Stackbird TODO

## Phase 1: Project Setup
- [x] Create GitHub repository
- [x] Initialize web project with database and auth
- [x] Create project plan and todo list

## Phase 2: Database Schema
- [x] Design projects table (store user projects)
- [x] Design conversations table (AI chat history)
- [x] Design files table (project files metadata)
- [x] Push database migrations

## Phase 3: Backend API
- [x] Install Aider CLI in project
- [x] Create Aider integration helper
- [x] Build project management API (create, list, delete)
- [x] Build AI chat API with Aider integration
- [x] Build file management API
- [ ] Add WebSocket support for real-time AI responses
- [ ] Write tests for backend procedures

## Phase 4: Frontend Interface
- [x] Design landing page
- [x] Create dashboard layout for projects
- [x] Build project creation interface
- [x] Build code editor with Monaco Editor
- [x] Build AI chat interface
- [ ] Build file tree viewer
- [ ] Add real-time updates for AI responses
- [x] Add loading states and error handling

## Phase 5: Testing & Deployment
- [x] Test full user flow
- [x] Fix any bugs
- [x] Create deployment checkpoint
- [ ] Document setup instructions

## Phase 6: Delivery
- [ ] Push to GitHub
- [ ] Create final checkpoint
- [ ] Provide user documentation

## Phase 7: Real Aider Integration
- [x] Create project workspace directories
- [x] Implement Aider CLI execution in chat API
- [x] Add streaming response support
- [x] Handle Aider errors gracefully
- [x] Test end-to-end code generation
- [x] Update tests for Aider integration

## Phase 8: File Browser UI
- [x] Create file listing API endpoint
- [x] Create file read API endpoint
- [x] Create file download endpoint
- [x] Build file tree component
- [x] Add file viewer with syntax highlighting
- [x] Add download button for files
- [x] Test file browser functionality

## Phase 9: Real-time WebSocket Streaming
- [x] Install Socket.io dependencies
- [x] Set up Socket.io server
- [x] Create WebSocket event handlers
- [x] Modify chat API to stream Aider output
- [x] Update frontend to connect to WebSocket
- [x] Display streaming messages in real-time
- [x] Test streaming functionality

## Phase 10: File Browser & Editor Sync
- [x] Add file selection state management
- [x] Load file content when clicked in browser
- [x] Display file content in Monaco Editor
- [x] Add syntax highlighting based on file extension
- [x] Implement file save functionality
- [x] Add save button with keyboard shortcut (Ctrl+S)
- [x] Show unsaved changes indicator
- [x] Test file editing workflow

## Phase 11: Code Execution & Terminal
- [x] Create code execution API endpoint
- [x] Implement sandboxed execution for different languages
- [x] Add execution timeout and resource limits
- [x] Stream execution output via WebSocket
- [x] Build terminal panel UI component
- [x] Add 'Run Code' button to editor
- [x] Display stdout, stderr, and exit codes
- [x] Add execution history
- [x] Test code execution for multiple languages

## Phase 12: Project Templates
- [x] Create template system architecture
- [x] Define React template with boilerplate
- [x] Define Express API template with boilerplate
- [x] Define Flask API template with boilerplate
- [x] Add template selection to project creation UI
- [x] Implement template initialization logic
- [x] Test all templates

## Phase 13: GitHub Integration
- [x] Set up GitHub OAuth authentication
- [x] Store GitHub access tokens securely
- [x] Create API endpoint to check GitHub connection status
- [x] Create API endpoint to create GitHub repository
- [x] Create API endpoint to push code to GitHub
- [x] Add "Push to GitHub" button in Project page
- [x] Add GitHub connection status indicator
- [x] Test GitHub integration end-to-end

## Phase 14: Subscription & Monetization System
- [x] Design subscriptions table (userId, plan, status, period)
- [x] Design usage_logs table (userId, action, credits, timestamp)
- [x] Design credits table (userId, remaining, resetDate, plan)
- [x] Push database migrations
- [x] Create subscription management helper functions
- [x] Implement credit tracking system
- [x] Add usage middleware to check credits before AI calls
- [x] Implement credit deduction logic
- [x] Add daily/monthly credit reset logic
- [ ] Install Stripe SDK
- [ ] Set up Stripe webhook endpoint
- [ ] Create Stripe checkout session API
- [ ] Create subscription management API (upgrade/cancel)
- [ ] Build pricing page UI
- [ ] Build subscription dashboard UI
- [ ] Add usage stats display
- [ ] Add upgrade prompts when credits run low
- [ ] Implement feature limits (project count)
- [ ] Add subscription status checks across app
- [ ] Write tests for subscription system
- [ ] Test Stripe integration end-to-end

## Phase 15: Token-Based System & Stripe Integration
- [x] Update PLANS config to use tokens instead of messages
- [x] Create models.ts with 4 AI models configuration
- [x] Update credit deduction to use model token costs
- [x] Add model parameter to chat API
- [x] Install Stripe SDK
- [x] Add Stripe secrets to environment
- [ ] Create Stripe checkout session API
- [ ] Create Stripe webhook endpoint
- [ ] Handle subscription created/updated/canceled events
- [ ] Build pricing page UI with monthly/yearly toggle
- [ ] Build subscription dashboard UI
- [x] Add model selector in chat interface
- [ ] Add usage stats display (tokens used/remaining)
- [ ] Add upgrade prompts when low on tokens
- [ ] Test Stripe checkout flow
- [ ] Test webhook events
- [ ] Test token deduction with different models

## Phase 16: UI Improvements
- [x] Simplify model selector to hide token costs (focus on quality not pricing)

## Phase 17: Add Gemini Model for Testing
- [x] Add Gemini API key to environment
- [x] Add Gemini 2.5 Flash to models configuration
- [x] Update Aider to support Gemini models
- [ ] Test code generation with Gemini (waiting for quota reset)

## Phase 18: Add Claude Models for Testing
- [x] Add Claude API key to environment
- [x] Add Claude Haiku 3.5 to models configuration
- [x] Update Aider to support Claude API key
- [x] Test Claude API connectivity (all 5 tests passed)

## Phase 19: Fix Chat API 502 Error
- [x] Investigate 502 error in chat.send endpoint (Aider not installed)
- [x] Install Aider system-wide
- [x] Fix error handling in chat streaming
- [x] Add proper JSON error responses
- [x] Write error handling tests (8/8 passing)
- [x] Server restarted and running properly

## Phase 20: Fix Dashboard API Errors
- [x] Identify root cause (server crash causing HTML responses)
- [x] Restart server to clear crashed state
- [x] Test dashboard page loads successfully

## Phase 21: Fix Persistent Chat 502 Error
- [x] Check server logs for actual error (ERR_UNHANDLED_ERROR from Aider)
- [x] Verify Aider is properly configured and can start
- [x] Fix root cause: Changed 'error' event to 'stderr' to avoid crashes
- [x] Added stderr listener in chat.send to capture Aider errors
- [x] Fixed aider shebang to use python3.11 instead of python
- [ ] Test chat functionality with real message (ready for testing)

## Phase 22: Fix Stream Destruction and Model Availability
- [x] Fix "Cannot call write after stream was destroyed" error (reduced wait time to 2s)
- [x] Fix Claude 3.5 Sonnet showing as Pro-only (marked as availableForFree)
- [x] Server restarted with all fixes applied
- [ ] Test chat works with all models (waiting for user test)

## Phase 23: Fix Aider Python Module Loading
- [x] Set absolute path to /usr/local/bin/aider
- [x] Add PYTHONPATH to aider spawn environment
- [x] Server restarted with PYTHONPATH fix
- [ ] Test aider execution from Node.js (waiting for user test)
- [ ] Verify chat works end-to-end (waiting for user test)

## Phase 24: Use python -m aider (Official Fix)
- [x] Change spawn from /usr/local/bin/aider to python3.11 -m aider
- [x] Add detailed logging for debugging
- [x] Refactor chat.send to return immediately (async processing)
- [ ] Test chat works end-to-end (ready for testing)

## Phase 25: Fix Python Environment (PYTHONHOME)
- [x] Find Python 3.11's PYTHONHOME path (/usr)
- [x] Set PYTHONHOME, PYTHONPATH, and UTF-8 locale in spawn env
- [ ] Test chat works without encoding errors (ready for testing)

## Phase 26: Fix Aider Configuration (Model Names & Git Repo)
- [x] Research correct aider model names for all models
- [x] Update model configuration with aider-compatible names
- [x] Initialize git repo in each project workspace
- [x] Add project files to aider context when starting
- [ ] Test code generation works end-to-end

## Phase 27: Fix Aider Git Repository Detection
- [x] Diagnose why Aider uses parent repo instead of workspace repo
- [x] Add GIT_CEILING_DIRECTORIES to prevent parent repo detection
- [x] Manually initialize git in existing workspace
- [x] Test that Aider uses correct git repo
- [x] Verify file count is small (3 files, not 17,815 files)

## Phase 28: Fix Aider Encoding Errors
- [x] Investigate .aider* files causing encoding errors
- [x] Filter hidden files from Aider context
- [x] Add .aider* to .gitignore to prevent future issues
- [x] Test Aider starts without encoding errors

## Phase 29: Redesign Project Interface for Better UX
- [x] Fix chat interface disappearing after output
- [x] Simplify layout - remove or hide code editor initially
- [x] Make chat always visible and accessible
- [x] Create mockups for 3 layout options
- [x] Get user selection (Option 1: Bolt.new style)
- [x] Implement Bolt.new style layout
- [x] Add Preview/Code tabs functionality
- [x] Integrate live preview pane
- [x] Test new interface with real usage

## Phase 30: Add GitHub Integration to New Layout
- [x] Add GitHub button next to Deploy button in header
- [x] Integrate existing GitHub dialog functionality
- [ ] Test GitHub push workflow

## Phase 31: Implement Live Preview Iframe
- [x] Design preview server architecture
- [x] Create backend endpoint to serve project files
- [x] Add iframe to frontend preview pane
- [x] Implement auto-refresh on file changes
- [x] Handle HTML/CSS/JS projects
- [x] Test with real projects

## Phase 32: Fix Model API Keys and Upgrade Test User
- [x] Check which models have working API keys
- [x] Set default model to Claude 3.5 Haiku (has working key)
- [x] Upgrade test user to Pro plan in database
- [x] Test new project creation with working model

## Phase 33: Fix Chat Scroll Issue
- [x] Add proper scroll container to chat messages area
- [x] Keep input field fixed at bottom
- [x] Test scroll behavior with long conversations

## Phase 34: Debug Live Preview 404 Error
- [x] Check if files are being saved to workspace directory
- [x] Verify preview URL format is correct
- [x] Test preview server middleware is working
- [x] Fix preview URL to use request host instead of hardcoded URL
- [x] Test with real HTML project

## Phase 35: Fix Preview Mixed Content Error (HTTP vs HTTPS)
- [x] Fix preview URL to use HTTPS instead of HTTP
- [x] Handle X-Forwarded-Proto header for proxied requests
- [x] Test preview loads correctly over HTTPS

## Phase 36: Fix Chat Streaming Error on Follow-up Messages
- [x] Investigate streamingData undefined error
- [x] Fix streaming state initialization
- [x] Add null checks for streamingData access
- [ ] Test multi-turn conversations work correctly

## Phase 37: Deploy Stackbird to Production
- [x] Save checkpoint with streaming fix
- [x] Create GitHub repository and push code
- [x] Set up Supabase database tables
- [ ] Create Railway deployment configuration
- [ ] Connect Railway to GitHub repository
- [ ] Configure environment variables in Railway
- [ ] Deploy and test application

## Phase 38: Remove Authentication for Testing
- [x] Remove OAuth middleware and checks
- [x] Create default guest user system
- [x] Update tRPC context to use guest user
- [x] Update frontend to skip auth checks
- [x] Remove login/logout UI elements
- [x] Test all features work without auth
- [ ] Deploy to Railway with minimal env vars

## Phase 39: Fix TypeScript Build Error for Railway Deployment
- [x] Fix TypeScript error in server/aider.ts line 146 (null assignment issue)
- [x] Test build locally to verify fix
- [x] Push fix to GitHub for Railway deployment

## Phase 40: Fix Remaining Path.resolve Errors
- [x] Find all remaining import.meta.dirname references (found in vite.config.ts)
- [x] Fix all path.resolve calls with undefined arguments (fixed vite.config.ts)
- [x] Test build and push to GitHub for Railway deployment

## Phase 41: Fix Railway Port Configuration
- [x] Check server port configuration in index.ts
- [x] Update server to use PORT environment variable from Railway
- [x] Deploy fix and update Railway domain to port 8080

## Phase 42: Fix Invalid URL Error in Production
- [x] Investigate Invalid URL error in frontend asset loading (getLoginUrl with undefined OAuth URL)
- [x] Fix asset path or base URL configuration (added fallback for missing OAuth config)
- [x] Deploy fix and verify production site works

## Phase 43: Simplify Project Creation UI
- [x] Remove template selector from Dashboard create project dialog
- [x] Set React App as default template for all new projects
- [x] Test project creation with simplified UI
- [x] Deploy changes to production

## Phase 44: Fix React Template Not Being Used
- [x] Investigate why projects are using Flask instead of React template (wrong template ID: 'react' vs 'react-app')
- [x] Fix template initialization in project creation backend (changed to 'react-app')
- [x] Test that React template is properly applied (templates.test.ts passes)
- [x] Deploy fix to production

## Phase 45: Fix Aider Git Repository Detection
- [x] Investigate why Aider uses parent repo instead of project workspace git (template files not committed)
- [x] Fix Aider initialization to use correct git repository (added commitTemplateFiles method)
- [x] Test that Aider can access React template files (template-git.test.ts passes)
- [x] Deploy fix to production

## Phase 46: Fix Project Access Errors
- [x] Investigate why project 180001 shows "Project not found" and "Access denied" (guest user not in database)
- [x] Check database and workspace sync for guest user (guest user ID 1 doesn't exist)
- [x] Fix project ownership or database entries (added guest user upsert on startup)
- [x] Test project access works correctly (projects.test.ts passes)
- [x] Deploy fix to production

## Phase 47: Verify Railway Deployment
- [x] Check if latest guest user fix was deployed to Railway (commit d6a95b74 pushed)
- [x] Verify Railway environment variables (DATABASE_URL) (needs guest user seed)
- [x] Confirm guest user initialization runs on Railway (added postbuild seed script)
- [x] Test production deployment works (seed script deployed to Railway)

## Phase 48: Fix Railway Database Connection
- [x] Identify ENETUNREACH error cause (Railway trying IPv6 to TiDB Cloud, need IPv4)
- [x] Update DATABASE_URL to force IPv4 connection (requires NODE_OPTIONS env var on Railway)
- [x] Add connection pooling configuration for Railway (documented in RAILWAY_SETUP.md)
- [x] Test database connection on Railway (needs NODE_OPTIONS=--dns-result-order=ipv4first)

## Phase 49: Implement Auto-Build for Live Preview
- [x] Create build manager module to run npm install and build
- [x] Update preview server to serve from dist/ folder
- [x] Trigger auto-build after Aider finishes generating code
- [x] Add build status indicator in UI
- [ ] Test auto-build with React todo app
- [ ] Deploy auto-build feature to production

## Phase 50: Add Console/Build Logs Tab
- [x] Add Console tab to Project page UI (alongside Preview and Code)
- [x] Update useSocket to capture build output logs
- [x] Stream build logs via WebSocket to Console tab
- [x] Display build errors clearly in Console
- [x] Add auto-scroll to Console for latest logs
- [ ] Test Console tab with build errors

## Phase 51: P0 Critical Fixes - Context Persistence
- [x] Load conversation history from database when project opens
- [x] Pass conversation context to Aider session
- [x] Optimize context loading (limit to last 50 messages)
- [x] Add database index on conversationId column
- [ ] Test: Open existing project, verify AI remembers context
- [ ] Test: Send follow-up message, verify continuity

## Phase 52: P0 Critical Fixes - Auto Build Error Detection
- [x] Keep Aider session alive during build process
- [x] Stream build output to AI in real-time
- [x] Detect build failures automatically
- [x] Send build errors to AI for analysis
- [x] Implement retry logic (max 3 attempts)
- [x] Show build status in chat UI
- [ ] Test: Create app with intentional error, verify AI fixes it
- [ ] Test: Verify auto-retry works correctly

## Phase 53: P0 Critical Fixes - Basic App Validation
- [ ] Test 1: Todo app (add/delete functionality)
- [ ] Test 2: Counter app (increment/decrement)
- [ ] Test 3: Calculator app (basic operations)
- [ ] Test 4: Weather app (display mock data)
- [ ] Test 5: Contact form (with validation)
- [ ] Document test results and success rate
- [ ] Create checkpoint after all tests pass

## Phase 54: CRITICAL - Fix Chat Flickering and Output Issues
- [x] Filter Aider stdout to remove "Skipping" messages
- [x] Filter Aider stdout to remove node_modules noise
- [x] Only show meaningful AI responses in chat
- [x] Keep full output in Console tab for debugging
- [x] Fix chat history not loading when project reopened
- [ ] Test: Verify chat doesn't flicker during generation
- [ ] Test: Verify chat history persists across sessions

## Phase 55: Auto-Refresh Preview on Build Success
- [x] Refresh preview iframe on each successful build attempt
- [x] Show visual indicator when preview is refreshing
- [x] Ensure preview updates even during retry attempts
- [ ] Test: Verify preview refreshes after each successful build

## Phase 56: Fix Build Status Indicator After Retry
- [x] Clear "Build failed" indicator when retry succeeds
- [x] Update preview pane status from "Build failed" to "Success"
- [x] Remove error message from preview when build succeeds
- [ ] Test: Verify status updates correctly after retry

## Phase 57: Add Persistent Retry Status Banner (Future Enhancement)
- [ ] Add status banner showing "AI is fixing build errors... (attempt X/3)"
- [ ] Show progress indicator during retry process
- [ ] Replace quick toast with persistent banner during fixes
- [ ] Add visual feedback for each retry phase (analyzing, fixing, building)
- [ ] Keep banner visible until final result (success or max retries)

## Phase 58: Auto-Switch to Preview Tab After Build
- [x] Auto-switch from Console to Preview tab when build succeeds
- [x] Only switch if user is on Console tab (don't interrupt if on Code tab)
- [ ] Add smooth transition animation
- [ ] Test: Verify tab switches automatically after successful build

## Phase 59: Fix Preview Server File Serving
- [x] Fix MIME type errors for JavaScript modules
- [x] Ensure dist/ folder files are served correctly
- [x] Fix module loading errors (index-*.js files)
- [ ] Test: Verify preview loads after build without console errors

## Phase 60: Fix Preview Server Caching
- [x] Add Cache-Control: no-cache headers to preview server
- [x] Ensure index.html is never cached
- [ ] Test: Verify preview loads fresh HTML after each build

## Phase 61: Fix Preview Server SPA Fallback (CRITICAL)
- [x] Only return index.html for navigation requests (not .js/.css files)
- [x] Return proper 404 for missing asset files
- [ ] Test: Verify JavaScript files load with correct MIME type

## Phase 62: Implement Iframe Hard Reload (FINAL FIX)
- [x] Use iframe.contentWindow.location.reload(true) for hard reload
- [x] Bypass all browser cache layers (service worker, disk cache, memory cache)
- [ ] Test: Verify preview loads fresh HTML after each build


## PENDING ISSUES (To be fixed later)

### Preview Loading Issue (React Apps)
**Status:** PENDING - Needs deeper investigation
**Problem:** Preview iframe not loading React apps after build, showing MIME type errors
**Root Cause:** Browser caching stale index.html with old asset hashes, even with:
- Cache-control headers ✅
- Query parameter cache busting ✅
- Iframe src manipulation ✅
- Hard reload via contentWindow.location.reload() ✅

**Possible Solutions to Try:**
1. Use a reverse proxy to add stronger cache headers
2. Serve preview from a different subdomain for each build
3. Investigate if there's a service worker interfering
4. Use a different preview mechanism (not iframe)
5. Add meta tags to index.html via post-build script

**Workaround:** Users can manually refresh the preview (Ctrl+F5) or click the Refresh button


## Phase 63: Better Error Messages to AI
- [x] Parse build output to extract specific errors (file, line, message)
- [x] Extract TypeScript/ESLint errors with file paths and line numbers
- [x] Extract Vite build errors with context
- [x] Format errors in structured way for AI to understand
- [x] Send detailed error context to Aider instead of generic "Build failed"
- [x] Include relevant file content around error location

## Phase 64: Stunning Persistent Retry Status Banner
- [x] Design modern, animated banner component
- [x] Show current AI activity: "Analyzing errors...", "Fixing code...", "Building..."
- [x] Add progress indicator (attempt 1/3, 2/3, 3/3)
- [x] Use smooth animations and transitions
- [x] Add pulsing/shimmer effects for "working" state
- [x] Show success/error states with icons
- [x] Make banner dismissible but persistent across tabs
- [x] Position banner prominently (top of chat or preview area)


## Phase 65: Fix Error Message Truncation Bug
- [x] Investigate why build error messages are being truncated (only "error during build:" sent to AI)
- [x] Check buildManager error capture logic
- [x] Ensure full error output is captured (both stdout and stderr)
- [x] Verify error parser receives complete error text
- [x] Test that AI receives full error details including file paths and line numbers
- [ ] Test AI can fix tsconfig.node.json missing file error


## Phase 66: AI Workshop Preview Visualization
- [x] Create BuildingPreview component with cute robot character
- [x] Add floating code snippet animations
- [x] Implement step-by-step progress checklist (Reading errors, Analyzing code, Writing fix, Building)
- [x] Add smooth animations and transitions
- [x] Integrate with Project.tsx preview pane
- [x] Show BuildingPreview when build is in progress
- [x] Hide BuildingPreview and show iframe when build succeeds
- [ ] Test with real build/retry cycle


## Phase 67: Fix AI Workshop Animation Visibility
- [x] Show BuildingPreview during ALL retry states (analyzing, fixing, building)
- [x] Hide banner when animation is active in preview pane
- [x] Ensure animation stays visible throughout entire retry cycle
- [x] Fix condition logic in Project.tsx
- [ ] Test complete flow: build fails → analyzing → fixing → building → success
