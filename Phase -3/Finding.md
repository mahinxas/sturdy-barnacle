# Security Check of the Booking System

## 5 Critical Issues Identified

### 1. **Content Security Policy (CSP) Header Not Set Completely**

- **What is wrong?**
  The Content Security Policy (CSP) header lacks specifications for advanced directives, such as `connect-src` and `font-src`, making it vulnerable to XSS and injection attacks.
- **How did you find it?**
  This was identified through ZAP scan reports in both the first and second rounds. The alert specifies that the current CSP implementation is insufficient for mitigating all potential attack vectors.
- **How should it work/What should be fixed?**
  The CSP header should be expanded to include:
  ```
  Content-Security-Policy: default-src 'self'; connect-src 'self'; font-src 'self'; img-src 'self'; script-src 'self'; style-src 'self';
  ```
  This will mitigate XSS, reduce data exfiltration risks, and prevent external script/font injection.

### 2. **Session Handling Vulnerabilities**

- **What is wrong?**
  Sessions are stored in memory, which is insecure for production and can lead to loss of session data on server restart. Additionally, the `session_id` cookie does not enforce `Secure` and `HttpOnly` flags consistently.
- **How did you find it?**
  Inspection of the `sessionService.js` file revealed in-memory session storage and lack of cookie security settings.
- **How should it work/What should be fixed?**
  - Move session storage to a database for persistence and scalability.
  - Set `Secure` and `HttpOnly` flags on session cookies to protect against interception and JavaScript access.
  ```
  "Set-Cookie": "session_id=unique_value; Secure; HttpOnly; SameSite=Strict"
  ```

### 3. **Missing Anti-clickjacking Header**

- **What is wrong?**
  The `X-Frame-Options` header is currently set globally, but some routes may override it unintentionally.
- **How did you find it?**
  This issue was highlighted in the ZAP scan and further verified by reviewing the middleware in `app.js`.
- **How should it work/What should be fixed?**
  Ensure the `X-Frame-Options: DENY` or `Content-Security-Policy: frame-ancestors 'none';` header is consistently applied across all responses to prevent clickjacking.

### 4. **Error Disclosure**

- **What is wrong?**
  The application exposes stack traces and error messages in responses, leaking internal server details to potential attackers.
- **How did you find it?**
  ZAP scans flagged an "Application Error Disclosure" for `POST /register` and other routes.
- **How should it work/What should be fixed?**
  Replace error messages with generic responses. Log detailed errors on the server instead. For example:
  ```javascript
  if (error) {
      console.error(error); // Server-side logging
      return new Response("An unexpected error occurred. Please try again later.", { status: 500 });
  }
  ```

### 5. **Role-Based Access Control (RBAC) Weaknesses**

- **What is wrong?**
  The system lacks role-based access control, potentially allowing unauthorized users to access restricted resources (e.g., `/resourcesList` and `/reservation` endpoints).
- **How did you find it?**
  Code inspection revealed that no RBAC checks are implemented in `app.js` or relevant route handlers.
- **How should it work/What should be fixed?**
  Implement middleware to enforce RBAC. For example:
  ```javascript
  function authorize(role) {
      return (req, handler) => {
          const session = getSession(req);
          if (!session || session.role !== role) {
              return new Response("Unauthorized", { status: 403 });
          }
          return handler(req);
      };
  }
  ```
  Apply this middleware to routes requiring specific roles.

## Comparison to Specs

- **Observation:** The system specification requires secure handling of user data and robust authentication mechanisms.
- **Contradictions:**
  - Lack of session persistence and secure cookie flags contradict secure session handling requirements.
  - Missing RBAC contradicts the requirement for resource-specific access restrictions.

## Link to Logbook

Refer to the logbook for detailed development history: 

Phase- 1 : 

Phase -2 :

