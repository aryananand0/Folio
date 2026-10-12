# Folio demonstration and submission

## Recording checklist

Keep the recording concise and narrate what each action proves.

1. Open the deployed Folio home page and identify the required stack.
2. Sign in and type a partial title on Discover. Show the live count, highlighted suggestions, and instant filtering.
3. Type `godfater` to show typo tolerance, then clear the field to restore the full catalog.
4. Search Open Library for a real title, open its details, and save it.
5. Open **My library** and show the book under **Want to Read**.
6. Change it to **Reading** or **Finished**, add a star rating and a short note, and save.
7. Refresh the browser to show that the status, rating, and note persisted.
8. Briefly show `prisma/schema.prisma`, one library Route Handler, and the owner-scoped query. Explain that Clerk supplies the trusted identity and Supabase stores the record.
9. Remove the book and show the resulting library state.
10. End on the repository README or the deployed home page.

Before recording, use a test account and non-sensitive note text. Close tabs that expose dashboards, environment variables, connection strings, or secret keys. Record at a readable zoom and verify the microphone before the final take.

## Final validation before recording

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

Also complete the public-site validation in [DEPLOYMENT.md](DEPLOYMENT.md). Do not use a local URL in the final demonstration unless the course explicitly permits it.

## GitHub Issue draft

Create this issue in the capstone team repository only after the video is uploaded and the deployed application is verified.

**Title**

```text
Research Milestone: aryananand0
```

**Body**

```markdown
## Folio research milestone

- Personal research repository: https://github.com/aryananand0/Folio
- Live application: https://folio-three-mocha.vercel.app
- Demonstration video: https://youtu.be/zIMoVq7zCXA

Folio is a full-stack personal reading library built with Next.js, React, TypeScript, Node.js, Clerk, Prisma, Supabase PostgreSQL, Open Library, npm, and Vercel. The demonstration covers discovery, authentication, private persistence, status, ratings, notes, refresh behavior, and removal.

REPLACE_WITH_REQUIRED_INSTRUCTOR_AND_STAFF_MENTIONS
```

Replace every placeholder and check the course roster for the exact mentions before submitting. The issue has not been created automatically.
