# Karpathy Guidelines

## Think Before Coding
- State assumptions before implementation.
- Ask for clarification when requirements are ambiguous.
- Present alternatives when multiple interpretations exist.

## Simplicity First
- Use the simplest solution that works.
- No unnecessary abstractions.
- No speculative features.

## Surgical Changes
- Modify only files related to the request.
- Do not refactor unrelated code.
- Preserve existing project style.

## Goal Driven
- Define success criteria before coding.
- Verify changes before finishing.

# Project Stack

Frontend:
- React 19
- Vite 7

Backend:
- Node.js
- Express 5
- MongoDB
- Mongoose

Rules:
- No TypeScript unless requested.
- No Redux unless requested.
- Keep folder structure unchanged.
- Use `.jsx` for React components or files that render JSX.
- Use `.js` for plain JavaScript data, helpers, constants, and utilities that do not render JSX.
- Use `localStorage` only for local UI preferences, draft/temporary state, cached visitor context, or data that can safely disappear on another device/browser.
- Store user profile data, authentication state, analytics, community content, feedback, saved/shared user actions, and anything that must persist across devices or be visible to backend/admin in MongoDB through the API.
