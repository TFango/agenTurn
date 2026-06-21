import { ConversationState } from "@agenturn/db";
import { Op } from "sequelize";

const TTL_MINUTES = 30;

export async function cleanStaleConversations(): Promise<void> {
  const cutoff = new Date(Date.now() - TTL_MINUTES * 60 * 1000);
  const deleted = await ConversationState.destroy({
    where: { updated_at: { [Op.lt]: cutoff } },
  });
  if (deleted > 0) console.log(`TTL cleanup: ${deleted} conversaciones eliminadas`);
}

export function startTTLCleanup(): void {
  setInterval(() => {
    cleanStaleConversations().catch(console.error);
  }, 5 * 60 * 1000);
}
