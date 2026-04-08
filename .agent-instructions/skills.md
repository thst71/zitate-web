# Skills for Agents

## Quality Guidelines

All requirements, technical specifications, and user stories produced by these skills must follow these quality rules.

### Description languages

- The description language is asciidoctor (adoc)
- Diagrams in the documentation uses mermaid diagram definitions

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
