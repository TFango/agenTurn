import axios from "axios";

const BASE_URL = "https://graph.facebook.com/v18.0";

function getHeaders() {
  return {
    Authorization: `Bearer ${process.env.META_ACCESS_TOKEN}`,
    "Content-Type": "application/json",
  };
}

export async function sendTextMessage(
  phoneNumberId: string,
  to: string,
  text: string,
) {
  await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    {
      messaging_product: "whatsapp",
      to: to,
      type: "text",
      text: { body: text },
    },
    { headers: getHeaders() },
  );
}

export async function sendButtonMessage(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttoms: Array<{ id: string; title: string }>,
) {
  await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    {
      type: "interactive",
      to: to,
      messaging_product: "whatsapp",
      interactive: {
        type: "button",
        body: { text: bodyText },
        action: {
          buttons: buttoms.map((b) => ({
            type: "reply",
            reply: { id: b.id, title: b.title },
          })),
        },
      },
    },
    {
      headers: getHeaders(),
    },
  );
}

export async function sendListMessage(
  phoneNumberId: string,
  to: string,
  bodyText: string,
  buttonLabel: string,
  rows: Array<{ id: string; title: string; description?: string }>,
) {
  await axios.post(
    `${BASE_URL}/${phoneNumberId}/messages`,
    {
      type: "interactive",
      to: to,
      messaging_product: "whatsapp",
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
    },
    {
      headers: getHeaders(),
    },
  );
}
