#!/usr/bin/env python3
"""Send the daily RAG Slack message."""

from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.request

DEFAULT_API_URL = "https://slack.com/api/chat.postMessage"
DEFAULT_CHANNEL = "#players-only-comm-west"
MESSAGE = "RAG"


def post_rag_message(
    token: str,
    channel: str = DEFAULT_CHANNEL,
    api_url: str = DEFAULT_API_URL,
) -> dict[str, object]:
    if not token:
        raise ValueError("SLACK_BOT_TOKEN is required")

    payload = json.dumps({"channel": channel, "text": MESSAGE}).encode("utf-8")
    request = urllib.request.Request(
        api_url,
        data=payload,
        headers={
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json; charset=utf-8",
        },
        method="POST",
    )

    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            response_body = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        response_body = error.read().decode("utf-8")
        raise RuntimeError(
            f"Slack API request failed with HTTP {error.code}: {response_body}"
        ) from error
    except urllib.error.URLError as error:
        raise RuntimeError(f"Slack API request failed: {error.reason}") from error

    try:
        result = json.loads(response_body)
    except json.JSONDecodeError as error:
        raise RuntimeError(f"Slack API returned invalid JSON: {response_body}") from error

    if not result.get("ok"):
        slack_error = result.get("error", "unknown_error")
        raise RuntimeError(f"Slack API rejected the message: {slack_error}")

    return result


def main() -> int:
    token = os.environ.get("SLACK_BOT_TOKEN", "")
    channel = os.environ.get("SLACK_CHANNEL", DEFAULT_CHANNEL)
    api_url = os.environ.get("SLACK_API_URL", DEFAULT_API_URL)

    try:
        post_rag_message(token=token, channel=channel, api_url=api_url)
    except (RuntimeError, ValueError) as error:
        print(error, file=sys.stderr)
        return 1

    print(f"Sent {MESSAGE} to {channel}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
