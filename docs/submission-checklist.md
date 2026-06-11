# Submission Checklist

Use this checklist in the same order a reviewer is likely to experience the app.

## 1) Auth and entry flow
- [ ] Open the landing page and confirm the product positioning is clear
- [ ] Sign up with a brand-new email and password
- [ ] Confirm signup lands in the authenticated app
- [ ] Log out from the app shell
- [ ] Log in again with the same account
- [ ] Confirm the session survives navigation and page refresh
- [ ] Try opening `/chat` while logged out and confirm it redirects or blocks access

## 2) Chat basics
- [ ] Open `/chat` and confirm the main chat window loads without layout breakage
- [ ] Send a normal message and confirm the assistant responds
- [ ] Send a follow-up in the same chat and confirm the assistant continues the same thread
- [ ] Confirm streamed responses appear progressively instead of waiting for the full answer
- [ ] Confirm long conversations stay inside a scrollable chat window

## 3) Session memory
- [ ] Say a simple fact in one chat, such as your name or company
- [ ] Ask the assistant to recall that fact later in the same session
- [ ] Refresh the page and confirm the current chat still loads correctly
- [ ] Start a second chat and confirm it has its own separate context

## 4) Chat history and switching
- [ ] Confirm recent chat threads appear in the sidebar
- [ ] Create a new chat from the sidebar
- [ ] Switch between two different chats from the sidebar
- [ ] Confirm each thread keeps its own title, message history, and memory
- [ ] Confirm the sidebar still works after navigation and refresh

## 5) Research mode
- [ ] Ask a question that triggers research mode, such as a query with `research`, `latest`, `compare`, or `pricing`
- [ ] Confirm the response uses web-backed context instead of a generic answer
- [ ] Check that the answer reflects the research snippets or source-style references
- [ ] Confirm research mode does not break normal chat questions

## 6) Documents
- [ ] Open `/documents`
- [ ] Upload a text-based PDF or other supported file type
- [ ] Confirm the uploaded document appears in the documents list
- [ ] Ask the chat to summarize the uploaded document
- [ ] Ask for action items, risks, dates, or names from the document
- [ ] Confirm the assistant uses the uploaded content in follow-up answers

## 7) Responsive and mobile behavior
- [ ] Test the app on a narrow mobile-width browser window
- [ ] Confirm the chat view uses a bounded scrollable window on mobile
- [ ] Confirm the message composer stays visible while scrolling
- [ ] Confirm the sidebar/menu is usable on mobile
- [ ] Confirm the Workbench / chat layout still feels correct on desktop widths
- [ ] Check that no major panels overlap on mobile or tablet widths

## 8) Empty states and errors
- [ ] Try sending an empty chat message and confirm it is handled gracefully
- [ ] Try logging in with the wrong password and confirm the error is clear
- [ ] Try signing up with an existing email and confirm the error is clear
- [ ] Confirm empty chat and empty document states are understandable

## 9) Submission hygiene
- [ ] Confirm no secret keys are committed to source files
- [ ] Confirm `.env.local` is not committed
- [ ] Push the final code to GitHub
- [ ] Deploy to Vercel or Render
- [ ] Test the deployed URL end to end
- [ ] Record a short demo video
- [ ] Submit the project form and email Clarissa
