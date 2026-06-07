import { pathToFileURL } from "node:url";

const DEFAULT_CHANNEL = "#players-only-comm-west";
const DEFAULT_MESSAGE = "RAG";

export function normalizeChannelName(channel) {
  return channel.trim().replace(/^#/, "");
}

function isSlackChannelId(channel) {
  return /^[CGD][A-Z0-9]{8,}$/.test(channel);
}

async function slackRequest(fetchImpl, endpoint, token, body) {
  const response = await fetchImpl(`https://slack.com/api/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Slack ${endpoint} request failed with HTTP ${response.status}`);
  }

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack ${endpoint} request failed: ${data.error ?? "unknown_error"}`);
  }

  return data;
}

export async function resolveChannelId({ fetchImpl = fetch, token, channel }) {
  const normalizedChannel = normalizeChannelName(channel);

  if (isSlackChannelId(normalizedChannel)) {
    return normalizedChannel;
  }

  let cursor;

  do {
    const data = await slackRequest(fetchImpl, "conversations.list", token, {
      exclude_archived: true,
      limit: 1000,
      cursor,
      types: "public_channel,private_channel",
    });

    const match = data.channels?.find((candidate) => candidate.name === normalizedChannel);

    if (match?.id) {
      return match.id;
    }

    cursor = data.response_metadata?.next_cursor || undefined;
  } while (cursor);

  throw new Error(`Slack channel not found: #${normalizedChannel}`);
}

export async function sendSlackMessage({
  fetchImpl = fetch,
  token,
  channel = DEFAULT_CHANNEL,
  text = DEFAULT_MESSAGE,
}) {
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is required");
  }

  const channelId = await resolveChannelId({ fetchImpl, token, channel });

  return slackRequest(fetchImpl, "chat.postMessage", token, {
    channel: channelId,
    text,
  });
}

export async function main() {
  await sendSlackMessage({
    token: process.env.SLACK_BOT_TOKEN,
    channel: process.env.SLACK_RAG_CHANNEL ?? DEFAULT_CHANNEL,
    text: process.env.SLACK_RAG_MESSAGE ?? DEFAULT_MESSAGE,
  });

  console.log("Sent RAG Slack message.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
