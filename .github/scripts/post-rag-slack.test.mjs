import assert from "node:assert/strict";
import { test } from "node:test";

import { resolveChannelId, run, shouldPostAt } from "./post-rag-slack.mjs";

function createSlackFetchMock(responses, calls = []) {
  return async (url, options) => {
    const response = responses.shift();
    if (!response) {
      throw new Error(`Unexpected Slack API call to ${url}`);
    }

    calls.push({ body: JSON.parse(options.body), url });

    return {
      ok: response.httpOk ?? true,
      status: response.status ?? 200,
      async json() {
        return response.body;
      },
    };
  };
}

test("shouldPostAt uses the America/Los_Angeles hour", () => {
  assert.equal(shouldPostAt(new Date("2026-06-12T22:05:00Z")), true);
  assert.equal(shouldPostAt(new Date("2026-06-12T21:05:00Z")), false);
});

test("resolveChannelId searches paginated Slack channel results", async () => {
  const calls = [];
  const fetchFn = createSlackFetchMock(
    [
      {
        body: {
          ok: true,
          channels: [{ id: "C_OTHER", name: "general" }],
          response_metadata: { next_cursor: "next-page" },
        },
      },
      {
        body: {
          ok: true,
          channels: [{ id: "C_PLAYERS", name: "players-only-comm-west" }],
          response_metadata: { next_cursor: "" },
        },
      },
    ],
    calls,
  );

  const channelId = await resolveChannelId("#players-only-comm-west", {
    fetchFn,
    token: "xoxb-test-token",
  });

  assert.equal(channelId, "C_PLAYERS");
  assert.equal(calls[0].url, "https://slack.com/api/conversations.list");
  assert.equal(calls[1].body.cursor, "next-page");
});

test("run skips outside the target local hour without calling Slack", async () => {
  let fetchCalled = false;

  const result = await run({
    env: { SLACK_BOT_TOKEN: "xoxb-test-token" },
    fetchFn: async () => {
      fetchCalled = true;
    },
    logger: { log() {} },
    now: new Date("2026-06-12T21:05:00Z"),
  });

  assert.deepEqual(result, { posted: false, skipped: true });
  assert.equal(fetchCalled, false);
});

test("run posts RAG to the configured Slack channel", async () => {
  const calls = [];
  const fetchFn = createSlackFetchMock(
    [
      {
        body: {
          ok: true,
          channels: [{ id: "C_PLAYERS", name: "players-only-comm-west" }],
          response_metadata: { next_cursor: "" },
        },
      },
      {
        body: {
          ok: true,
          channel: "C_PLAYERS",
          ts: "1791817200.000100",
        },
      },
    ],
    calls,
  );

  const result = await run({
    env: {
      SLACK_BOT_TOKEN: "xoxb-test-token",
      SLACK_CHANNEL_NAME: "players-only-comm-west",
    },
    fetchFn,
    logger: { log() {} },
    now: new Date("2026-06-12T22:05:00Z"),
  });

  assert.equal(result.posted, true);
  assert.equal(result.channel, "C_PLAYERS");
  assert.equal(result.message, "RAG");
  assert.equal(result.ts, "1791817200.000100");
  assert.equal(calls[1].url, "https://slack.com/api/chat.postMessage");
  assert.deepEqual(calls[1].body, { channel: "C_PLAYERS", text: "RAG" });
});

test("run force sends with a configured channel ID outside the target hour", async () => {
  const calls = [];
  const fetchFn = createSlackFetchMock(
    [
      {
        body: {
          ok: true,
          channel: "C_PLAYERS",
          ts: "1791817200.000200",
        },
      },
    ],
    calls,
  );

  const result = await run({
    env: {
      FORCE_SEND: "true",
      SLACK_BOT_TOKEN: "xoxb-test-token",
      SLACK_CHANNEL_ID: "C_PLAYERS",
    },
    fetchFn,
    logger: { log() {} },
    now: new Date("2026-06-12T21:05:00Z"),
  });

  assert.equal(result.posted, true);
  assert.equal(result.channel, "C_PLAYERS");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "https://slack.com/api/chat.postMessage");
  assert.deepEqual(calls[0].body, { channel: "C_PLAYERS", text: "RAG" });
});
