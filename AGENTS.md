# Agent Rules

## Git Commit Rule
- ALWAYS commit changes to git after completing any task or feature
- Never leave uncommitted changes without asking the user first
- Use descriptive commit messages
- Stage all relevant files before committing

## Permanent Git Workflow

### 1. Automatically commit after every completed meaningful task

Whenever a task is successfully completed:

* Check `git status`
* Review the relevant changes with `git diff`
* Stage only the files related to that task
* Create a meaningful Git commit
* Push the commit to `origin main`

Do this automatically without waiting for the user to say "commit and push".

### 2. Small changes should also be committed

Even relatively small completed tasks should receive their own commit when appropriate:

* UI changes
* Styling changes
* Text/content changes
* Bug fixes
* Component changes
* Configuration changes
* Dependency changes
* API changes
* Refactoring
* Documentation changes

Do not unnecessarily combine unrelated tasks into one commit.

### 3. Use meaningful commit messages

Prefer Conventional Commit style:

* `feat: add product search`
* `fix: resolve login validation issue`
* `style: improve product card layout`
* `refactor: simplify cart logic`
* `docs: update deployment instructions`
* `chore: update dependencies`

The commit message should clearly describe what was changed.

### 4. Standard workflow after each completed task

```bash
git status
git diff
git add <relevant-files>
git commit -m "<meaningful commit message>"
git push origin main
```

Do not blindly use `git add .` if there are unrelated or unfinished changes in the working tree.

### 5. Protect secrets

NEVER commit or push:

* `.env` files containing secrets
* API keys
* Passwords
* Access tokens
* Private credentials
* Database credentials
* Cloud service secrets
* Other sensitive information

Respect `.gitignore` and verify that sensitive files are not accidentally staged.

### 6. No empty commits

If there are no actual changes after completing a task, do not create an empty commit.

### 7. Do not rewrite Git history

Never perform these without explicit user permission:

* `git push --force`
* `git reset --hard`
* Destructive history rewriting
* Rebasing shared history

The normal workflow should preserve the existing Git history.

### 8. Protect unrelated user changes

Before committing, check the working tree carefully.

If there are existing changes that were not caused by the current task, do NOT include them in the current commit.

Only commit files/changes relevant to the completed task.

### 9. Push failures must be reported

If `git push origin main` fails:

* Do not silently ignore it.
* Investigate the reason if possible.
* Do not claim the task is fully synchronized with GitHub unless the push actually succeeds.
* Clearly tell the user that the push failed and why.

### 10. This must survive OpenCode restarts

The Git workflow is stored as a **permanent project-level instruction in `AGENTS.md`**.

Whenever OpenCode is reopened in this project, it must read and follow `AGENTS.md` and continue automatically using this commit-and-push workflow.

The user should not need to remind about Git commits or pushes in future sessions.
