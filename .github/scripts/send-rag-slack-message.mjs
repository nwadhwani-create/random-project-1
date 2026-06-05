const SLACK_API_BASE_URL =
  process.env.SLACK_API_BASE_URL ?? "https://slack.com/api";
const SLACK_CHANNEL_NAME =
  process.env.SLACK_CHANNEL_NAME ?? "players-only-comm-west";
const SLACK_CHANNEL_ID = process.env.SLACK_CHANNEL_ID;
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const DRY_RUN = process.env.SLACK_DRY_RUN === "1";
const MESSAGE = "RAG";

function normalizeChannelName(channelName) {
  return channelName.replace(/^#/, "");
}

async function callSlackApi(method, body) {
  if (!SLACK_BOT_TOKEN) {
    throw new Error("SLACK_BOT_TOKEN is required");
  }

  const response = await fetch(`${SLACK_API_BASE_URL}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(
      `${method} failed with HTTP ${response.status}: ${await response.text()}`,
    );
  }

  const result = await response.json();

  if (!result.ok) {
    throw new Error(`${method} failed: ${result.error ?? "unknown_error"}`);
  }

  return result;
}

async function resolveChannelId() {
  if (SLACK_CHANNEL_ID) {
    return SLACK_CHANNEL_ID;
  }

  const targetName = normalizeChannelName(SLACK_CHANNEL_NAME);
  let cursor;

  do {
    const result = await callSlackApi("conversations.list", {
      exclude_archived: true,
      limit: 200,
      types: "public_channel,private_channel",
      cursor,
    });

    const channel = result.channels.find(
      (candidate) => candidate.name === targetName,
    );

    if (channel) {
      return channel.id;
    }

    cursor = result.response_metadata?.next_cursor;
  } while (cursor);

  throw new Error(
    `Slack channel #${targetName} was not found. Set SLACK_CHANNEL_ID if the bot cannot list that channel.`,
  );
}

async function main() {
  if (DRY_RUN) {
    console.log(
      JSON.stringify(
        {
          channel: SLACK_CHANNEL_ID ?? `#${normalizeChannelName(SLACK_CHANNEL_NAME)}`,
          text: MESSAGE,
        },
        null,
        2,
      ),
    );
    return;
  }

  const channelId = await resolveChannelId();

  await callSlackApi("chat.postMessage", {
    channel: channelId,
    text: MESSAGE,
  });

  console.log(`Posted ${MESSAGE} to ${channelId}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
