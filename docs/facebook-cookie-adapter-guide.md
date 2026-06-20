# FacebookCookieAdapter - Analysis & Test Script

## Adapter Overview

**File:** `src/adapters/providers/meta/facebook/facebook-cookies.ts`

The `FacebookCookieAdapter` posts to Facebook using browser session cookies, implementing the `IAdapter` interface.

### How It Works

1. **Constructor**
   - Accepts raw cookie string (plain string OR JSON array)
   - Optional logger callback for debugging

2. **Cookie Parsing** (`parseCookies` utility)
   - Handles two input formats:
     - **JSON array**: `[{"name":"c_user","value":"123"}]` â†’ `"c_user=123"`
     - **Plain string**: `"c_user=123; xs=abc"` â†’ passed through as-is
   - Result: standardized cookie header string

3. **Connection Phase** (`connect()`)
   - Parses cookies into `cookieHeader`
   - Extracts `csrftoken` from cookies (regex: `/csrftoken=([^;]+)/`)
   - Throws if no cookies provided

4. **Message Sending** (`sendMessage()`)
   - Auto-connects if needed
   - Checks rate limits (30 requests/minute)
   - Sends POST to Facebook's text post endpoint
   - Uses Threads app ID: `238260118697367`
   - Includes CSRF token header

5. **Rate Limiting**
   - `rateRemaining`: tracks quota
   - `rateReset`: timestamp when quota resets
   - `maybeDrainRate()`: decrements as needed

## Credentials Expected

Required cookies:
- `c_user`: Facebook user ID
- `xs`: Session token
- `csrftoken`: CSRF protection token (extracted during `connect()`)
- Others: User agent, session cookies

## Test Script

**File:** `scripts/test-fb.ts`

### Usage

```bash
# JSON array format
ts-node scripts/test-fb.ts '[{"name":"c_user","value":"12345"},{"name":"xs","value":"abc123"},{"name":"csrftoken","value":"token123"}]'

# Plain string format
ts-node scripts/test-fb.ts 'c_user=12345; xs=abc123; csrftoken=token123'
```

### Script Flow

1. **Validation**: Checks for cookie argument
2. **Initialization**: Creates adapter with logger
3. **Connection**: Calls `connect()` to parse cookies
4. **Test Message**: Sends timestamped test message
5. **Cleanup**: Disconnects and exits with appropriate code

### Output Example

```
ðŸ” Initializing FacebookCookieAdapter...
ðŸ”— Connecting to Facebook...
[FB-ADAPTER] Cookie loaded
âœ… Connected successfully

ðŸ“¤ Sending test message to Facebook page...
[FB-ADAPTER] Post result: ok
âœ… Message sent successfully
   Response: { success: true }

ðŸ”Œ Disconnecting...
âœ… Disconnected
```

## Key Features

âœ… **Flexible input**: Accepts both JSON array and plain cookie strings  
âœ… **Automatic parsing**: `parseCookies()` utility handles conversion  
âœ… **CSRF extraction**: Automatically pulls token from cookies  
âœ… **Rate limiting**: Built-in rate limit tracking  
âœ… **Error handling**: Clear error messages with codes  
âœ… **Logging**: Optional debug logger for troubleshooting  

## Error Codes

- `FACEBOOK_COOKIE_POST_ERROR`: Request failed to send
- `RATE_LIMIT_EXCEEDED`: Hit rate limit (30/min)
- `FB_COOKIE_CONNECTION_FAILED`: Connection issue

## Notes

- Complies with Meta's Terms of Service (per adapter docs)
- Uses mobile user agent (iPhone)
- Target endpoint: `/api/v1/media/configure_text_post_app_feed/`
- Timeout: 15 seconds

