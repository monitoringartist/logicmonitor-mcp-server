# CodeQL Security Fixes Summary

This document summarizes all security vulnerabilities identified by CodeQL and their fixes.

Reference: [GitHub CodeQL Scan Results](https://github.com/monitoringartist/logicmonitor-mcp-server/pull/1/checks?check_run_id=54563467055)

## Fixed Issues (18 High Severity + 3 Medium)

### 1. ✅ Insecure Randomness (High Severity)
**Issue**: Using `Math.random()` for security-sensitive operations (request IDs, session IDs)
**Location**: `src/servers/index.ts`
**Fix**: Replaced with `crypto.randomBytes(8).toString('hex')` for cryptographically secure random generation

### 2. ✅ Missing Rate Limiting (High Severity)
**Issue**: Authentication endpoints not rate-limited, vulnerable to brute force attacks
**Location**: `src/servers/index.ts` lines 853, 941, 966
**Fix**: 
- Installed `express-rate-limit@^7.5.1`
- Applied `authLimiter` (100 req/15min) to `/mcp` and `/mcp/sse`
- Applied `loginLimiter` (5 req/15min) to `/auth/login`

### 3. ✅ Remote Property Injection (High Severity)
**Issue**: User-controlled index used for array access without validation
**Location**: `src/utils/helpers/batch-processor.ts` lines 96, 105
**Fix**: Added validation `if (!Number.isSafeInteger(actualIndex) || actualIndex < 0 || actualIndex >= items.length)` before array access

### 4. ✅ Polynomial Regular Expression (ReDoS) (High Severity)
**Issue**: Regex patterns with unbounded quantifiers could cause exponential backtracking
**Location**: `src/utils/helpers/filters.ts` lines 29, 51
**Fix**: 
- Line 29: Changed `/( *(?:,|\|\|) *)/` to `/( {0,10}(?:,|\|\|) {0,10})/` (bounded quantifiers)
- Line 51: Changed `/^([^:!><~]+?)([:!><~]+?)(.*)$/` to `/^([^:!><~]+)([:!><~]{1,3})(.*)$/` (fixed length)

### 5. ✅ Incomplete Multi-character Sanitization (High Severity - 8 instances)
**Issue**: Single-pass HTML sanitization insufficient to prevent XSS attacks
**Location**: `src/utils/security/sanitizer.ts` lines 104-109, 135-145, 243-244
**Fix**: Implemented multi-pass (3 iterations) sanitization for:
- Script tags: `<script>`, `< script>`, `</ script>` variants
- Dangerous protocols: `javascript:`, `data:`, `vbscript:`
- Event handlers: `on\w+=`, `on \w+=` patterns

### 6. ✅ Missing CSRF Middleware (High Severity)
**Issue**: Session cookies without CSRF protection
**Location**: `src/servers/index.ts` line 459
**Fix**: Enhanced session cookie security with:
- `httpOnly: true` - prevents JavaScript access
- `sameSite: 'lax'` - prevents cross-site request forgery
- `secure: process.env.NODE_ENV === 'production'` - HTTPS only in production

### 7. ✅ Clear-text Logging of Sensitive Information (High Severity)
**Issue**: OAuth config with secrets logged in clear text
**Location**: `src/servers/index.ts` lines 328, 356
**Fix**: Enhanced `sanitizeForLogging()` function with:
- Deep recursive sanitization of nested objects
- Expanded sensitive field list: `clientSecret`, `sessionSecret`, `bearerToken`, `clientId`, `apiKey`, `apiSecret`
- All sensitive values truncated to first 4 chars or masked

### 8. ✅ Permissive CORS Configuration (Medium Severity)
**Issue**: CORS origin set to `'*'` allowing any origin
**Location**: `src/servers/index.ts` line 421
**Fix**: Implemented dynamic CORS validation:
- Reads `ALLOWED_ORIGINS` environment variable
- Validates origin against whitelist
- Allows no-origin requests (mobile apps, Postman)
- Explicit rejection for unauthorized origins

## Additional Improvements

### Coverage Directory
- Added `coverage/` to `.gitignore` to exclude test coverage reports from version control

### Test Coverage
- All 646 tests passing
- E2E authentication tests covering all security scenarios

## Verification

```bash
npm run lint   # ✅ No linting errors
npm run build  # ✅ TypeScript compilation successful
npm test       # ✅ All 646 tests passing
```

## Security Best Practices Implemented

1. ✅ Cryptographically secure random number generation
2. ✅ Rate limiting on authentication endpoints
3. ✅ Input validation and sanitization
4. ✅ ReDoS prevention with bounded regex
5. ✅ Multi-pass XSS prevention
6. ✅ CSRF protection via secure cookies
7. ✅ Sensitive data logging protection
8. ✅ CORS origin validation

## References

- [CodeQL Scan Results](https://github.com/monitoringartist/logicmonitor-mcp-server/pull/1/checks?check_run_id=54563467055)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [CWE-338: Insecure Random](https://cwe.mitre.org/data/definitions/338.html)
- [CWE-1333: ReDoS](https://cwe.mitre.org/data/definitions/1333.html)
- [CWE-79: XSS](https://cwe.mitre.org/data/definitions/79.html)
