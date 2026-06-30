import { conversationStates, db } from "@agenturn/db";
import { lt } from "drizzle-orm";

const TTL_MINUTES = 30;

export async function cleanStaleConversations(): Promise<void> {
  const cutoff = new Date(Date.now() - TTL_MINUTES * 60 * 1000);
  const deleted = await db
    .delete(conversationStates)
    .where(lt(conversationStates.updated_at, cutoff))
    .returning({ id: conversationStates.id });

  if (deleted.length > 0) {
    console.log(`TTL cleanup: ${deleted.length} conversaciones eliminadas`);
  }
}

export function startTTLCleanup(): void {
  setInterval(() => {
    cleanStaleConversations().catch(console.error);
  }, 5 * 60 * 1000);
}
