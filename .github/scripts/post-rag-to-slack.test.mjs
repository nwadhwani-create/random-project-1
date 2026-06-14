import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getLocalHour,
  postRagToSlack,
  shouldPostNow,
} from "./post-rag-to-slack.mjs";

function jsonResponse(payload, ok = true) {
  return {
    ok,
    status: ok ? 200 : 500,
    statusText: ok ? "OK" : "Internal Server Error",
    async json() {
      return payload;
    },
  };
}

describe("schedule guard", () => {
  it("recognizes 3pm Pacific during daylight saving time", () => {
    assert.equal(
      getLocalHour(
        new Date("2026-06-14T22:00:00.000Z"),
        "America/Los_Angeles",
      ),
      15,
    );
  });

  it("recognizes 3pm Pacific during standard time", () => {
    assert.equal(
      getLocalHour(
        new Date("2026-12-14T23:00:00.000Z"),
        "America/Los_Angeles",
      ),
      15,
    );
  });

  it("skips scheduled runs that are not 3pm Pacific", () => {
    assert.equal(
      shouldPostNow({
        eventName: "schedule",
        now: new Date("2026-06-14T23:00:00.000Z"),
        targetHour: 15,
        timeZone: "America/Los_Angeles",
      }),
      false,
    );
  });
});

describe("postRagToSlack", () => {
  it("resolves the requested channel and posts exactly RAG", async () => {
    const requests = [];

    const fetchImpl = async (url, options) => {
      const body = JSON.parse(options.body);
      requests.push({ body, url });

      if (url.endsWith("/conversations.list")) {
        if (body.types === "public_channel") {
          return jsonResponse({
            channels: [],
            ok: true,
            response_metadata: { next_cursor: "" },
          });
        }

        return jsonResponse({
          channels: [{ id: "CPLAYERS", name: "players-only-comm-west" }],
          ok: true,
          response_metadata: { next_cursor: "" },
        });
      }

      if (url.endsWith("/chat.postMessage")) {
        return jsonResponse({ ok: true, ts: "123.456" });
      }

      throw new Error(`Unexpected Slack API URL: ${url}`);
    };

    const result = await postRagToSlack({
      channelName: "#players-only-comm-west",
      eventName: "schedule",
      fetchImpl,
      message: "RAG",
      now: new Date("2026-06-14T22:00:00.000Z"),
      targetHour: 15,
      timeZone: "America/Los_Angeles",
      token: "xoxb-test",
    });

    const postRequest = requests.find(({ url }) =>
      url.endsWith("/chat.postMessage"),
    );

    assert.deepEqual(postRequest.body, {
      channel: "CPLAYERS",
      mrkdwn: false,
      text: "RAG",
    });
    assert.deepEqual(result, { channel: "CPLAYERS", posted: true });
  });

  it("does not require a Slack token when a scheduled run is skipped", async () => {
    const result = await postRagToSlack({
      channelName: "players-only-comm-west",
      eventName: "schedule",
      fetchImpl: async () => {
        throw new Error("Slack should not be called");
      },
      message: "RAG",
      now: new Date("2026-06-14T23:00:00.000Z"),
      targetHour: 15,
      timeZone: "America/Los_Angeles",
    });

    assert.deepEqual(result, { posted: false });
  });
});
