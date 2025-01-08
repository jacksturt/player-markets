import WebSocket from 'ws';
import { Connection } from "@solana/web3.js";
import { FillLogResult } from "./types";

export class FillFeed {
  private wss: WebSocket.Server;
  private shouldEnd: boolean = false;
  private ended: boolean = false;
  private lastUpdateUnix: number = Date.now();

  constructor(private connection: Connection) {
    this.wss = new WebSocket.Server({ port: 1234 });
    this.setupWebSocket();
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('New client connected');

      ws.on('message', (message: string) => {
        console.log(`Received message: ${message}`);
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  public async parseLogs(endEarly?: boolean) {
    console.log("Started parsing logs");
    // Implement the log parsing logic here
  }

  public async stopParseLogs() {
    this.shouldEnd = true;
    while (!this.ended) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}
