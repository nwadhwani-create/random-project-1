#!/usr/bin/env python3
"""Send the daily RAG message to Slack."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime
from zoneinfo import ZoneInfo


SLACK_API_URL = "https://slack.com/api"


class SlackError(RuntimeError):
    """Raised when Slack rejects or cannot complete a request."""


def slack_api_request(
    token: str,
    endpoint: str,
    *,
    payload: dict[str, str] | None = None,
    query: dict[str, str] | None = None,
) -> dict:
    url = f"{SLACK_API_URL}/{endpoint}"
    if query:
        url = f"{url}?{urllib.parse.urlencode(query)}"

    data = None
    headers = {"Authorization": f"Bearer {token}"}
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
        headers["Content-Type"] = "application/json; charset=utf-8"

    request = urllib.request.Request(url, data=data, headers=headers)
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8")
    except urllib.error.HTTPError as error:
        body = error.read().decode("utf-8", errors="replace")
        raise SlackError(f"Slack HTTP {error.code}: {body}") from error
    except urllib.error.URLError as error:
        raise SlackError(f"Could not reach Slack: {error.reason}") from error

    try:
        result = json.loads(body)
    except json.JSONDecodeError as error:
        raise SlackError(f"Slack returned invalid JSON: {body}") from error

    if not result.get("ok"):
        raise SlackError(f"Slack API error from {endpoint}: {result.get('error', 'unknown_error')}")

    return result


def resolve_channel_id(token: str, channel: str) -> str:
    configured_channel_id = os.environ.get("SLACK_CHANNEL_ID", "").strip()
    if configured_channel_id:
        return configured_channel_id

    channel_name = channel.lstrip("#")
    cursor = ""
    while True:
        result = slack_api_request(
            token,
            "conversations.list",
            query={
                "exclude_archived": "true",
                "limit": "1000",
                "types": "public_channel,private_channel",
                **({"cursor": cursor} if cursor else {}),
            },
        )
        for slack_channel in result.get("channels", []):
            if slack_channel.get("name") == channel_name:
                return slack_channel["id"]

        cursor = result.get("response_metadata", {}).get("next_cursor", "")
        if not cursor:
            break

    raise SlackError(
        f"Could not resolve Slack channel '{channel}'. "
        "Set the RAG_SLACK_CHANNEL_ID repository secret to the channel ID, "
        "or grant the bot conversations.list access for that channel."
    )


def should_send_now(timezone: str, target_hour: int) -> bool:
    now = datetime.now(ZoneInfo(timezone))
    return now.hour == target_hour


def build_payload(channel: str, message: str) -> dict[str, str]:
    return {"channel": channel, "text": message}


def main() -> int:
    parser = argparse.ArgumentParser(description="Send the daily RAG Slack message.")
    parser.add_argument(
        "--respect-schedule",
        action="store_true",
        help="Skip unless the current local hour matches RAG_TARGET_HOUR.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print the message payload without calling Slack.",
    )
    args = parser.parse_args()

    message = os.environ.get("SLACK_MESSAGE", "RAG")
    channel = os.environ.get("SLACK_CHANNEL", "#players-only-comm-west")
    timezone = os.environ.get("RAG_TIMEZONE", "America/Los_Angeles")
    target_hour = int(os.environ.get("RAG_TARGET_HOUR", "15"))

    if args.respect_schedule and not should_send_now(timezone, target_hour):
        print(f"Skipping: not {target_hour}:00 in {timezone}.")
        return 0

    if args.dry_run:
        print(json.dumps(build_payload(channel, message), sort_keys=True))
        return 0

    token = os.environ.get("SLACK_BOT_TOKEN", "").strip()
    if not token:
        print("SLACK_BOT_TOKEN is required.", file=sys.stderr)
        return 1

    channel_id = resolve_channel_id(token, channel)
    slack_api_request(token, "chat.postMessage", payload=build_payload(channel_id, message))
    print(f"Sent '{message}' to {channel}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
