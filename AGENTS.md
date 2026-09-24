# Coding Rules

## Before changing code

1. Read the relevant files before editing.
2. Read contextHistory.md before making changes.
3. Inspect the existing architecture instead of replacing working systems.
4. Search the repository for existing implementations before creating new ones.

## Planning

1. Break non-trivial tasks into a TODO list.
2. Identify dependencies between tasks.
3. Implement one logical task at a time.
4. Keep the TODO list updated.

## Implementation

1. Make the smallest changes necessary.
2. Reuse existing components and utilities.
3. Do not rewrite working code without a reason.
4. Keep frontend and backend contracts synchronized.

## Testing

After making changes:

1. Run the relevant build/test commands.
2. Check for TypeScript/JavaScript errors.
3. Fix errors before declaring the task complete.
4. Verify that the requested feature actually works.

## Git

- Pull before beginning work.
- Never overwrite another contributor's work.
- Commit logical changes.
- Push completed changes when appropriate.

## Context history

Before editing:

- Read contextHistory.md.

After completing meaningful changes:

- Append:
  - date
  - agent
  - files changed
  - what changed
  - why
  - important implementation details
