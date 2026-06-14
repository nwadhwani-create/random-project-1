import { pathToFileURL } from "node:url";

const SLACK_API_BASE = "https://slack.com/api";

export function normalizeChannelName(channelName) {
  return channelName.trim().replace(/^#/, "");
}

export function getLocalHour(date, timeZone) {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    hour12: false,
    timeZone,
  })
    .formatToParts(date)
    .find((part) => part.type === "hour");

  if (!hourPart) {
    throw new Error(`Unable to determine local hour for ${timeZone}`);
  }

  const hour = Number(hourPart.value);
  return hour === 24 ? 0 : hour;
}

export function shouldPostNow({
  eventName,
  now = new Date(),
  targetHour,
  timeZone,
}) {
  if (eventName !== "schedule") {
    return true;
  }

  return getLocalHour(now, timeZone) === targetHour;
}

async function callSlackApi(method, body, token, fetchImpl) {
  const response = await fetchImpl(`${SLACK_API_BASE}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  const payload = await response.json();

  if (!response.ok || !payload.ok) {
    const error = payload.error || `${response.status} ${response.statusText}`;
    throw new Error(`Slack API ${method} failed: ${error}`);
  }

  return payload;
}

export async function findSlackChannelId({
  channelName,
  fetchImpl = fetch,
  token,
}) {
  const normalizedChannelName = normalizeChannelName(channelName);

  for (const types of ["public_channel", "private_channel"]) {
    let cursor;

    do {
      const payload = await callSlackApi(
        "conversations.list",
        {
          cursor,
          exclude_archived: true,
          limit: 200,
          types,
        },
        token,
        fetchImpl,
      );

      const channel = payload.channels.find(
        ({ name }) => name === normalizedChannelName,
      );

      if (channel) {
        return channel.id;
      }

      cursor = payload.response_metadata?.next_cursor || "";
    } while (cursor);
  }

  throw new Error(`Slack channel not found: #${normalizedChannelName}`);
}

export async function postRagToSlack({
  channelName,
  eventName,
  fetchImpl = fetch,
  message,
  now = new Date(),
  targetHour,
  timeZone,
  token,
}) {
  if (!shouldPostNow({ eventName, now, targetHour, timeZone })) {
    console.log(
      `Skipping Slack post because it is not ${targetHour}:00 in ${timeZone}.`,
    );
    return { posted: false };
  }

  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is required to post to Slack.");
  }

  const channel = await findSlackChannelId({ channelName, fetchImpl, token });

  await callSlackApi(
    "chat.postMessage",
    {
      channel,
      mrkdwn: false,
      text: message,
    },
    token,
    fetchImpl,
  );

  console.log(`Posted Slack message to #${normalizeChannelName(channelName)}.`);
  return { channel, posted: true };
}

async function main() {
  const targetHour = Number(process.env.SLACK_TARGET_HOUR || 15);

  if (!Number.isInteger(targetHour) || targetHour < 0 || targetHour > 23) {
    throw new Error("SLACK_TARGET_HOUR must be an integer from 0 to 23.");
  }

  await postRagToSlack({
    channelName: process.env.SLACK_CHANNEL_NAME || "players-only-comm-west",
    eventName: process.env.GITHUB_EVENT_NAME || "workflow_dispatch",
    message: process.env.SLACK_MESSAGE || "RAG",
    targetHour,
    timeZone: process.env.SLACK_TIME_ZONE || "America/Los_Angeles",
    token: process.env.SLACK_BOT_TOKEN,
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
