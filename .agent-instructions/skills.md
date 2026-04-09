# Skills for Agents

## Quality Guidelines

All requirements, technical specifications, and user stories produced by these skills must follow these quality rules.

### Description languages

- The description language is asciidoctor (adoc)
- The asciidoctor-diagram extension is supported and shall be used where appropriate

### SMART Criteria

Every requirement and user story must be:

- **S**pecific — clearly and unambiguously stated, no room for interpretation
- **M**easurable — acceptance criteria are testable and verifiable
- **A**chievable — implementable with the current technology stack
- **R**elevant — traceable to a parent requirement (stories) or stakeholder need (requirements)
- **T**ime-bound — includes an effort estimate

### Test Pyramid

Every user story must define test criteria based on the following levels. Not every level applies to every story — the agent selects the relevant levels and documents them explicitly.

| Level | Scope | Tooling | When to use |
|---|---|---|---|
| **Unit test** | Single functions, validators, service methods, pure logic | Vitest | Always, for any logic or utility code |
| **Component test** | React components in isolation, mocked dependencies | Vitest + React Testing Library | For every UI component story |
| **Integration test** | Hooks with real fake-indexeddb, service chains, multi-component flows | Vitest + fake-indexeddb | For stories involving data persistence or cross-service interaction |
| **Blackbox test** | End-to-end user flows without knowledge of internals | Playwright | For critical user journeys (entry creation, search, export/import) |

### Reference Traceability

- Requirements reference stakeholder needs or constraints
- Technical specifications reference requirements (FR-x.y, NFR-x)
- User stories reference technical specifications and requirements
- Changes to any artifact must trigger an impact check on dependent artifacts


## Skill create-new-feature

Files to be modified

- specification-web.adoc
- tech-specification-web.adoc
- backlog-web.adoc

Tasks to be executed

- Split the feature into requirements and use skill create-requirement to write the requirements into the specification file
- Map the requirements onto technical specification elements that describe architecture, data models, component interaction and interfaces with interface definitions, use skill create-tech-specification
- Map the technical specification to user stories in the backlog. Split the technical specification into implementable atomic user stories using skill create-user-story
- Verify that all produced artifacts satisfy the SMART criteria from Quality Guidelines


## Skill create-requirement

Files to be modified

- specification-web.adoc

Tasks to be executed

- The user provides a feature description
- The agent should break down the feature into one or more requirements
- Each requirement must satisfy the SMART criteria (see Quality Guidelines)
- For each requirement, the agent should write a section in the specification-web.adoc file
- The section must have a title, a description, and measurable acceptance criteria
- Each requirement must be traceable to a stakeholder need or constraint


## Skill create-tech-specification

Files to be modified

- tech-specification-web.adoc

Tasks to be executed

- The user provides a requirement
- The agent should break down the requirement into technical specifications
- This includes architecture, data models, component interaction and interfaces with interface definitions
- For each technical specification, the agent should write a section in the tech-specification-web.adoc file
- Each specification must reference the originating requirement (e.g. FR-x.y)


## Skill create-user-story

Files to be modified

- backlog-web.adoc

Tasks to be executed

- The user provides a technical specification
- The agent should break down the technical specification into user stories
- The user stories must be atomic and implementable
- Each user story must satisfy the SMART criteria (see Quality Guidelines)
- For each user story, the agent should write a section in the backlog-web.adoc file
- The user story must have a title, a description, and acceptance criteria
- The user story must include a **Test Criteria** section that lists the applicable test pyramid levels:
  - Which unit tests are needed (functions, validators, services)
  - Which component tests are needed (rendered components, user interactions)
  - Which integration tests are needed (hooks with persistence, service chains)
  - Whether a blackbox/e2e test is needed (critical user journeys)
- The test criteria must be specific enough to implement without ambiguity


## Skill update-feature

Files to be modified

- specification-web.adoc
- tech-specification-web.adoc
- backlog-web.adoc

Tasks to be executed

- The user provides a change description for an existing feature
- **Impact analysis:** The agent reads the existing requirements, tech specs, and stories related to the feature
- The agent identifies which requirements are affected and uses skill update-requirement to modify them
- The agent identifies which technical specifications are affected and updates them in tech-specification-web.adoc
- The agent identifies which user stories are affected and uses skill update-user-story to modify them
- New requirements, specs, or stories are created using the corresponding create-* skills if the change introduces new scope
- The agent verifies that reference traceability is maintained across all three files


## Skill update-requirement

Files to be modified

- specification-web.adoc
- (check impact on) tech-specification-web.adoc
- (check impact on) backlog-web.adoc

Tasks to be executed

- The user provides a change to an existing requirement
- The agent locates the existing requirement section in specification-web.adoc
- The agent modifies the requirement title, description, or acceptance criteria as needed
- The updated requirement must still satisfy the SMART criteria
- **Impact check:** The agent reads tech-specification-web.adoc and backlog-web.adoc for references to the changed requirement
- The agent lists affected technical specifications and stories
- If the change affects technical specifications, the agent updates them or flags them for the user
- If the change affects stories, the agent updates acceptance criteria and test criteria or flags them for the user


## Skill update-user-story

Files to be modified

- backlog-web.adoc
- (check impact on) tech-specification-web.adoc

Tasks to be executed

- The user provides a correction or extension for an existing user story
- The agent locates the existing story section in backlog-web.adoc
- The agent modifies the story description, acceptance criteria, technical tasks, or test criteria as needed
- The updated story must still satisfy the SMART criteria
- The test criteria section must be updated to reflect any changed or added acceptance criteria
- **Impact check:** If the change reveals a gap in the technical specification, the agent flags it or updates tech-specification-web.adoc
- If the change invalidates or extends a requirement, the agent flags it for the user


## Agentic Coding Guidelines

To ensure successful implementation and agentic behavior during coding tasks, agents must strictly follow these rules:

### Definition of Done (DoD)
Every implementation task is only considered complete when:
- All tests defined in the Test Pyramid for the story pass successfully.
- Type-checking and linting run without any new warnings or errors.
- No `console.log` statements, unused variables, or commented-out debug code are left behind.
- Code matches existing architectural patterns and styling conventions.
- Release notes file is updated with the following changes
 - new Features:
   - add the feature to the features list in the release-notes
   - add references to the requirements touched by this feature by going back from the user-story to the requirement using the traceability in the user-story
 - new Fixes:
  - add the fix to the fixes list in the release-notes
  - if there is any changes in behavior of the application besides the intended behavior before the fix was applied, describe it. For example if the search-result sorting adhered to case-sensitivity but it was not intended to be case-sensitive, describe that search will now sort results case-insensitive.
 - new Breaking Changes:
  - add the breaking change to the breaking changes list in the release-notes
  - add references to the requirements touched by this breaking change by going back from the user-story to the requirement using the traceability in the user-story

### Self-Correction & Debugging Protocol
- **Do not guess:** Before modifying code to fix an error, read the specific error trace.
- **Isolate:** Reproduce the problem in isolation (e.g., via a specific failing test) before fixing.
- **Limit loops:** If a test or build fails more than 3 times for the same reason, stop and ask the user for guidance rather than continuing to guess.

### Architectural & Context Boundaries
- **Discovery First:** Before implementing a new component or utility, search the codebase for existing reusable equivalents.
- **Dependency Constraint:** Never install new `npm` packages unless explicitly requested by the user or defined in the technical specification.


## Skill implement-user-story

Files to be modified

- Code files corresponding to the feature architecture
- Test files (`*.test.ts`, `*.test.tsx`, etc.)
- release-notes.adoc (located next to the specification files)

Tasks to be executed

- The user provides a user story from `backlog-web.adoc`
- **Context Gathering:** Read the relevant sections of `tech-specification-web.adoc` and the referenced user story
- **Baseline Check:** Run the existing test suite first to ensure the project isn't already in a broken state
- **TDD Approach:** Write the failing tests (Unit/Component) defined in the test criteria *before* writing the implementation
- **Implementation:** Write the minimal code required to make the tests pass
- **Verification:** Run linters, type-checkers, and tests to ensure no regressions were introduced. Ensure the Definition of Done is met.


## Skill fix-bug

Files to be modified

- Code files causing the bug
- Test files to prevent regressions
- release-notes.adoc (located next to the specification files)

Tasks to be executed

- The user provides a bug report or stack trace
- **Reproduction:** Write an automated test (Unit/Integration) that specifically reproduces the bug (the test must initially fail)
- **Root Cause Analysis:** Read the relevant source files and briefly document the root cause
- **Fix:** Modify the code so the newly created test passes
- **Verification:** Ensure the rest of the test suite still passes (no regressions) and the Definition of Done is met.
