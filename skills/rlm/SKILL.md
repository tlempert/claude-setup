---
name: rlm
description: Run a prompt through GitHub Models (gpt-4.1) via the RLM pipeline using your GitHub Copilot API key
allowed-tools: Bash(python *)
argument-hint: "<your prompt>"
---

Run the user's prompt through the real RLM library (~/src/rlm) using GitHub Models
as the OpenAI-compatible backend. Authenticates with GITHUB_TOKEN.

## Steps

1. Execute:
   ```
   ~/src/rlm/.venv/bin/python ~/.claude/rlm/rlm_run.py "$ARGUMENTS"
   ```
2. Present the output to the user as-is.

## Notes
- Requires `GITHUB_TOKEN` in the environment (your GitHub Copilot API key, set in `~/.zshrc`)
- Uses the rlm library's OpenAI client pointed at `https://models.inference.ai.azure.com`
- Default model: `gpt-4.1` (change in `~/.claude/rlm_run.py` if needed)
- If the script errors, show the error message to the user
