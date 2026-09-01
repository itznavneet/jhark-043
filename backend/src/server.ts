import "dotenv/config";
import { createServer } from "node:http";
import { createApp } from "./app.js";
import { disconnectDatabase } from "./config/database.js";
import { loadEnvironment } from "./config/environment.js";

const environment = loadEnvironment();
const app = createApp({ environment });
const server = createServer(app);

server.listen(environment.port, () => {
  console.info(
    `Backend listening on port ${environment.port} (${environment.nodeEnv})`,
  );
});

async function shutdown(signal: string): Promise<void> {
  console.info(`Received ${signal}; shutting down gracefully.`);

  server.close(async (error) => {
    if (error) {
      console.error(error);
      process.exitCode = 1;
    }

    await disconnectDatabase();
  });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
