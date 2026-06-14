# Decibel Security and Deployment Guide

This document outlines the security controls, architecture, and deployment procedures required to transition the Decibel application from a local development environment to a secure production setup.

---

## 1. Database Hashing & Storage Security

By default, the development environment utilizes plaintext passwords stored in a local SQLite file (`decibel.db`). For production environments, you must implement strong password hashing and secure data storage.

### Hashing with Bcrypt
Plaintext passwords should **never** be stored. Implement password hashing using `bcrypt` (or `argon2id`):

1. **Install dependencies**:
   ```bash
   pip install bcrypt
   ```
2. **Implement in backend registration (`main.py`)**:
   ```python
   import bcrypt

   def hash_password(password: str) -> str:
       # Generate salt and hash
       salt = bcrypt.gensalt(rounds=12)
       hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
       return hashed.decode('utf-8')

   def verify_password(plain_password: str, hashed_password: str) -> bool:
       return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
   ```

### SQL Database Encryption
To encrypt the SQLite database at rest (against physical access attacks):
- Use **SQLCipher**, an open-source extension for SQLite that provides transparent 256-bit AES encryption.
- **Python Integration**: Replace `sqlite3` import with `pysqlcipher3`:
  ```python
  from pysqlcipher3 import dbapi2 as sqlite3
  conn = sqlite3.connect('decibel.db')
  conn.execute("PRAGMA key = 'YOUR_SECRET_DB_PASSPHRASE'")
  ```

---

## 2. OAuth2 JWT Token-Based Authentication

Replace the session-based state checking with standardized OAuth2 using JSON Web Tokens (JWT).

### Implementation Architecture
1. **Endpoint Access**: Clients query `/api/auth/token` with credentials and receive a JWT token on success.
2. **Client Storage**: Store the JWT token securely in a HttpOnly, Secure cookie (preferable to prevent XSS) or locally within a private memory store.
3. **Protected Endpoints**: Backend endpoints require the HTTP header:
   ```http
   Authorization: Bearer <JWT_TOKEN>
   ```

### Code Example (using `pyjwt` or `jose`):
```python
import jwt
from datetime import datetime, timedelta

SECRET_KEY = "super-secret-key-change-in-production"
ALGORITHM = "HS256"

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=60))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload.get("sub")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid credentials")
```

---

## 3. HTTPS / TLS Configuration

For production, all client-server communication must be encrypted using Transport Layer Security (TLS/HTTPS) to prevent man-in-the-middle (MITM) and session hijacking attacks.

### Backend Uvicorn Setup
Ensure you bind HTTPS certificates locally or run the app behind a reverse proxy (Nginx / Caddy).

To run uvicorn directly with SSL:
```bash
uvicorn main:app \
  --host 0.0.0.0 \
  --port 8000 \
  --ssl-keyfile ./privkey.pem \
  --ssl-certfile ./fullchain.pem
```

### Vite Frontend HTTPS
Enable HTTPS in Vite development server configuration (`vite.config.js`):
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync('./key.pem'),
      cert: fs.readFileSync('./cert.pem'),
    },
    port: 5174
  }
})
```

---

## 4. macOS Firewall Configuration Rules

Secure your local execution machine by setting packet filter rules to limit external access.

### macOS application-level firewall
1. Open **System Settings** > **Network** > **Firewall**.
2. Turn Firewall **On**.
3. Click **Options...** and toggle:
   - "Block all incoming connections" (if you want absolute stealth).
   - Or specifically whitelist only `/Users/aniruthreddy/.gvm/.../python` and `node` to allow localhost development.

### Advanced Packet Filter (`pfctl`) Rule Rules
To restrict access to backend port `8000` to localhost only:

1. Edit `/etc/pf.conf` and add the rule:
   ```text
   block in on en0 proto tcp from any to any port 8000
   pass in on lo0 proto tcp from any to any port 8000
   ```
2. Parse and enable the rules:
   ```bash
   sudo pfctl -vnf /etc/pf.conf   # test configuration
   sudo pfctl -ef /etc/pf.conf    # enable PF packet filter
   ```

---

## 5. Security Checklist

- [ ] Change `SECRET_KEY` in environment variables.
- [ ] Ensure database files (`*.db`) are added to `.gitignore`.
- [ ] Force HTTPS redirects in Nginx reverse proxy.
- [ ] Enforce rate-limiting on registration (`/api/auth/register`) and login (`/api/auth/login`) to prevent brute-force attacks.
- [ ] Sanitize search input queries to prevent SQL injections or query manipulation.
