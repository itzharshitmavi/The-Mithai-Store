# Setup fixes in this copy

This is a setup-fix copy of the supplied ZIP, not a claim that the whole system has passed a build or production QA.

- Reformatted Prisma generator, datasource, and enum declarations into standard multiline Prisma Schema Language syntax.
- Corrected the local Docker PostgreSQL URL in `.env.example` to match `docker-compose.yml`.
- Added `dotenv` and `import "dotenv/config"` so the standalone `tsx prisma/seed.ts` command can read `.env` values.
- Hide the online-payment option unless Razorpay key ID, key secret, and webhook secret are all configured.
- Expanded README with Windows PowerShell setup commands and production-readiness notes.

Verification limitation: dependency installation was attempted in the review environment but the npm registry could not be reached (`EAI_AGAIN`). So `prisma validate`, TypeScript build, migration, browser flows, and payment webhooks still need to be run locally.
