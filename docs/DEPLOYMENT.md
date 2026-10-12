# Deploy Folio to Vercel

Folio is a single Next.js application, so Vercel needs no custom `vercel.json`. The repository already declares Node.js 24, generates Prisma Client during `postinstall`, and builds with `next build`.

## 1. Prepare the repository

Commit and push the finished source yourself:

```bash
git status
git diff --check
git add -A
git commit -m "Document and prepare deployment"
git push origin main
```

Do not commit `.env.local`, `.vercel/`, database passwords, or Clerk secret keys.

## 2. Verify Supabase

Use the two connection strings from the Supabase **Connect** panel:

| Variable | Supabase mode | Purpose |
|---|---|---|
| `DATABASE_URL` | Transaction pooler, port 6543 | Queries from Vercel functions |
| `DIRECT_URL` | Session pooler or direct connection, port 5432 | Prisma migrations |

For the transaction URL, retain `pgbouncer=true` and `connection_limit=1` for the small serverless deployment. Folio also caps each production adapter pool at one connection:

```text
postgresql://postgres.PROJECT_REF:PASSWORD@POOLER_HOST:6543/postgres?pgbouncer=true&connection_limit=1
```

URL-encode special characters in the password. Then run:

```bash
npm run deploy:check
npm run db:status
npm run db:deploy
npm run db:check
```

`db:deploy` applies only the migrations already committed under `prisma/migrations/`. Run it before the deployment when using a new database. Folio deliberately does not run migrations in every Vercel build because parallel preview builds should not compete to modify one shared database.

## 3. Import the GitHub repository

1. Open the [Vercel New Project page](https://vercel.com/new).
2. Import `aryananand0/Folio`.
3. Keep the project root as the repository root.
4. Confirm the framework preset is **Next.js**.
5. Leave Install Command and Build Command at their detected defaults.
6. Confirm Node.js is **24.x**. The `engines.node` field in `package.json` also selects it.

Every later push to `main` will create a new production deployment. Non-production branches create preview deployments when Git integration is enabled.

## 4. Add environment variables

Add these in **Project → Settings → Environment Variables**. Paste values without surrounding quotes.

| Variable | Required | Scope | Notes |
|---|---:|---|---|
| `DATABASE_URL` | Yes | Production | Supabase transaction pooler, port 6543 |
| `DIRECT_URL` | Yes | Production | Supabase session/direct URL, port 5432 |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Production | Browser-visible Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Production | Server-only Clerk key |
| `OPEN_LIBRARY_CONTACT_EMAIL` | Recommended | Production | Sent only in Folio's server-side User-Agent |

If you want fully functional preview deployments, add an isolated preview database and Clerk development keys under the **Preview** scope. Avoid pointing untrusted preview branches at a production database.

Only `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is intentionally included in browser JavaScript. The other values must remain server-only.

## 5. Choose the Clerk deployment mode

For a university demonstration on a `*.vercel.app` URL, use the existing Clerk **development** key pair. This remains a development Clerk instance even though Vercel labels the deployment “Production.”

For a real production Clerk instance:

1. Add a custom domain to Vercel.
2. Create or activate Clerk's production instance for that domain.
3. Configure any production OAuth provider credentials.
4. Replace the Vercel Production variables with the matching `pk_live_` and `sk_live_` keys.
5. Redeploy after changing variables.

The publishable and secret keys must come from the same Clerk instance.

## 6. Deploy

Select **Deploy** in Vercel. The expected build sequence is:

```text
npm install
postinstall → prisma generate
npm run build → next build
```

The build should detect a Next.js application and produce dynamic routes for the home page, private library, Clerk pages, and API Route Handlers.

## 7. Validate the deployed URL

Use a fresh browser session and verify:

- The signed-out home page loads without server errors.
- `/library` redirects signed-out visitors to `/sign-in`.
- Sign-up, sign-in, account controls, and sign-out work.
- Search returns real Open Library books.
- `godfater` resolves to *The Godfather*.
- Clearing search restores the discovery total.
- Saving a book creates one record, and saving it twice creates no duplicate.
- Status, rating, and notes remain after refresh and a new sign-in.
- Removing the book deletes it.
- A second account cannot see the first account's books.
- The layout works at phone width.
- Vercel runtime logs contain no database, Clerk, or Open Library errors.

After verification, update the README's deployment section with the real URL. Do not claim deployment is complete until this checklist passes.

## 8. Troubleshooting

| Symptom | Check |
|---|---|
| Build cannot import Prisma Client | Confirm `postinstall` ran `prisma generate` |
| Database authentication fails | Remove copied quote characters and URL-encode the password |
| Database connections time out | Confirm `DATABASE_URL` uses transaction mode on port 6543 |
| Migrations fail | Confirm `DIRECT_URL` uses port 5432 and run `npm run db:status` |
| Clerk renders as unconfigured | Confirm both Clerk variables exist in the deployment's environment scope |
| Auth works locally but not at the deployed domain | Check the Clerk instance/domain and that both keys come from that instance |
| A variable was added after deployment | Redeploy; Vercel variables apply to new deployments |

Official references:

- [Vercel: Next.js](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel: environment variables](https://vercel.com/docs/environment-variables)
- [Vercel: supported Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions)
- [Clerk: deploy to Vercel](https://clerk.com/docs/guides/development/deployment/vercel)
- [Clerk: production deployment](https://clerk.com/docs/guides/development/deployment/production)
- [Supabase: Prisma](https://supabase.com/docs/guides/database/prisma)
- [Supabase: database connections](https://supabase.com/docs/guides/database/connecting-to-postgres)
