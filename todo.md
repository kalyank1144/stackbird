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
