# Facebook Adapter Implementation Inventory

**Date**: 2026-05-06  
**Scope**: `/src/adapters/providers/meta/facebook/` directory analysis  
**Purpose**: Document existing Facebook implementations to guide cookie-based testing strategy

---

## 📋 Executive Summary

The Facebook adapter implements **cookie-based GraphQL interactions** with Facebook's internal APIs. Current implementation covers:

✅ **Search** — Post/user targeting via GraphQL search  
✅ **Messaging** — Private messages (DM) functionality  
✅ **Comments** — Post comments functionality  
✅ **Core Auth** — Cookie validation, CSRF token extraction  

❌ **NOT Implemented**:
- Notifications/unread notification fetching
- Filtering/advanced search filters
- Notification acknowledgment/marking as read

---

## 📁 File Structure

| File | Lines | Purpose | Status |
|------|-------|---------|--------|
| `facebook.ts` | 251 | Core adapter class (GraphQL interface) | ✅ Implemented |
| `facebook-finder.ts` | 159 | Post/user search targeting | ✅ Implemented |
| `facebook-finder.ts` | 156 | Typo duplicate (possible fallback variant) | ⚠️ Typo file |
| `chat.ts` | 150 | Private Messenger functionality | ✅ Implemented |
| `comment.ts` | 155 | Post commenting functionality | ✅ Implemented |
| `facebook-cookies.ts` | 159 | Cookie parsing utilities | ✅ Implemented |
| `facebook-cookies.test.ts` | 99 | Cookie test suite | ✅ Tests exist |
| `comment.test.ts` | 110 | Comment test suite | ✅ Tests exist |

---

## 🔍 Detailed Implementation Analysis

### 1. **FacebookAdapter Core Class** (`facebook.ts`)

**Location**: `/src/adapters/providers/meta/facebook/facebook.ts`

#### Public Methods:
```typescript
async connect(): Promise<void>
  - Validates cookie authentication
  - Extracts fb_dtsg (CSRF token)
  - Extracts lsd (additional CSRF token)
  - Detects login redirects (auth failure)

async disconnect(): Promise<void>
  - Cleanup (currently minimal)

async sendMessage(
  userId: string,
  message: string,
  channel?: string
): Promise<{ id: string; status: string }>
  - Sends GraphQL mutation to post message
  - Uses doc_id for MessengerSendMutation
  - Rate-limited responses

async getRateLimitStatus(): Promise<RateLimitStatus | null>
  - Returns current rate limiting info
```

#### Authentication Flow:
1. Cookie provided as raw browser session string: `c_user=...; xs=...; datr=...; sb=...`
2. CSRF tokens extracted from Facebook homepage HTML:
   - `fb_dtsg` — primary CSRF token
   - `lsd` — secondary CSRF token
3. All GraphQL requests include these tokens in `X-FB-LSD` header and form params

#### GraphQL Mutation Used:
- `doc_id: 6012268648876713` (estimated MessengerSendMutation)
- Requires `fb_dtsg`, `lsd`, `__user`, `__a=1` parameters

---

### 2. **Facebook Finder (Search)** (`facebook-finder.ts`)

**Location**: `/src/adapters/providers/meta/facebook/facebook-finder.ts`

#### Public Function:
```typescript
async function findFacebookTargets(
  query: string,
  cookie: string,
  limit: number = 30
): Promise<FacebookFinderResult>

// Returns:
interface FacebookFinderResult {
  postIds: string[]      // Post IDs with underscores (e.g., "123_456")
  userIds: string[]      // Numeric user IDs
}
```

#### Implementation Details:
- **GraphQL Endpoint**: `/api/graphql/` (POST)
- **GraphQL Query**: `SearchCometResultsInitialResultsQuery`
- **GraphQL doc_id**: `6012268648876713` (same as messaging)
- **Search Surface**: `GROUP_SEARCH` (searches group posts)

#### Search Parameters:
```json
{
  "count": 30,
  "query": "keyword",
  "search_surface": "GROUP_SEARCH"
}
```

#### Data Extraction:
- Regex parsing of response JSON:
  - `/"post_id":"(\d+)"/g` — extracts post IDs
  - `/"story_id":"(\d+)"/g` — extracts story IDs
  - `/"actor_id":"(\d+)"/g` — extracts user IDs

#### Fallback:
- If search fails → reads `/data/targets.txt`
- Heuristic: IDs with `_` → postIds, numeric-only → userIds

---

### 3. **Chat/Messenger** (`chat.ts`)

**Location**: `/src/adapters/providers/meta/facebook/chat.ts`

#### Public Function:
```typescript
async function sendPrivateMessage(
  userId: string,
  message: string,
  cookie: string
): Promise<{ success: boolean; error?: string; messageId?: string }>
```

#### Implementation:
- Similar CSRF token extraction as core adapter
- GraphQL mutation to send message
- User ID is numeric (e.g., "123456789")
- Returns `messageId` on success

---

### 4. **Comments** (`comment.ts`)

**Location**: `/src/adapters/providers/meta/facebook/comment.ts`

#### Public Function:
```typescript
async function postComment(
  postId: string,
  message: string,
  cookie: string
): Promise<{ success: boolean; error?: string; commentId?: string }>
```

#### Implementation:
- Post ID format: `"123456789_987654321"` or just `"987654321"`
- CSRF token extraction from homepage
- GraphQL mutation submission
- Returns `commentId` on success

---

### 5. **Cookie Utilities** (`facebook-cookies.ts`)

**Location**: `/src/adapters/providers/meta/facebook/facebook-cookies.ts`

#### Public Functions:
```typescript
function parseCookies(rawCookieString: string): string
  - Parses raw cookie string into HTTP header format
  - Validates required cookies (c_user, xs, etc.)

function validateCookieExpiry(cookie: string): boolean
  - Checks if cookie is still valid
  - Returns false if cookie string is missing required fields

function extractCUserFromCookie(cookie: string): string
  - Fast path to extract c_user value
  - Used in multiple places for rate limiting
```

---

## ❌ NOT IMPLEMENTED

### Search/Filters Not Available:
- ❌ Advanced search filters (date range, location, etc.)
- ❌ Search filter parameters (only basic `query`, `search_surface`)
- ❌ Saved searches/filter presets
- ❌ Search sorting options

### Notifications Not Available:
- ❌ Fetch notifications/unread notifications
- ❌ Mark notifications as read
- ❌ Notification acknowledgment
- ❌ Notification type filtering (friend requests, likes, comments, etc.)
- ❌ Notification preference management

### Other Missing Capabilities:
- ❌ Group/friend management
- ❌ Profile updates
- ❌ Like/reaction functionality
- ❌ Post creation
- ❌ Media uploads
- ❌ Story posting

---

## 🧪 Test Coverage

### Existing Tests:

#### `facebook-cookies.test.ts` (99 lines)
Tests for:
- Cookie parsing
- Cookie validation
- c_user extraction
- Format parsing

#### `comment.test.ts` (110 lines)
Tests for:
- Comment posting success/failure
- Error handling
- Cookie validation

#### Notable Gap:
- ⚠️ No tests for `findFacebookTargets()` search function
- ⚠️ No tests for messenger `sendPrivateMessage()`
- ⚠️ No tests for rate limiting behavior

---

## 🎯 Cookie-Based Testing Strategy

### Prerequisites for Testing:
1. Valid Facebook browser session cookie (not API token)
2. Cookie must include: `c_user`, `xs`, `datr`, `sb`
3. Cookie freshness: < 30 days recommended
4. Account must not have 2FA, checkpoint restrictions, or bots flag

### Testing Approach:

```typescript
// 1. Test initialization with valid cookie
const adapter = new FacebookAdapter(validCookie)
await adapter.connect() // ✅ Should succeed

// 2. Test search functionality
const results = await findFacebookTargets("test query", validCookie)
// ✅ Should return postIds[] and userIds[]

// 3. Test messaging
const msgResult = await sendPrivateMessage("userId", "test", validCookie)
// ✅ Should return { success: true, messageId: "..." }

// 4. Test commenting
const commentResult = await postComment("postId", "test comment", validCookie)
// ✅ Should return { success: true, commentId: "..." }

// 5. Test rate limiting
const rateStatus = await adapter.getRateLimitStatus()
// ✅ Should return remaining quota and reset time
```

### Expected Cookie Behavior:

| Cookie State | Behavior |
|--------------|----------|
| Valid, fresh | ✅ All operations work |
| Expired | ❌ `connect()` throws `AuthError` |
| Missing c_user | ❌ Fallback to file-based targets |
| Missing xs token | ❌ GraphQL request fails |
| Revoked/logged out | ❌ Login redirect detected |

---

## 📊 GraphQL Endpoints Reference

### Endpoint: `/api/graphql/`

| Operation | doc_id | Payload Size |
|-----------|--------|--------------|
| Search (SearchCometResults) | 6012268648876713 | ~500B |
| Send Message (MessengerSend) | ? (inferred) | ~200B |
| Post Comment | ? (inferred) | ~300B |

**Note**: doc_ids are reverse-engineered from actual request captures; exact values may vary by Facebook version.

---

## 🔐 Security Considerations

### Cookie Exposure Risk:
- ⚠️ Cookies stored in plaintext in code/tests
- ⚠️ HTTP logs may capture cookie headers
- ⚠️ Browser DevTools can expose cookies
- **Recommendation**: Use environment variables or secure vaults

### Rate Limiting:
- 30 requests per minute (default)
- Resets every 60 seconds
- Tracked per session (not per IP)

### Anti-Bot Detection:
- User-Agent header must match Chrome browser
- Referer header should be `https://www.facebook.com/`
- Request timing should be human-like (delays between requests)

---

## 📝 Recommendations for Extension

### To Add Notification Support:
1. Identify Facebook's notification GraphQL doc_id
2. Add `fetchNotifications()` method to `FacebookAdapter`
3. Parse response for notification types (friend requests, likes, comments, etc.)
4. Add `markNotificationAsRead()` mutation
5. Create `notifications.ts` module with public functions

### To Add Advanced Search:
1. Document available `search_surface` options:
   - `GROUP_SEARCH` — current (group posts)
   - `PAGE_SEARCH` — pages
   - `USER_SEARCH` — users
   - `EVENT_SEARCH` — events (if supported)
2. Add filter parameters to `findFacebookTargets()`:
   - `dateRange?: { from: Date; to: Date }`
   - `location?: string`
   - `sortBy?: 'latest' | 'popular'`
3. Update GraphQL variable payload

### To Improve Test Coverage:
1. Create fixture cookies (rotate after each test)
2. Mock GraphQL responses for CI/CD
3. Add integration tests with real cookies (separate test suite)
4. Add performance benchmarks for search queries

---

## 🚀 Next Steps

### Immediate:
1. ✅ Document current capabilities (this file)
2. ⏳ Set up cookie rotation mechanism for tests
3. ⏳ Add environment variable support for secrets

### Short-term:
1. ⏳ Add error recovery for rate-limited responses
2. ⏳ Implement request retry logic with exponential backoff
3. ⏳ Add comprehensive logging for debugging

### Long-term:
1. ⏳ Extend with notification support
2. ⏳ Add advanced search filters
3. ⏳ Support for group management
4. ⏳ Media upload capabilities

---

## 📚 References

- **File**: `/src/adapters/providers/meta/facebook/facebook.ts`
- **Tests**: `/src/adapters/providers/meta/facebook/*.test.ts`
- **Utils**: `/src/utils/http-client.ts`, `/src/utils/randomTargets.ts`
- **IAdapter Interface**: `/src/IAdapter.ts`

---

**Last Updated**: 2026-05-06  
**Status**: Ready for cookie-based testing
