---
name: ship
description: Branch, commit with Conventional Commits, push and open a PR.
disable-model-invocation: true
---

1. `npm run check`. Stop on failure. Then, in parallel, run the `reviewer` agent on the diff (and `qa` with the changed route when the change is visual). Any P0 row or `fix needed` verdict stops the ship; show it.
2. Not on a feature branch → `git switch -c <type>/<short-slug>`.
3. Stage only files belonging to this task. Commit `type(scope): summary` (≤72 chars, imperative). Body only if the why isn't obvious.
4. `git push -u origin HEAD`, then `gh pr create --fill` using `.github/pull_request_template.md`; title = commit subject.
5. Reply with the PR URL only.

6. On merge approval only (never merge unasked; offer it in one line after step 5): confirm `gh pr checks` has no required failure, then `gh pr merge --squash --delete-branch` for the current branch's PR, `git switch main && git pull --ff-only`. Stop and report if any of these fail. Then, without further prompts, write `STATE.md` as `.claude/skills/handoff/SKILL.md` describes (Task = what shipped, Branch = main, Blocked = none, Next = open items) and end with `Ready for /clear.`
