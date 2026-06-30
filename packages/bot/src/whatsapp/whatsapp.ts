import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v21.0";

function getHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

async function send(phoneNumberId: string, accessToken: string, to: string, payload: object) {
  try {
    await axios.post(
      `${BASE_URL}/${phoneNumberId}/messages`,
      { messaging_product: "whatsapp", to, ...payload },
      { headers: getHeaders(accessToken) },
    );
  } catch (err: any) {
    console.error(`[WhatsApp] Error enviando a ${to}:`, err.response?.data ?? err.message);
  }
}

export async function sendTextMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  text: string,
) {
  await send(phoneNumberId, accessToken, to, {
    type: "text",
    text: { body: text },
  });
}

export async function sendButtonMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  bodyText: string,
  buttons: Array<{ id: string; title: string }>,
) {
  await send(phoneNumberId, accessToken, to, {
    type: "interactive",
    interactive: {
      type: "button",
      body: { text: bodyText },
      action: {
        buttons: buttons.map((b) => ({
          type: "reply",
          reply: { id: b.id, title: b.title },
        })),
      },
    },
  });
}

export async function sendListMessage(
  phoneNumberId: string,
  accessToken: string,
  to: string,
  bodyText: string,
  buttonLabel: string,
  rows: Array<{ id: string; title: string; description?: string }>,
) {
  await send(phoneNumberId, accessToken, to, {
    type: "interactive",
    interactive: {
      type: "list",
      body: { text: bodyText },
      action: {
        button: buttonLabel,
        sections: [
          {
            title: "Opciones",
            rows: rows.map((r) => ({
              id: r.id,
              title: r.title,
              description: r.description,
            })),
          },
        ],
      },
    },
  });
}
