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
