# StockArena — Project AGENTS.md

> Project rules for `https://github.com/montypal/Stock_Arena.git` (`main`).
> Global personal rules live in `~/.config/opencode/AGENTS.md` and still apply; where the two conflict, this file wins for this repo.

## Before Making Any Code Changes

Before making any code changes, always check the GitHub remote for new commits. If the remote has changes that I don't have locally, pull them first and make sure my working tree is safe before editing.

Do not overwrite, discard, reset, or force-push anyone else's work.

If there are local uncommitted changes that could conflict with the incoming changes, stop and tell me before modifying anything.

After pulling successfully, proceed with my requested task.

## Context History

`contextHistory.md` is the shared project history file. It must be kept up to date whenever a meaningful change is made to the project.

### Before Making Changes

Before modifying project files:

1. Read `contextHistory.md` to understand the project's recent changes, decisions, current state, and work completed by other collaborators.
2. Check GitHub for newer changes before editing.
3. Pull newer changes when it is safe to do so.
4. Re-read `contextHistory.md` after pulling if it changed.
5. Never overwrite or discard another collaborator's work.

### After Making Changes

After completing a meaningful change:

1. Update `contextHistory.md`.
2. Add a new entry describing what was changed.
3. Include:

   * Date and time the change was made
   * Who made the change
   * A concise description of the change
   * Important implementation details or decisions
   * Any remaining issues or follow-up work, if applicable
4. Do not rewrite or delete previous history entries unless explicitly asked.
5. Keep entries in chronological order, with the newest entry at the top.
6. Make the entry concise but detailed enough that another AI or developer can understand what happened without having to inspect every changed file.

### Change Author

Use the actual developer/AI identity responsible for the change.

For example:

* `Jc — OpenCode`
* `FriendName — Claude Code`

Do not claim that another person or AI made a change.

If the author identity or current date/time is unknown, determine it from the available Git configuration or environment before creating the entry.

### Git

When completing a task, make sure the `contextHistory.md` update is included in the same commit as the code changes so the project history and the corresponding code change stay together.

Never remove historical entries simply to shorten the file.
