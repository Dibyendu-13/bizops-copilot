# Deployment Guide

## Recommended: Vercel
1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Add the following environment variables in the Vercel project settings:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` if you want to override the default
4. Make sure `MONGODB_URI` points to a production MongoDB database.
5. Make sure `JWT_SECRET` is long, random, and unique to production.
6. Deploy the app.

## Pre-deploy checklist
- `npm run build` passes locally.
- `.env.local` is not committed.
- The database connection points to production, not local development.
- The OpenAI key works in the deployment environment.
- Signup, login, and logout work end to end.
- Chat streaming works.
- Document upload works and uploaded files appear in the UI.
- Chat history/session switching works from the sidebar.

## Optional: Render
If you prefer Render, use the same environment variables and start command:
```bash
npm install --legacy-peer-deps
npm run build
npm start
```

## Handoff note
Do not commit secrets to the repository. If any key has been exposed, rotate it before submission.
