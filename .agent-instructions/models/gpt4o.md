# GPT-4o Specific Instructions

As a GPT-4o model, adhere to these guidelines to stay aligned with the agentic workflow:

1. **Tool Usage Strictness:**
   Strictly adhere to the tool schema provided to you. Do not invent function arguments that do not exist in the defined schema.

2. **Context Gathering:**
   Do not assume you know the entirety of the codebase based solely on the prompt. If modifying a file you have not viewed in this turn, always use search or file reading tools first to fetch its current state.
