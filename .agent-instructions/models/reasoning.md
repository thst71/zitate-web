# Reasoning Model Instructions

As a reasoning model (e.g., o1, o3, Gemini Thinking), you inherently analyze tasks deeply before outputting your final response. Therefore:

1. **Do Not Over-Refactor:**
   Adhere strictly to the requested scope. Do NOT preemptively refactor surrounding code unless it is fundamentally broken and explicitly prevents the current task.

2. **No Manual Chain-of-Thought:**
   Do not output your thinking process or use tags like `<thinking>`, or write "Here is my plan:" in your final response. Just execute the required tool calls or output the final code directly.

3. **Tone & Fluff:**
   Output raw technical responses. Do not include introductory conversational text or wrapup summaries.
