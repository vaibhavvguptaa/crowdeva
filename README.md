## Session Storage

This project now uses file-based session storage for managing user sessions. Sessions are stored in a `.sessions.json` file in the project root directory.

For production deployments, it's recommended to:
1. Ensure the `.sessions.json` file is properly secured and backed up
2. Consider using a more robust storage solution for high-traffic applications

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Server-Side Authentication

This project now implements server-side authentication to protect API routes from unauthorized access. Key features include:

1. Session management with server-side JWT verification
2. API route protection with authentication middleware
3. Role-based access control for privileged operations
4. Global middleware for application-wide protection

For detailed implementation information, see [SERVER_SIDE_AUTHENTICATION.md](SERVER_SIDE_AUTHENTICATION.md).

## Testing

This project includes various types of tests, all consolidated in a single `test/` directory:

1. Unit/Integration tests using Vitest and React Testing Library (located in `test/unit/`)
2. Manual test pages for UI verification (located in `test/pages/`)
3. API test routes for backend testing (located in `test/api/`)
4. Standalone test scripts organized by functionality (located in `test/scripts/`):
   - Authentication tests (`test/scripts/auth/`)
   - Database tests (`test/scripts/database/`)
   - Keycloak tests (`test/scripts/keycloak/`)
   - Utility scripts (`test/scripts/util/`)
5. Test components (located in `test/components/`)

To list all test files in the project:
```bash
npm run test:list
```

To run unit/integration tests:
```bash
npm run test
```

To run tests in watch mode:
```bash
npm run test:watch
```

To run specific test categories:
```bash
# Authentication tests
npm run test:auth
npm run test:auth-flow
npm run test:auth-performance
npm run test:multiple-auth

# Database tests
npm run test:database
npm run test:db-connection
npm run test:connection-pool
npm run test:connection-pool-direct

# Keycloak tests
npm run test:keycloak
npm run test:keycloak-realms
```

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Production Deployment

For production deployment considerations, including whether to include test files, see our [Production Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md).

## Authentication / Keycloak Configuration

Environment variables relevant to Keycloak integration:

Variable | Purpose
-------- | -------
`NEXT_PUBLIC_KEYCLOAK_URL` | Base URL of Keycloak instance (public)
`KEYCLOAK_ADMIN` | Admin username for user provisioning (server only)
`KEYCLOAK_ADMIN_PASSWORD` | Admin password for provisioning (server only)
`KEYCLOAK_REQUIRE_TOTP` | If `true`, new users are created with `CONFIGURE_TOTP` required action so first login forces authenticator enrollment

When `KEYCLOAK_REQUIRE_TOTP=true`, the signup API adds `requiredActions: ['CONFIGURE_TOTP']` to new users. On first login Keycloak will prompt the user to scan a QR code with an authenticator app (e.g. Authy, Google Authenticator) and confirm a 6‑digit code before granting access.

## Permanent Admin Account

To resolve the Keycloak "temporary admin user" warning, a script is provided to create a permanent admin account:

```bash
npm run keycloak:create-admin
```

This will create an admin user with the username `keycloak-admin` and the same password as the temporary admin. You can customize the credentials using environment variables:

- `PERMANENT_ADMIN_USERNAME` - Username for the permanent admin (default: keycloak-admin)
- `PERMANENT_ADMIN_EMAIL` - Email for the permanent admin (default: admin@keycloak.local)
- `PERMANENT_ADMIN_PASSWORD` - Password for the permanent admin (default: same as KEYCLOAK_ADMIN_PASSWORD)

After running this script, you can log in to the Keycloak admin console with the new credentials and optionally disable the temporary admin account for enhanced security.