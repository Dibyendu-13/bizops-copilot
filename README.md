# M32 Copilot

M32 Copilot is a business-focused AI assistant for SMB operators. It ships with:
- secure signup, login, and logout
- persistent chat sessions with memory
- streaming responses
- web research with source snippets
- document upload and document-aware chat
- sidebar chat history and session switching
- a pinned default `New chat` plus fresh chat creation from the sidebar
- a multi-agent workflow for research, drafting, and critique

## Stack
- Next.js 15
- React 19
- MongoDB + Mongoose
- JWT auth
- OpenAI API
- Tailwind CSS

## Local setup
1. Copy `.env.example` to `.env.local`.
2. Fill in the required environment variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `OPENAI_API_KEY`
   - `OPENAI_MODEL` if you want to override the default
3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Start the app:
   ```bash
   npm run dev
   ```

## Core routes
- `/` landing page
- `/signup` create account
- `/login` sign in
- `/chat` main assistant experience
- `/documents` upload and inspect files
- `/settings` placeholder for profile/settings

## What the assistant can do
- Remember user-provided facts during a chat session
- Search the web when asked to research something
- Use uploaded documents as context for answers
- Stream responses incrementally for a more natural chat experience
- Generate a real chat title from the conversation instead of leaving everything as a generic thread
- Show a visible multi-agent trace when multi-agent mode is enabled

## Deployment
Recommended platform: Vercel

1. Push the repository to GitHub.
2. Import the repo into Vercel.
3. Set the same environment variables used in `.env.local`.
4. Ensure `MONGODB_URI` points to a production database.
5. Verify `JWT_SECRET` is strong and unique.
6. Confirm `OPENAI_API_KEY` is set in the deployment environment.
7. Deploy.

## Demo flow
1. Sign up and log in.
2. Use the pinned `New chat` as the default starting thread.
3. Send a message, then tell the assistant your name and ask it to recall it.
4. Create a second chat from `+ New chat` and switch between threads from the sidebar.
5. Turn on multi-agent mode and ask it to research a current business topic.
6. Upload a PDF and ask a follow-up question about it.
7. Rename or delete a chat from the `⋯` menu.

## Security note
- Do not commit secrets to GitHub.
- Keep `.env.local` out of version control.
- Rotate credentials if they are ever exposed.

## Status
This project was built from scratch and tuned to show product thinking, tool use, multi-agent orchestration, and rapid prototyping for a real SMB workflow.
