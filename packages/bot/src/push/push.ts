import { db, pushSubscriptions } from "@agenturn/db";
import { eq } from "drizzle-orm";
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
  const push = await db
    .select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.tenant_id, tenantId));

  if (push.length === 0) return;

  await Promise.all(
    push.map(async (p) => {
      try {
        await webpush.sendNotification(
          { endpoint: p.endpoint!, keys: p.keys },
          JSON.stringify({ title, body }),
        );
      } catch (err: any) {
        if (err.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, p.id));
        }
        console.error(`[Push] Error enviado a ${p.endpoint}: `, err.message);
      }
    }),
  );
}
