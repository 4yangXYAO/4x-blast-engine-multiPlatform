# Facebook Adapter - Cookie-Based Testing Readiness Report

## ✅ READY FOR TESTING

### 1. Search Functionality
**File**: `facebook-finder.ts`
**Function**: `findFacebookTargets(query, cookie, limit)`
**Status**: ✅ Ready to test with cookies
**Test Scenario**:
- Input: valid cookie + search query (e.g., "tech jobs")
- Expected: Returns array of postIds and userIds
- Error handling: Falls back to data/targets.txt on cookie failure

### 2. Private Messaging
**File**: `chat.ts`
**Function**: `sendPrivateMessage(userId, message, cookie)`
**Status**: ✅ Ready to test with cookies
**Test Scenario**:
- Input: valid cookie + userId + message text
- Expected: Returns { success: true, messageId: "..." }
- Error handling: Detects login redirect if cookie expired

### 3. Post Comments
**File**: `comment.ts`
**Function**: `postComment(postId, message, cookie)`
**Status**: ✅ Ready to test with cookies
**Test Scenario**:
- Input: valid cookie + postId + comment text
- Expected: Returns { success: true, commentId: "..." }
- Error handling: Validates CSRF tokens from homepage

### 4. Cookie Validation
**File**: `facebook-cookies.ts`
**Functions**: `parseCookies()`, `validateCookieExpiry()`, `extractCUserFromCookie()`
**Status**: ✅ Ready to test with cookies
**Test Scenario**:
- Input: raw browser cookie string
- Expected: Properly parsed HTTP Cookie header
- Error handling: Detects missing required fields

### 5. CSRF Token Extraction
**File**: `facebook.ts` - connect() method
**Status**: ✅ Ready to test with cookies
**Test Scenario**:
- Input: valid cookie
- Expected: Extracts fb_dtsg and lsd tokens from homepage
- Error handling: Multiple extraction patterns for different FB versions

### 6. Rate Limiting
**File**: `facebook.ts` - getRateLimitStatus()
**Status**: ✅ Ready to test with cookies
**Test Scenario**:
- After connect(): Check rate limit status
- Expected: Returns { remaining: 30, resetTime: timestamp }

## ❌ NOT READY FOR TESTING (Not Implemented)

### 1. Notifications
- No fetchNotifications() method
- No way to check unread count
- No way to mark as read

### 2. Advanced Search Filters
- No date range parameter
- No location filter
- No sort options
- No result type filtering

### 3. Other Features
- No Like/React functionality
- No Post creation
- No Group management
- No Profile updates

## 🔧 Test Environment Setup Needed

```bash
# 1. Set valid Facebook cookie
export FACEBOOK_COOKIE="c_user=YOUR_USER_ID; xs=YOUR_XS_TOKEN; ..."

# 2. Run test suite
npm test -- facebook

# 3. Monitor rate limits
# (built-in tracking in adapter)

# 4. Check for cookie expiry
# (auto-detected, throws AuthError)
```

## 📋 Pre-Test Checklist

- [ ] Cookie is from real Facebook session (not API token)
- [ ] Cookie includes: c_user, xs, datr, sb
- [ ] Cookie is fresh (< 30 days old)
- [ ] Account has no 2FA or checkpoint restrictions
- [ ] Account is not flagged as bot
- [ ] Test targets exist (valid postIds/userIds)
- [ ] Test environment can reach facebook.com
- [ ] User-Agent header will be Chrome/Firefox (set in code)

## 🚀 Execution Order for Testing

1. **Start with Cookie Validation**
   - Test parseCookies() with raw string
   - Test extractCUserFromCookie()
   - This validates setup without making API calls

2. **Test Connect/Auth**
   - Initialize FacebookAdapter with cookie
   - Call connect()
   - Should extract fb_dtsg and lsd
   - Should NOT throw AuthError

3. **Test Search**
   - Call findFacebookTargets() with test query
   - Should return postIds and/or userIds
   - Should NOT return empty array (unless fallback)

4. **Test Messaging**
   - Call sendPrivateMessage() with known userId
   - Should return { success: true, messageId: "..." }
   - Should NOT return error

5. **Test Comments**
   - Call postComment() with known postId
   - Should return { success: true, commentId: "..." }
   - Should NOT return error

6. **Test Rate Limiting**
   - Call getRateLimitStatus() after operations
   - Should show remaining count decreased
   - Should show valid reset time

## ✨ Expected Test Results

All functions should:
- ✅ Work with valid cookies
- ✅ Throw/return error with expired cookies
- ✅ Detect login redirects (auth failure)
- ✅ Extract CSRF tokens correctly
- ✅ Handle GraphQL errors gracefully
- ✅ Respect rate limits
- ✅ Use proper User-Agent headers

## 📊 Coverage Summary

| Component | Implemented | Testable | Priority |
|-----------|-----------|----------|----------|
| Search | ✅ | ✅ | High |
| Messaging | ✅ | ✅ | High |
| Comments | ✅ | ✅ | High |
| Auth/Cookies | ✅ | ✅ | Critical |
| Rate Limiting | ✅ | ✅ | Medium |
| Notifications | ❌ | ❌ | Not Ready |
| Filters | ❌ | ❌ | Not Ready |

---

**Last Updated**: 2026-05-06
**Status**: All implemented features ready for cookie-based testing
**Next Action**: Obtain valid Facebook cookie and run test suite
