import { Router, Request, Response } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  const mode = req.query["hub.mode"];
  const verifyToken = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode !== "subscribe" || verifyToken !== process.env.META_VERIFY_TOKEN) {
    return res.sendStatus(403);
  }

  return res.status(200).send(challenge);
});

router.post("/", (req: Request, res: Response) => {
  res.sendStatus(200);

  const entry = req.body?.entry?.[0];
  const change = entry?.changes?.[0]?.value;
  if (!change?.messages) return;

  const message = change.messages[0];
  const storeNumber = change.metadata;
  const customerData = change.contacts[0];

  const from = message.from;
  const to = storeNumber.display_phone_number;
  const body = message.text.body;
  const contactName = customerData.profile.name;

  handleIncomingMessage(from, to, body, contactName).catch(console.error);
});

async function handleIncomingMessage(from, to, body, contactName) {
  const { routeMessage } = await import("./router");
  await routeMessage(from, to, body, contactName);
}

export default router;
