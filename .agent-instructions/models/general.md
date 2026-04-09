# General Agent Instructions

Regardless of which model you are, you must adhere to the following baseline rules when working in this codebase:

1. **Verify Your Work:** Always run tests, type checks, or linters to confirm your code works before declaring a task complete.
2. **Context is Key:** Do not guess the state of the codebase. Use search and file viewing tools to inspect files before modifying them.
3. **No Unapproved Dependencies:** Do not add new package dependencies unless explicitly requested in the technical specification.
4. **Follow the Definitions of Done:** Only mark tasks as finished when all acceptance criteria and test layers have been met.
5. **Do not introduce security flaws:** When adding dependencies, always check for security vulnerabilities using `npm audit` and try to fix them immediately.
