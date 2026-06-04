const DEFAULT_CHANNEL = "players-only-comm-west";
const DEFAULT_MESSAGE = "RAG";
const DEFAULT_TARGET_HOUR = 15;
const DEFAULT_TIME_ZONE = "America/Los_Angeles";

const env = process.env;
const channelNameOrId = env.SLACK_CHANNEL || DEFAULT_CHANNEL;
const messageText = env.MESSAGE_TEXT || DEFAULT_MESSAGE;
const targetTimeZone = env.TARGET_TIME_ZONE || DEFAULT_TIME_ZONE;
const targetHour = Number.parseInt(env.TARGET_HOUR || String(DEFAULT_TARGET_HOUR), 10);
const now = env.NOW_ISO ? new Date(env.NOW_ISO) : new Date();
const dryRun = env.DRY_RUN === "true";
const enforceTargetHour = env.ENFORCE_TARGET_HOUR !== "false";

if (Number.isNaN(targetHour) || targetHour < 0 || targetHour > 23) {
  throw new Error(`TARGET_HOUR must be an hour from 0 to 23. Received: ${env.TARGET_HOUR}`);
}

if (Number.isNaN(now.getTime())) {
  throw new Error(`NOW_ISO must be a valid ISO timestamp. Received: ${env.NOW_ISO}`);
}

const localHour = getLocalHour(now, targetTimeZone);

if (enforceTargetHour && localHour !== targetHour) {
  console.log(
    `Skipping send: current hour in ${targetTimeZone} is ${localHour}, target hour is ${targetHour}.`,
  );
  process.exit(0);
}

if (dryRun) {
  console.log(`Dry run: would post ${JSON.stringify(messageText)} to ${formatChannel(channelNameOrId)}.`);
  process.exit(0);
}

const slackToken = env.SLACK_BOT_TOKEN;

if (!slackToken) {
  throw new Error("SLACK_BOT_TOKEN is required to send the daily RAG Slack message.");
}

const channelId = await resolveChannelId(slackToken, channelNameOrId);
await postMessage(slackToken, channelId, messageText);

console.log(`Posted ${JSON.stringify(messageText)} to ${formatChannel(channelNameOrId)}.`);

function getLocalHour(date, timeZone) {
  const hourPart = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    hourCycle: "h23",
    timeZone,
  })
    .formatToParts(date)
    .find((part) => part.type === "hour");

  if (!hourPart) {
    throw new Error(`Could not determine current hour in ${timeZone}.`);
  }

  return Number.parseInt(hourPart.value, 10);
}

function formatChannel(channel) {
  return channel.startsWith("#") ? channel : `#${channel}`;
}

async function resolveChannelId(token, channel) {
  if (/^[CGD][A-Z0-9]+$/.test(channel)) {
    return channel;
  }

  const normalizedName = channel.replace(/^#/, "");
  let cursor;

  do {
    const url = new URL("https://slack.com/api/conversations.list");
    url.searchParams.set("types", "public_channel,private_channel");
    url.searchParams.set("limit", "1000");

    if (cursor) {
      url.searchParams.set("cursor", cursor);
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await parseSlackResponse(response);

    if (!result.ok) {
      throw new Error(`Could not list Slack channels: ${result.error || "unknown_error"}`);
    }

    const match = result.channels?.find((slackChannel) => slackChannel.name === normalizedName);

    if (match) {
      return match.id;
    }

    cursor = result.response_metadata?.next_cursor;
  } while (cursor);

  throw new Error(`Could not find Slack channel ${formatChannel(normalizedName)}.`);
}

async function postMessage(token, channel, text) {
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    body: JSON.stringify({ channel, text }),
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    method: "POST",
  });

  const result = await parseSlackResponse(response);

  if (!result.ok) {
    throw new Error(`Could not post Slack message: ${result.error || "unknown_error"}`);
  }
}

async function parseSlackResponse(response) {
  const text = await response.text();

  try {
    return JSON.parse(text);
  } catch (error) {
    throw new Error(`Slack returned a non-JSON response (${response.status}): ${text}`);
  }
}
