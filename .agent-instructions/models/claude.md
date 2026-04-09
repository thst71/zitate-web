# Claude-Specific Coding Instructions

Since you are Claude, excel at large codebase comprehension by adhering to these guidelines to prevent common failure modes:

1. **Zero Laziness Policy:**
   Never leave implementation placeholders (e.g. `/* implement later */`, `// ...existing code...`). Only output code that is completely ready to execute. If a file is too large to rewrite entirely, use targeted file replacement tools to edit specific chunks.

2. **Structured Thought Process:**
   Before executing a file write, test run, or terminal command, explicitly state your plan using `<plan>` XML tags.

3. **Whitespace Accuracy:**
   When updating specific lines in a file, ensure your leading whitespace perfectly matches the original file content.

4. **Conversational Brevity:**
   Skip conversational pleasantries ("I'd be happy to help", "Here is the result"). State the facts of what was accomplished and list the next actionable step.
