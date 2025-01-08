import { Connection } from "@solana/web3.js";
import WebSocket from "ws";

class FillFeedServer {
  private wss: WebSocket.Server;
  private connection: Connection;

  constructor(connection: Connection) {
    this.connection = connection;
    this.wss = new WebSocket.Server({ port: 1234 });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on("connection", (ws: WebSocket) => {
      console.log("Client connected");

      ws.on("message", (message: string) => {
        console.log("Received:", message);
      });

      ws.on("close", () => {
        console.log("Client disconnected");
      });
    });
  }

  public async start() {
    console.log("WebSocket server started on port 1234");
  }
}

async function main() {
  const connection = new Connection("http://localhost:8899", "confirmed");
  const server = new FillFeedServer(connection);
  await server.start();
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
