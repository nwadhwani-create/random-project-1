const DEFAULT_CHANNEL_NAME = "players-only-comm-west";
const DEFAULT_MESSAGE = "RAG";
const DEFAULT_TARGET_HOUR = 15;
const DEFAULT_TIME_ZONE = "America/Los_Angeles";
const SLACK_API_BASE_URL = "https://slack.com/api";

function normalizeChannelName(channelName) {
  return channelName.replace(/^#/, "");
}

function localHourForDate(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone,
  }).formatToParts(date);

  const hour = parts.find((part) => part.type === "hour")?.value;
  if (hour === undefined) {
    throw new Error(`Unable to determine local hour for ${timeZone}`);
  }

  return Number.parseInt(hour, 10);
}

export function shouldPostAt(date, { targetHour = DEFAULT_TARGET_HOUR, timeZone = DEFAULT_TIME_ZONE } = {}) {
  return localHourForDate(date, timeZone) === targetHour;
}

async function slackApi(method, body, { fetchFn, token }) {
  const response = await fetchFn(`${SLACK_API_BASE_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Slack API request to ${method} failed with HTTP ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.ok) {
    throw new Error(`Slack API request to ${method} failed: ${payload.error ?? "unknown_error"}`);
  }

  return payload;
}

export async function resolveChannelId(channelName, { fetchFn, token }) {
  const normalizedChannelName = normalizeChannelName(channelName);
  let cursor;

  do {
    const payload = await slackApi(
      "conversations.list",
      {
        cursor,
        exclude_archived: true,
        limit: 1000,
        types: "public_channel,private_channel",
      },
      { fetchFn, token },
    );

    const channel = payload.channels?.find(
      (candidate) =>
        candidate.name === normalizedChannelName ||
        candidate.name_normalized === normalizedChannelName,
    );

    if (channel?.id) {
      return channel.id;
    }

    cursor = payload.response_metadata?.next_cursor;
  } while (cursor);

  throw new Error(`Could not find Slack channel #${normalizedChannelName}`);
}

export async function run({
  env = process.env,
  fetchFn = globalThis.fetch,
  logger = console,
  now = new Date(),
} = {}) {
  const timeZone = env.RAG_TIME_ZONE ?? DEFAULT_TIME_ZONE;
  const targetHour = Number.parseInt(env.RAG_LOCAL_HOUR ?? `${DEFAULT_TARGET_HOUR}`, 10);
  const forceSend = env.FORCE_SEND === "true";

  if (!forceSend && !shouldPostAt(now, { targetHour, timeZone })) {
    logger.log(`Skipping Slack post because it is not ${targetHour}:00 in ${timeZone}.`);
    return { posted: false, skipped: true };
  }

  const token = env.SLACK_BOT_TOKEN;
  if (!token) {
    throw new Error("SLACK_BOT_TOKEN is required to post the RAG Slack message.");
  }

  const message = env.RAG_MESSAGE ?? DEFAULT_MESSAGE;
  const channelName = env.SLACK_CHANNEL_NAME ?? DEFAULT_CHANNEL_NAME;
  const channel = env.SLACK_CHANNEL_ID || (await resolveChannelId(channelName, { fetchFn, token }));

  const payload = await slackApi("chat.postMessage", { channel, text: message }, { fetchFn, token });
  logger.log(`Posted "${message}" to ${env.SLACK_CHANNEL_ID ? channel : `#${normalizeChannelName(channelName)}`}.`);

  return { posted: true, channel, message, ts: payload.ts };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
