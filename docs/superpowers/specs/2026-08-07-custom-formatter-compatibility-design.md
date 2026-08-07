# Custom Formatter Compatibility Design

## Goal

Reintroduce the five commits from BetterFormatter PR #3 and the custom formatter upload commit without breaking any public JSON or image URL that existed before PR #3.

The current `feat/customformatter` checkout must remain untouched so editor-only or future local work is not included in the pull request.

## Branch and history

Create `feat/customformattercompat` from the current upstream `main` at `d96eaa1`. Work only in a separate Git worktree.

Reapply the five PR #3 commits individually and in their original order:

1. `6dd29cd` — modern and legacy badge families
2. `e6062e1` — shared seven-bit protocol configuration
3. `9ef2303` — universal AIOStreams formatter catalog
4. `05bbf6f` — marker-based Fusion filter catalog
5. `b63eef8` — matched formatter configurator

Add the compatibility fix as its own commit, then reapply `4cca29b`, the custom formatter upload feature. This preserves a reviewable history while making the final branch relative to the latest upstream `main`.

## Compatibility behavior

PR #3 introduced the new `assets/badges/` and `exports/` layouts. Those layouts remain canonical for new downloads.

The compatibility layer restores every public path removed or renamed by PR #3:

- all pre-PR #3 files below `images/`
- all pre-PR #3 files below `presets/`
- root-level `fusion-tags.json`

These files are restored byte-for-byte from `d9b5513`, the commit immediately before PR #3. Existing raw GitHub URLs therefore retain both their path and payload, while new features continue using the new generated exports and badge assets.

Because raw GitHub URLs cannot redirect, retaining compatibility copies is preferable to redirects or symlinks.

## Tests

Add a regression test before restoring the compatibility files. It must fail on the reapplied PR #3 state and pass after the fix.

The test will:

- use an explicit manifest of all legacy public paths so accidental deletions are detected;
- assert that each legacy JSON and image path exists;
- parse every legacy JSON document;
- verify that every BetterFormatter `imageURL` referenced by a legacy JSON document resolves to a retained local path;
- verify representative legacy files remain byte-identical to their pre-PR #3 versions, with the restored files themselves sourced directly from `d9b5513`.

After applying the upload commit, run the complete project verification commands, including generated-export drift checks and ICU validation.

## Pull request scope

The pull request will contain only:

- the five reapplied PR #3 commits;
- the legacy URL compatibility test and restored endpoints;
- the custom formatter upload commit.

No state from the original `feat/customformatter` working directory will be copied into the isolated branch. Pushing and pull-request creation remain separate approval gates after local verification.
