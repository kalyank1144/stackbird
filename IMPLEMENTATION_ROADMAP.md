# Stackbird Implementation Roadmap

**Version:** 1.0  
**Date:** November 27, 2025  
**Status:** Proposed

---

## Overview

This document outlines the detailed implementation plan to fix critical issues and make Stackbird production-ready. The roadmap is divided into three phases, each with specific deliverables and success criteria.

---

## Phase 1: Core Functionality (P0 - Blockers)

**Duration:** 2-3 weeks  
**Goal:** Make Stackbird reliably create working basic applications

### 1.1 Conversation Context Persistence

**Problem:** AI has no memory of previous conversations when project is reopened.

**Implementation Steps:**

1. **Backend: Load conversation history**
   ```typescript
   // In projectRouters.ts chat.send endpoint
   const messages = await db.getConversationMessages(conversationId);
   const contextMessages = messages.map(m => ({
     role: m.role,
     content: m.content
   }));
   ```

2. **Pass context to Aider**
   ```typescript
   // Option A: Use Aider's message history (if supported)
   aider.loadHistory(contextMessages);
   
   // Option B: Prepend context as system message
   const contextPrompt = `Previous conversation:
   ${contextMessages.map(m => `${m.role}: ${m.content}`).join('\n')}
   
   Current request: ${input.message}`;
   ```

3. **Database query optimization**
   - Add index on `conversationId` column
   - Limit context to last 50 messages (or last 10K tokens)
   - Implement context summarization for very long conversations

4. **Testing**
   - Create project, generate code
   - Close and reopen project
   - Send follow-up message
   - Verify AI remembers previous context

**Success Criteria:**
- ✅ AI remembers previous conversation when project reopened
- ✅ Follow-up requests work correctly
- ✅ Context loaded in < 2 seconds

**Estimated Effort:** 3-4 days

---

### 1.2 Automatic Build Error Detection & Recovery

**Problem:** AI doesn't know when builds fail and cannot fix errors automatically.

**Implementation Steps:**

1. **Keep AI session alive during build**
   ```typescript
   // Current: AI session ends before build starts
   await aider.sendMessage(input.message);
   await aider.stop(); // ❌ Too early
   
   // New: Keep session alive
   await aider.sendMessage(input.message);
   const buildResult = await BuildManager.installAndBuild(projectId);
   
   if (!buildResult.success) {
     // Send error to AI
     await aider.sendMessage(`Build failed with error:\n${buildResult.error}\nPlease fix this error.`);
   }
   
   await aider.stop(); // ✅ After build completes
   ```

2. **Stream build output to AI**
   ```typescript
   BuildManager.installAndBuild(projectId, {
     onOutput: (line) => {
       // Send build output to AI in real-time
       aider.sendBuildOutput(line);
     }
   });
   ```

3. **Implement retry logic**
   ```typescript
   const MAX_RETRIES = 3;
   let attempt = 0;
   
   while (attempt < MAX_RETRIES) {
     const buildResult = await BuildManager.installAndBuild(projectId);
     
     if (buildResult.success) {
       break; // Success!
     }
     
     // Ask AI to fix
     await aider.sendMessage(`Build failed (attempt ${attempt + 1}/${MAX_RETRIES}):\n${buildResult.error}\nPlease analyze and fix this error.`);
     attempt++;
   }
   ```

4. **Add build status to chat**
   ```typescript
   // Emit build events to user
   emitToUser(userId, "build:start", { projectId });
   emitToUser(userId, "build:progress", { projectId, message: "Installing dependencies..." });
   emitToUser(userId, "build:progress", { projectId, message: "Building project..." });
   emitToUser(userId, "build:success", { projectId });
   // or
   emitToUser(userId, "build:error", { projectId, error, attempt, maxAttempts });
   ```

5. **Frontend: Show build status in chat**
   ```tsx
   {buildStatus.isBuilding && (
     <div className="build-status">
       <Loader2 className="animate-spin" />
       {buildStatus.message}
     </div>
   )}
   
   {buildStatus.error && (
     <div className="build-error">
       ❌ Build failed (attempt {buildStatus.attempt}/{buildStatus.maxAttempts})
       <Button onClick={() => retryBuild()}>Retry</Button>
     </div>
   )}
   ```

**Success Criteria:**
- ✅ AI automatically detects build failures
- ✅ AI attempts to fix errors (up to 3 times)
- ✅ User sees build progress in chat
- ✅ 80%+ of build errors fixed automatically

**Estimated Effort:** 5-7 days

---

### 1.3 Validation & Testing

**Goal:** Verify basic applications build successfully

**Test Cases:**

1. **Todo App**
   - User: "Create a todo app with add/delete functionality"
   - Expected: Working React app with todo list
   - Success criteria: Builds without errors, UI renders correctly

2. **Calculator**
   - User: "Create a calculator app"
   - Expected: Working calculator with basic operations
   - Success criteria: Builds without errors, calculations work

3. **Weather App**
   - User: "Create a weather app that shows current weather"
   - Expected: Working app with weather display (mock data OK)
   - Success criteria: Builds without errors, UI displays data

4. **Counter App**
   - User: "Create a counter app with increment/decrement buttons"
   - Expected: Simple counter with state management
   - Success criteria: Builds without errors, buttons work

5. **Form App**
   - User: "Create a contact form with name, email, message fields"
   - Expected: Form with validation
   - Success criteria: Builds without errors, validation works

**Automated Testing:**
```typescript
// tests/integration/basic-apps.test.ts
describe('Basic App Creation', () => {
  test('Todo app builds successfully', async () => {
    const project = await createProject('Todo App');
    const response = await sendMessage(project.id, 'Create a todo app');
    const buildResult = await waitForBuild(project.id);
    
    expect(buildResult.success).toBe(true);
    expect(buildResult.errors).toHaveLength(0);
  });
  
  // ... more tests
});
```

**Success Criteria:**
- ✅ 5/5 test cases pass
- ✅ Automated test suite runs in CI/CD
- ✅ Success rate tracked and reported

**Estimated Effort:** 3-4 days

---

## Phase 2: Reliability Improvements (P1 - High Priority)

**Duration:** 3-4 weeks  
**Goal:** Improve AI self-correction and handle complex scenarios

### 2.1 Improve Self-Correction Logic

**Problem:** AI fails to fix errors even when told what's wrong.

**Implementation Steps:**

1. **Add validation before committing changes**
   ```typescript
   // Before applying Aider changes
   const changedFiles = aider.getChangedFiles();
   
   for (const file of changedFiles) {
     // Syntax validation
     if (file.endsWith('.tsx') || file.endsWith('.ts')) {
       const syntaxErrors = await validateTypeScript(file);
       if (syntaxErrors.length > 0) {
         await aider.sendMessage(`Syntax errors in ${file}:\n${syntaxErrors.join('\n')}\nPlease fix these before proceeding.`);
         return; // Don't commit yet
       }
     }
   }
   
   // Commit only if validation passes
   await aider.commit();
   ```

2. **Implement structured error analysis**
   ```typescript
   function analyzeBuildError(error: string) {
     return {
       type: detectErrorType(error), // 'syntax' | 'import' | 'type' | 'runtime'
       file: extractFileName(error),
       line: extractLineNumber(error),
       message: extractErrorMessage(error),
       suggestion: generateFixSuggestion(error)
     };
   }
   
   const analysis = analyzeBuildError(buildResult.error);
   const fixPrompt = `Build error detected:
   Type: ${analysis.type}
   File: ${analysis.file}:${analysis.line}
   Error: ${analysis.message}
   
   Suggestion: ${analysis.suggestion}
   
   Please fix this error.`;
   ```

3. **Add retry with different approaches**
   ```typescript
   const strategies = [
     'direct-fix', // Try to fix the exact error
     'revert-and-retry', // Revert last change and try different approach
     'simplify', // Simplify the implementation
   ];
   
   for (const strategy of strategies) {
     const prompt = generatePromptForStrategy(strategy, error);
     await aider.sendMessage(prompt);
     const buildResult = await build();
     if (buildResult.success) break;
   }
   ```

4. **Show diffs to users before applying**
   ```typescript
   // Generate diff
   const diff = await git.diff();
   
   // Send to user for approval
   emitToUser(userId, "code:changes", {
     diff,
     files: changedFiles,
     requiresApproval: true
   });
   
   // Wait for user approval
   const approved = await waitForUserApproval(userId, timeout: 30000);
   
   if (approved) {
     await git.commit();
   } else {
     await git.reset();
   }
   ```

**Success Criteria:**
- ✅ 95%+ of syntax errors fixed automatically
- ✅ AI tries multiple strategies when first attempt fails
- ✅ Users can review and approve changes

**Estimated Effort:** 7-10 days

---

### 2.2 Stream Build Logs to AI

**Problem:** AI doesn't see build output in real-time.

**Implementation Steps:**

1. **Capture build output**
   ```typescript
   // In buildManager.ts
   async function runBuild(projectPath: string, onOutput: (line: string) => void) {
     const proc = spawn('npm', ['run', 'build'], { cwd: projectPath });
     
     proc.stdout.on('data', (data) => {
       const lines = data.toString().split('\n');
       lines.forEach(line => onOutput(line));
     });
     
     proc.stderr.on('data', (data) => {
       const lines = data.toString().split('\n');
       lines.forEach(line => onOutput(`ERROR: ${line}`));
     });
   }
   ```

2. **Send to AI in real-time**
   ```typescript
   await runBuild(projectPath, (line) => {
     // Send to AI
     aider.receiveBuildOutput(line);
     
     // Also send to user's Console tab
     emitToUser(userId, "build:log", { line });
   });
   ```

3. **AI analyzes output proactively**
   ```typescript
   // In aider.ts
   receiveBuildOutput(line: string) {
     this.buildOutput.push(line);
     
     // Detect errors in real-time
     if (line.includes('ERROR') || line.includes('Failed')) {
       this.detectedErrors.push(line);
     }
     
     // If too many errors, stop build and suggest fix
     if (this.detectedErrors.length > 5) {
       this.suggestFix();
     }
   }
   ```

**Success Criteria:**
- ✅ AI sees build output in real-time
- ✅ AI detects errors before build completes
- ✅ Proactive fix suggestions

**Estimated Effort:** 4-5 days

---

### 2.3 Research Aider Alternatives

**Problem:** Aider has architectural limitations for autonomous use.

**Research Areas:**

1. **Direct LLM API usage**
   - Pros: Full control over context, prompts, validation
   - Cons: Need to build file editing logic ourselves
   - Evaluation: Prototype a simple implementation

2. **Other AI coding tools**
   - Evaluate: GPT Engineer, Smol Developer, Mentat
   - Compare: Context management, file editing, error handling
   - Decision: Stick with Aider or migrate?

3. **Hybrid approach**
   - Use Aider for code generation
   - Use direct LLM calls for analysis, planning, error fixing
   - Best of both worlds?

**Deliverables:**
- Research document comparing options
- Prototype of alternative approach
- Decision: Continue with Aider or migrate

**Estimated Effort:** 5-7 days (research + prototype)

---

## Phase 3: UX Polish (P2 - Medium Priority)

**Duration:** 2-3 weeks  
**Goal:** Professional, intuitive user experience

### 3.1 Improve Chat UX

**Problem:** Chat shows full code blocks, making it cluttered and confusing.

**Implementation:**

1. **Show progress updates instead of code**
   ```typescript
   // Instead of showing full code in chat
   emitToUser(userId, "ai:message", {
     content: "```jsx\nfunction TodoApp() { ... 200 lines ... }\n```"
   });
   
   // Show progress updates
   emitToUser(userId, "ai:progress", {
     steps: [
       { status: 'done', message: '✓ Created TodoApp.jsx' },
       { status: 'done', message: '✓ Added state management' },
       { status: 'in-progress', message: '⚡ Implementing add/delete functions...' },
       { status: 'pending', message: 'Building project...' }
     ]
   });
   ```

2. **Display file tree changes**
   ```tsx
   <div className="file-changes">
     <h4>Files Changed:</h4>
     <ul>
       <li className="added">+ src/TodoApp.jsx</li>
       <li className="modified">~ src/App.jsx</li>
       <li className="deleted">- src/OldComponent.jsx</li>
     </ul>
   </div>
   ```

3. **Inline build status**
   ```tsx
   <div className="ai-message">
     <p>I've created your todo app with add/delete functionality.</p>
     <FileChanges files={changedFiles} />
     <BuildStatus status="building" progress={60} />
   </div>
   ```

4. **Collapsible code blocks**
   ```tsx
   <details>
     <summary>View generated code (TodoApp.jsx)</summary>
     <CodeBlock language="jsx">{code}</CodeBlock>
   </details>
   ```

**Success Criteria:**
- ✅ Chat is clean and easy to read
- ✅ Users understand what AI is doing
- ✅ Code blocks are optional/collapsible

**Estimated Effort:** 3-4 days

---

### 3.2 Multiple Conversations Per Project

**Problem:** Users can't start fresh conversation when AI goes wrong.

**Implementation:**

1. **Database schema update**
   ```sql
   ALTER TABLE conversations ADD COLUMN title VARCHAR(255);
   ALTER TABLE conversations ADD COLUMN archived BOOLEAN DEFAULT FALSE;
   CREATE INDEX idx_conversations_project ON conversations(projectId, archived);
   ```

2. **Backend API**
   ```typescript
   // Create new conversation
   createConversation: protectedProcedure
     .input(z.object({
       projectId: z.number(),
       title: z.string().optional()
     }))
     .mutation(async ({ input, ctx }) => {
       const conversation = await db.createConversation(
         input.projectId,
         input.title || `Chat ${new Date().toLocaleString()}`
       );
       return conversation;
     }),
   
   // List conversations
   listConversations: protectedProcedure
     .input(z.object({ projectId: z.number() }))
     .query(async ({ input }) => {
       return await db.getProjectConversations(input.projectId);
     }),
   
   // Archive conversation
   archiveConversation: protectedProcedure
     .input(z.object({ conversationId: z.number() }))
     .mutation(async ({ input }) => {
       await db.archiveConversation(input.conversationId);
     }),
   ```

3. **Frontend UI**
   ```tsx
   // Conversation sidebar
   <div className="conversations-sidebar">
     <Button onClick={createNewConversation}>
       <Plus /> New Chat
     </Button>
     
     <div className="conversation-list">
       {conversations.map(conv => (
         <div
           key={conv.id}
           className={cn("conversation-item", {
             active: conv.id === activeConversationId
           })}
           onClick={() => switchConversation(conv.id)}
         >
           <span>{conv.title}</span>
           <Button onClick={() => archiveConversation(conv.id)}>
             <Archive />
           </Button>
         </div>
       ))}
     </div>
   </div>
   ```

4. **Conversation naming**
   ```tsx
   // Auto-generate title from first message
   const title = generateTitle(firstMessage); // "Create todo app"
   
   // Or let user rename
   <Input
     value={conversation.title}
     onChange={(e) => renameConversation(conversation.id, e.target.value)}
   />
   ```

**Success Criteria:**
- ✅ Users can create multiple conversations per project
- ✅ Easy to switch between conversations
- ✅ Conversations can be archived/deleted
- ✅ Conversations have meaningful titles

**Estimated Effort:** 4-5 days

---

### 3.3 Better Error Messages

**Problem:** Technical errors confuse users.

**Implementation:**

1. **Error translation layer**
   ```typescript
   function translateError(technicalError: string): UserFriendlyError {
     const patterns = [
       {
         pattern: /Module not found: Error: Can't resolve '(.+)'/,
         message: (match) => `Missing dependency: ${match[1]}. The AI will try to install it.`,
         action: 'auto-fix'
       },
       {
         pattern: /SyntaxError: (.+) \((\d+):(\d+)\)/,
         message: (match) => `Syntax error in your code at line ${match[2]}. The AI will fix this.`,
         action: 'auto-fix'
       },
       {
         pattern: /502 Bad Gateway/,
         message: () => `Server is temporarily unavailable. Please try again in a moment.`,
         action: 'retry'
       }
     ];
     
     for (const { pattern, message, action } of patterns) {
       const match = technicalError.match(pattern);
       if (match) {
         return {
           message: message(match),
           action,
           technicalDetails: technicalError
         };
       }
     }
     
     return {
       message: 'Something went wrong. Please try again or contact support.',
       action: 'manual',
       technicalDetails: technicalError
     };
   }
   ```

2. **User-friendly error UI**
   ```tsx
   <div className="error-message">
     <AlertCircle className="error-icon" />
     <div>
       <h4>{error.message}</h4>
       {error.action === 'auto-fix' && (
         <p>The AI is working on a fix...</p>
       )}
       {error.action === 'retry' && (
         <Button onClick={retry}>Try Again</Button>
       )}
       {error.action === 'manual' && (
         <Button onClick={contactSupport}>Get Help</Button>
       )}
       
       <details>
         <summary>Technical details</summary>
         <pre>{error.technicalDetails}</pre>
       </details>
     </div>
   </div>
   ```

3. **Contextual help**
   ```tsx
   // Show relevant docs/help based on error type
   {error.type === 'dependency' && (
     <a href="/docs/dependencies">Learn about dependencies →</a>
   )}
   {error.type === 'syntax' && (
     <a href="/docs/common-errors">Common syntax errors →</a>
   )}
   ```

**Success Criteria:**
- ✅ All errors have user-friendly messages
- ✅ Actionable suggestions provided
- ✅ Technical details available but hidden by default

**Estimated Effort:** 2-3 days

---

### 3.4 Template Validation

**Problem:** Templates may be outdated or broken.

**Implementation:**

1. **Automated template tests**
   ```typescript
   // tests/templates.test.ts
   describe('Template Validation', () => {
     const templates = getAllTemplates();
     
     templates.forEach(template => {
       test(`${template.name} builds successfully`, async () => {
         const projectPath = await createTempProject(template);
         const buildResult = await buildProject(projectPath);
         
         expect(buildResult.success).toBe(true);
         expect(buildResult.errors).toHaveLength(0);
         
         await cleanupTempProject(projectPath);
       });
     });
   });
   ```

2. **CI/CD integration**
   ```yaml
   # .github/workflows/test-templates.yml
   name: Test Templates
   
   on: [push, pull_request]
   
   jobs:
     test-templates:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v2
         - uses: actions/setup-node@v2
         - run: npm install
         - run: npm run test:templates
   ```

3. **Template versioning**
   ```typescript
   // templates/index.ts
   export const templates = [
     {
       id: 'react-app',
       name: 'React App',
       version: '1.2.0',
       lastUpdated: '2025-11-27',
       dependencies: {
         'react': '^18.2.0',
         'react-dom': '^18.2.0',
         // ...
       }
     }
   ];
   ```

**Success Criteria:**
- ✅ All templates pass automated tests
- ✅ Templates tested in CI/CD pipeline
- ✅ Templates versioned and tracked

**Estimated Effort:** 2-3 days

---

## Timeline Summary

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Core Functionality** | 2-3 weeks | Context persistence, auto error detection, basic app validation |
| **Phase 2: Reliability** | 3-4 weeks | Improved self-correction, build log streaming, architecture research |
| **Phase 3: UX Polish** | 2-3 weeks | Clean chat UI, multi-conversation, better errors, template validation |
| **Total** | **7-10 weeks** | Production-ready platform |

---

## Resource Requirements

### Development Team
- 1 Senior Backend Engineer (Aider integration, build system)
- 1 Frontend Engineer (React, WebSocket, UI/UX)
- 1 QA Engineer (Automated testing, validation)

### Infrastructure
- Staging environment for testing
- CI/CD pipeline for automated tests
- Monitoring and error tracking (Sentry, LogRocket)

### Budget Estimate
- Development: 7-10 weeks × 3 engineers = 21-30 engineer-weeks
- Infrastructure: $500-1000/month
- LLM API costs: $1000-2000/month (testing + development)

---

## Risk Mitigation

### High Risks

1. **Aider limitations may require full rewrite**
   - Mitigation: Research alternatives in Phase 2
   - Contingency: Budget 2-3 extra weeks for migration

2. **LLM token costs may be prohibitive**
   - Mitigation: Implement context summarization
   - Contingency: Add usage limits, optimize prompts

3. **Build times too slow for good UX**
   - Mitigation: Implement build caching
   - Contingency: Show progress updates, set expectations

4. **Scope creep from new issues**
   - Mitigation: Strict scope control, prioritize P0/P1 only
   - Contingency: Push P2 features to Phase 4

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ 80%+ success rate on basic app creation
- ✅ Context persistence works 100% of time
- ✅ Auto error detection catches 90%+ of build failures

### Phase 2 Success Criteria
- ✅ 95%+ success rate on basic apps
- ✅ 70%+ success rate on medium complexity apps
- ✅ AI self-corrects 80%+ of errors without human intervention

### Phase 3 Success Criteria
- ✅ User satisfaction score 8+/10
- ✅ Average time to working app < 5 minutes
- ✅ Support tickets reduced by 50%

---

## Next Steps

1. **Review and approve this roadmap**
2. **Set up development environment**
3. **Begin Phase 1: Context persistence**
4. **Weekly progress reviews**
5. **Adjust timeline based on learnings**

---

**Document Status:** Ready for Approval  
**Prepared by:** Manus AI  
**Date:** November 27, 2025
