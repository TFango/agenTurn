import { describe, it, expect, vi } from "vitest";
import request from "supertest";
import app from "../server/server";

describe("GET /webhook — Meta verification", () => {
  it("returns the challenge when verify_token matches", async () => {
    process.env.META_VERIFY_TOKEN = "test_token";
    const res = await request(app).get("/webhook").query({
      "hub.mode": "subscribe",
      "hub.verify_token": "test_token",
      "hub.challenge": "challenge_abc",
    });
    expect(res.status).toBe(200);
    expect(res.text).toBe("challenge_abc");
  });

  it("returns 403 when verify_token does not match", async () => {
    process.env.META_VERIFY_TOKEN = "test_token";
    const res = await request(app).get("/webhook").query({
      "hub.mode": "subscribe",
      "hub.verify_token": "wrong_token",
      "hub.challenge": "challenge_abc",
    });
    expect(res.status).toBe(403);
  });
});

describe("POST /webhook — incoming message", () => {
  it("returns 200 immediately (before processing)", async () => {
    const payload = buildMetaPayload("5491112345678", "5491199999999", "Hola");
    const res = await request(app).post("/webhook").send(payload);
    expect(res.status).toBe(200);
  });
});

function buildMetaPayload(from: string, to: string, text: string) {
  return {
    object: "whatsapp_business_account",
    entry: [
      {
        changes: [
          {
            value: {
              metadata: {
                phone_number_id: "phone_id_1",
                display_phone_number: to,
              },
              contacts: [{ profile: { name: "Test User" }, wa_id: from }],
              messages: [
                {
                  from,
                  id: "wamid.test123",
                  timestamp: "1700000000",
                  type: "text",
                  text: { body: text },
                },
              ],
            },
            field: "messages",
          },
        ],
      },
    ],
  };
}
