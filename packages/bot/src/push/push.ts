import { PushSubscription } from "@agenturn/db";
import webpush from "web-push";

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

export async function sendPushToTenant(
  tenantId: string,
  title: string,
  body: string,
) {
  const push = await PushSubscription.findAll({
    where: { tenant_id: tenantId },
  });

  if (push.length === 0) {
    return;
  }

  await Promise.all(
    push.map(async (p) => {
      try {
        await webpush.sendNotification(
          { endpoint: p.endpoint, keys: p.keys },
          JSON.stringify({ title, body }),
        );
      } catch (err: any) {
        if (err.statusCode === 410) {
          await p.destroy();
        }
        console.error(`[Push] Error enviado a ${p.endpoint}: `, err.message);
      }
    }),
  );
}
