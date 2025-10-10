# Prompts Tracking Rule

## Purpose
Track significant user prompts in `PROMPTS.md` for project documentation and AI-assisted development transparency.

## When to Update PROMPTS.md

Update `PROMPTS.md` when the user asks questions that:

1. **Debug complex issues** - Questions that involve system architecture, environment-specific behavior, or multi-layer debugging
2. **Demand documentation research** - Explicitly ask to check docs before implementing
3. **Challenge assumptions** - Reject solutions and ask for root causes or "how it's meant to be"
4. **Request implementation understanding** - Ask "how does X work" rather than "fix X"
5. **Trace system behavior** - Connect logs, errors, or behavior to specific code paths

## What NOT to Track

- Simple "how to" questions
- Basic syntax questions
- Direct implementation requests ("make a button")
- Conversational back-and-forth without technical depth

## Format

Organize prompts by category in `PROMPTS.md`:

```markdown
## [Category Name]

\`\`\`
[exact user prompt, preserving casual language]
\`\`\`
```

**Categories:**
- Environment & Configuration
- Understanding Implementation  
- Debugging
- Root Cause Analysis
- Architecture & Design
- Documentation Research

## How to Update

When you identify a significant prompt:

1. Add it to the appropriate category in `PROMPTS.md`
2. Use exact user language (preserve casual tone, typos, etc.)
3. Keep it minimal - just the prompt in a code block
4. Don't add explanations or outcomes

## Implementation

- Check at the end of each coding session if any prompts should be added
- If user explicitly asks to update PROMPTS.md, do so
- Prioritize quality over quantity - only truly impactful prompts

