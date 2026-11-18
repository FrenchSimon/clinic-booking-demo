# Security

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private vulnerability reporting ("Security" tab, "Report a vulnerability"). You will get an answer within 3 working days.

## How this project protects data

- Row level security on every table: a user can only read and change their own rows, even when calling the database API directly.
- Authentication is checked on the server in every Server Action and route handler.
- Every input is validated with Zod on the server.
- Secrets are only available on the server and are never committed. CI scans every push for leaked secrets (gitleaks).
- Security headers: Content Security Policy, HSTS, no framing, no MIME sniffing, strict referrer policy.
- Public forms are rate limited.
- Dependencies are updated weekly (Renovate).
