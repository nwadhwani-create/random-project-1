import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeChannelName,
  resolveChannelId,
  sendSlackMessage,
} from "./send-rag-to-slack.mjs";

function createMockFetch(responses) {
  const calls = [];

  const fetchImpl = async (url, options) => {
    calls.push({
      url,
      options,
      body: JSON.parse(options.body),
    });

    const response = responses.shift();

    if (!response) {
      throw new Error("Unexpected fetch call");
    }

    return {
      ok: response.ok ?? true,
      status: response.status ?? 200,
      json: async () => response.json,
    };
  };

  fetchImpl.calls = calls;
  return fetchImpl;
}

test("normalizes channel names", () => {
  assert.equal(normalizeChannelName("#players-only-comm-west"), "players-only-comm-west");
  assert.equal(normalizeChannelName("players-only-comm-west"), "players-only-comm-west");
});

test("resolves a private Slack channel by name across paginated results", async () => {
  const fetchImpl = createMockFetch([
    {
      json: {
        ok: true,
        channels: [{ id: "C11111111", name: "general" }],
        response_metadata: { next_cursor: "page-2" },
      },
    },
    {
      json: {
        ok: true,
        channels: [{ id: "G22222222", name: "players-only-comm-west" }],
        response_metadata: { next_cursor: "" },
      },
    },
  ]);

  const channelId = await resolveChannelId({
    fetchImpl,
    token: "xoxb-test-token",
    channel: "#players-only-comm-west",
  });

  assert.equal(channelId, "G22222222");
  assert.equal(fetchImpl.calls.length, 2);
  assert.equal(fetchImpl.calls[1].body.cursor, "page-2");
});

test("posts exactly RAG to the resolved channel", async () => {
  const fetchImpl = createMockFetch([
    {
      json: {
        ok: true,
        channels: [{ id: "G22222222", name: "players-only-comm-west" }],
        response_metadata: { next_cursor: "" },
      },
    },
    {
      json: {
        ok: true,
        ts: "123.456",
      },
    },
  ]);

  await sendSlackMessage({
    fetchImpl,
    token: "xoxb-test-token",
    channel: "#players-only-comm-west",
    text: "RAG",
  });

  assert.equal(fetchImpl.calls[1].url, "https://slack.com/api/chat.postMessage");
  assert.deepEqual(fetchImpl.calls[1].body, {
    channel: "G22222222",
    text: "RAG",
  });
});

test("requires a Slack bot token", async () => {
  await assert.rejects(
    sendSlackMessage({
      fetchImpl: createMockFetch([]),
      token: "",
    }),
    /SLACK_BOT_TOKEN is required/,
  );
});
