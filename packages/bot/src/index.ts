import app from "./server/server";
import { startTTLCleanup } from "./ttl-cleanup";

const PORT = process.env.PORT || "3001";
app.listen(PORT, () => {
  console.log(`Bot service running on port ${PORT}`);
  startTTLCleanup();
});
