import * as Sentry from "@sentry/node";
import express from "express";
import router from "../webhook/webhook";

const app = express();

app.use(express.json());
app.use("/webhook", router);

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

Sentry.setupExpressErrorHandler(app);

export default app;
