"""
RLM wrapper for Claude Code /rlm skill.
Usage: ~/src/rlm/.venv/bin/python ~/.claude/rlm/rlm_run.py "your prompt"

Uses the rlm library with GitHub Models as the OpenAI-compatible backend.
No library changes needed — just pass base_url + api_key to the OpenAI client.
"""

import os
import sys

from rlm import RLM


def main():
    args = sys.argv[1:]
    if not args:
        print("Usage: python rlm_run.py 'your prompt'")
        sys.exit(1)

    prompt = " ".join(args)

    token = os.environ.get("GITHUB_TOKEN")
    if not token:
        print("Error: GITHUB_TOKEN not set.")
        sys.exit(1)

    model = RLM(
        backend="openai",
        backend_kwargs={
            "model_name": "openai/gpt-4.1",
            "base_url": "https://models.github.ai/inference",
            "api_key": token,
        },
        environment="local",
        max_depth=1,
        max_iterations=30,
        verbose=True,
    )

    result = model.completion(prompt)
    print(result.response)


if __name__ == "__main__":
    main()
