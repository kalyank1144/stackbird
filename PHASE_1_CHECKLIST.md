# Phase 1: Critical Issues Fix - Checklist

**Goal:** Make Stackbird reliably create working basic applications  
**Timeline:** 2-3 weeks  
**Status:** 🟡 In Progress

---

## 🔴 P0 - CRITICAL BLOCKERS

### Issue #1: Conversation Context Persistence
**Problem:** AI has no memory when project is reopened

- [ ] Load conversation history from database when project opens
- [ ] Pass conversation context to Aider session
- [ ] Optimize context loading (limit to last 50 messages)
- [ ] Add database index on conversationId column
- [ ] Test: Open existing project, verify AI remembers context
- [ ] Test: Send follow-up message, verify continuity

**Success Criteria:**
- ✅ AI remembers previous conversation 100% of time
- ✅ Context loads in < 2 seconds
- ✅ Follow-up requests work correctly

---

### Issue #2: Automatic Build Error Detection
**Problem:** AI doesn't know when builds fail

- [ ] Keep Aider session alive during build process
- [ ] Stream build output to AI in real-time
- [ ] Detect build failures automatically
- [ ] Send build errors to AI for analysis
- [ ] Implement retry logic (max 3 attempts)
- [ ] Show build status in chat UI
- [ ] Test: Create app with intentional error, verify AI fixes it
- [ ] Test: Verify auto-retry works correctly

**Success Criteria:**
- ✅ AI detects 100% of build failures
- ✅ AI attempts to fix errors automatically
- ✅ 80%+ of build errors fixed without manual intervention
- ✅ User sees build progress in chat

---

### Issue #3: Basic App Validation
**Problem:** Platform fails at simple tasks like todo app

**Test Cases:**
- [ ] Test 1: Todo app (add/delete functionality)
- [ ] Test 2: Counter app (increment/decrement)
- [ ] Test 3: Calculator app (basic operations)
- [ ] Test 4: Weather app (display mock data)
- [ ] Test 5: Contact form (with validation)

**For Each Test:**
- [ ] Create new project
- [ ] Send prompt to AI
- [ ] Wait for build to complete
- [ ] Verify app builds without errors
- [ ] Verify app works in preview
- [ ] Document any failures

**Success Criteria:**
- ✅ 5/5 test cases pass
- ✅ All apps build successfully
- ✅ All apps work in preview
- ✅ 80%+ success rate overall

---

## 📊 Progress Tracking

| Task | Status | Started | Completed | Notes |
|------|--------|---------|-----------|-------|
| Context Persistence | 🔴 Not Started | - | - | - |
| Auto Error Detection | 🔴 Not Started | - | - | - |
| Basic App Validation | 🔴 Not Started | - | - | - |

**Legend:**
- 🔴 Not Started
- 🟡 In Progress
- 🟢 Completed
- ⚠️ Blocked

---

## 🎯 Current Focus

**NOW:** Issue #1 - Conversation Context Persistence

**NEXT:** Issue #2 - Auto Error Detection

**THEN:** Issue #3 - Validation Testing

---

## 📝 Implementation Notes

### Context Persistence Implementation
```typescript
// In projectRouters.ts chat.send endpoint
const messages = await db.getConversationMessages(conversationId);
const contextMessages = messages
  .slice(-50) // Last 50 messages
  .map(m => `${m.role}: ${m.content}`)
  .join('\n\n');

const contextPrompt = `Previous conversation:\n${contextMessages}\n\nCurrent request: ${input.message}`;
```

### Auto Error Detection Implementation
```typescript
// Keep Aider alive during build
await aider.sendMessage(input.message);

// Wait for Aider to finish
await new Promise(resolve => setTimeout(resolve, 30000));

// Build project
const buildResult = await BuildManager.installAndBuild(projectId);

if (!buildResult.success) {
  // Send error to AI
  await aider.sendMessage(`Build failed with error:\n${buildResult.error}\nPlease fix this error.`);
  
  // Retry build
  const retryResult = await BuildManager.installAndBuild(projectId);
}

await aider.stop();
```

---

## ✅ Definition of Done

Phase 1 is complete when:
1. ✅ All P0 issues are fixed
2. ✅ All tests pass (5/5 basic apps)
3. ✅ Code is reviewed and tested
4. ✅ Documentation is updated
5. ✅ Checkpoint is created
6. ✅ Changes are deployed to production

---

**Last Updated:** November 27, 2025  
**Next Review:** After each task completion
