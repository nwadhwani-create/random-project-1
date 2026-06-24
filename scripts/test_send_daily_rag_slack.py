from __future__ import annotations

import json
import threading
import unittest
from http.server import BaseHTTPRequestHandler, HTTPServer

import send_daily_rag_slack


class SlackApiHandler(BaseHTTPRequestHandler):
    response = {"ok": True}
    request_body = b""
    request_headers = {}

    def do_POST(self) -> None:
        content_length = int(self.headers["Content-Length"])
        type(self).request_body = self.rfile.read(content_length)
        type(self).request_headers = dict(self.headers)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(json.dumps(type(self).response).encode("utf-8"))

    def log_message(self, format: str, *args: object) -> None:
        return


class SendDailyRagSlackTest(unittest.TestCase):
    def setUp(self) -> None:
        SlackApiHandler.response = {"ok": True}
        SlackApiHandler.request_body = b""
        SlackApiHandler.request_headers = {}

    def run_server(self) -> tuple[HTTPServer, str]:
        server = HTTPServer(("127.0.0.1", 0), SlackApiHandler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        host, port = server.server_address
        return server, f"http://{host}:{port}/api/chat.postMessage"

    def stop_server(self, server: HTTPServer) -> None:
        server.shutdown()
        server.server_close()

    def test_posts_rag_to_players_only_comm_west(self) -> None:
        server, api_url = self.run_server()
        self.addCleanup(self.stop_server, server)

        result = send_daily_rag_slack.post_rag_message(
            token="xoxb-test-token",
            api_url=api_url,
        )

        self.assertEqual({"ok": True}, result)
        self.assertEqual(
            {"channel": "#players-only-comm-west", "text": "RAG"},
            json.loads(SlackApiHandler.request_body.decode("utf-8")),
        )
        self.assertEqual(
            "Bearer xoxb-test-token",
            SlackApiHandler.request_headers["Authorization"],
        )
        self.assertEqual(
            "application/json; charset=utf-8",
            SlackApiHandler.request_headers["Content-Type"],
        )

    def test_raises_when_slack_rejects_message(self) -> None:
        SlackApiHandler.response = {"ok": False, "error": "channel_not_found"}
        server, api_url = self.run_server()
        self.addCleanup(self.stop_server, server)

        with self.assertRaisesRegex(RuntimeError, "channel_not_found"):
            send_daily_rag_slack.post_rag_message(
                token="xoxb-test-token",
                api_url=api_url,
            )

    def test_requires_bot_token(self) -> None:
        with self.assertRaisesRegex(ValueError, "SLACK_BOT_TOKEN"):
            send_daily_rag_slack.post_rag_message(token="")


if __name__ == "__main__":
    unittest.main()
