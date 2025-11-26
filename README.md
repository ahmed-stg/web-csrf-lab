# CSRF & Session Security Attack Demo Lab

This lab demonstrates common web authentication mechanisms and their vulnerabilities, focusing on Cross-Site Request Forgery (CSRF) attacks. It includes both a secure and a vulnerable implementation for educational purposes.

## Project Structure
- **frontend/**: Secure and vulnerable user management UIs
- **malicious/**: Attack companion site for launching CSRF attacks
- **server.js / app.js**: Node.js/Express backend
- **malicious_server.py**: Python HTTP server for simulating a malicious origin
- **mongo-data/**: MongoDB data volume (ignored in git)

## How to Run
1. **Start MongoDB and Node server** (recommended: use Docker Compose):
   ```bash
   docker compose up -d
   docker compose exec -it node npm run start
   ```
2. **Start the malicious server** (in a separate terminal):
   ```bash
   python3 malicious_server.py
   ```
3. Open the following in your browser:
   - [http://localhost:3000/frontend/index.html](http://localhost:3000/frontend/index.html) (secure UI)
   - [http://localhost:3000/frontend/index_vuln.html](http://localhost:3000/frontend/index_vuln.html) (vulnerable UI)
   - [http://localhost:8111/index.html](http://localhost:8111/index.html) (attack companion)

## Cookie-Based Session Vulnerability
**Cookie-based authentication** stores session tokens in browser cookies. Browsers automatically attach cookies to every request to the matching domain, regardless of where the request originated. This means:
- If a user is logged in, any website can trigger requests (e.g., via `<img>`, `<form>`, or JavaScript) to the target site, and the browser will include the session cookie.
- This enables **CSRF attacks**: a malicious site can perform actions as the user without their consent.
- Mitigations include using SameSite cookies, CSRF tokens, and preferring stateless authentication.

## JWT (JSON Web Token) Authentication
**JWT-based authentication** typically stores the token in `localStorage` or `sessionStorage`, and the client must explicitly attach it (e.g., via the `Authorization` header) in API requests. Browsers do **not** send JWTs automatically with every request:
- This makes CSRF attacks much harder, since a malicious site cannot access or send the JWT unless it is explicitly provided by the user or compromised via XSS.
- JWTs are stateless and can be validated without server-side session storage.

## How Browsers Handle Cookies vs. JWTs
- **Cookies**: Sent automatically by the browser with every request to the domain, including cross-origin requests (unless `SameSite=Strict` or `Lax` is set).
- **JWTs**: Not sent automatically; must be added to requests by frontend code. Not accessible to other sites unless XSS is present.

## Educational Purpose
This lab is for demonstration and learning only. Do not use these techniques in production or against systems you do not own.

---

**See `csrf_pocs.md` and the `malicious/` folder for attack scripts and PoCs.**
