---
name: ship
description: Branch, commit with Conventional Commits, push and open a PR.
disable-model-invocation: true
---

1. `npm run check`. Stop on failure.
2. Not on a feature branch → `git switch -c <type>/<short-slug>`.
3. Stage only files belonging to this task. Commit `type(scope): summary` (≤72 chars, imperative). Body only if the why isn't obvious.
4. `git push -u origin HEAD`, then `gh pr create --fill` using `.github/pull_request_template.md`; title = commit subject.
5. Reply with the PR URL only.
