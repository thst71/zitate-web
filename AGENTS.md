# Workspace Guidelines & Rules

Zitate Web is an offline-first Progressive Web App for collecting quotes, citations and "bon mots" with author, labels, location, images and audio, stored in the browser's IndexedDB and delivered as a Docker image. This file holds the project's facts and rules; the workflows are skills in `.agents/skills/`.

## How to Work Here

1. **Environment**: Before the first terminal command, apply [environment](.agents/skills/environment/SKILL.md).
2. **Skills**: Before a matching task, read the skill and follow it. Load the referenced skills and profiles only when a step needs them.

| Task | Skill |
|---|---|
| New feature, from idea to backlog | [create-new-feature](.agents/skills/create-new-feature/SKILL.md) |
| Requirement / tech specification / user story | [create-requirement](.agents/skills/create-requirement/SKILL.md), [create-tech-specification](.agents/skills/create-tech-specification/SKILL.md), [create-user-story](.agents/skills/create-user-story/SKILL.md) |
| Change of existing specification items | [update-feature](.agents/skills/update-feature/SKILL.md), [update-requirement](.agents/skills/update-requirement/SKILL.md), [update-user-story](.agents/skills/update-user-story/SKILL.md) |
| Implement a story | [implement-user-story](.agents/skills/implement-user-story/SKILL.md) |
| Fix a defect | [fix-bug](.agents/skills/fix-bug/SKILL.md) |
| Done check | [definition-of-done](.agents/skills/definition-of-done/SKILL.md) |
| Commit | [commit](.agents/skills/commit/SKILL.md) |
| Release | [release](.agents/skills/release/SKILL.md) |
| Commands, test tooling | [toolchain](.agents/skills/toolchain/SKILL.md) |
| Specification layout and rules | [spec-system](.agents/skills/spec-system/SKILL.md) |

## Precedence

1. This file.
2. The project skills in `.agents/skills/`.
3. Personal instructions and skills of the user (e.g. `~/.claude/skills`, `~/.agents/`). They may only cover the machine environment and how to communicate; they never override a project rule or a project skill of the same purpose.

`.agents/skills/` is the vendored agent-skills library (version in `.agents/skills/VERSION`); adapt it here, under "Project Facts", never by editing it. Update it with `.agents/skills/vendor.sh v<version>`, then commit `chore(agents): vendor agent-skills v<version>`. The spec-validator release is pinned in `.agents/spec-validator.lock`; change it only with `.agents/skills/spec-system/bin/validate-specs --update [v<version>]`.

---

## Project Facts

### Components

| Path | Toolchain profile |
|---|---|
| `Zitate.web/` (React 18, TypeScript, Vite) | [node-npm](.agents/skills/toolchain/node-npm/PROFILE.md) |

The contract tasks are npm scripts in `Zitate.web/package.json`; run them from `Zitate.web/` (`npm run check`). Deviations from the profile:

- `validate-specs` runs the launcher as `../.agents/skills/spec-system/bin/validate-specs ..`, because the specification lives in the repository root.
- No `version` task: the version is the release tag, injected at build time as `APP_VERSION` (`Dockerfile`, `vite.config.ts`). The `version` in `package.json` is a placeholder.
- No `dist` task: the deliverable is the Docker image, built by `.github/workflows/release.yml`.
- `npm audit --audit-level moderate` gates pull requests and releases.

### Specification

- Stakeholder input: `SPEC.md` with `specification/stakeholder/`. `FR-x.y` traces to `SPEC.md §x.y`, `NFR-n` to `SPEC.md §6.n`.
- Items migrated from the former monolithic documents carry `Effort:: not estimated (migrated …)` (requirements) and `Test criteria: Not recorded before the migration` (stories). Fill them in when an item is next updated; do not invent values for items you do not touch.
- Release notes start with v1.10.0; older releases are only in the git history.

### Test Pyramid Limits

- Unit, component and integration tests run in Vitest with `jsdom`; `src/test/setup.ts` installs `fake-indexeddb` and mocks geolocation and `scrollIntoView`. Test files sit next to the code as `*.test.ts(x)`.
- The Vitest configuration pins `LC_ALL=en_US.UTF-8` and `TZ=UTC`; tests that depend on the clock mock `Date.now`.
- `test` always measures coverage; `coverage.thresholds` in `vitest.config.ts` fail the gate below the recorded values. Raise them when coverage grows, never lower them to make a change pass.
- Blackbox: Playwright is not installed yet. Critical user journeys (entry creation, search, export/import) are checked by hand in the browser; name the manual check in the story's test criteria until a story adds Playwright.
- Performance (Lighthouse, bundle size) and screen reader checks are manual.

### Definition of Done

In addition to the [definition-of-done](.agents/skills/definition-of-done/SKILL.md) skill:

1. No `any` types.
2. UI changes are checked in Chrome, Firefox and Safari, at a 320 px mobile viewport, in light and dark mode, and with keyboard only (screen reader where the story touches ARIA).
3. Work happens on a branch `feature/<topic>` (or `fix/<topic>`) and reaches `main` through a reviewed pull request; never commit directly to `main`.

### Releases

Releases follow the [release](.agents/skills/release/SKILL.md) skill: a signed tag `v<semver>`, pushed by the user, runs `.github/workflows/release.yml`, which verifies the tag, runs the gate, renders the specification, builds and pushes the multi-arch image to GHCR (`<version>`, `<major>.<minor>`, `<major>`, `latest`), scans it with Trivy and publishes the GitHub release. `docker-publish.yml` only checks pull requests and builds the image without pushing it; nothing else publishes images.

### Commit Scopes

`web` (application), `test`, `spec`, `docker` (Dockerfile, nginx, compose), `agents`; workflows without scope.

---

## Self-Correction & Debugging Protocol

- **Do Not Guess**: Read stack traces and error messages carefully before editing code.
- **Isolate**: Reproduce defects with a minimal automated test before modifying code.
- **Limit Loops**: If a test or build fails more than 3 times for the same reason, stop and ask the user for guidance.
- **Zero Unapproved Dependencies**: Do not add npm packages unless the technical specification names them or the user requests them.
