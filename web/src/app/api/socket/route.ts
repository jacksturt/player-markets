// app/api/socket/route.ts
import { NextResponse } from "next/server";
export const runtime = "edge";

import { headers } from "next/headers";
let socket: WebSocket | null = null;
let lastMessageTime: number = Date.now();
const TIMEOUT_THRESHOLD = 30000; // 30 seconds timeout

function checkConnection() {
  if (socket && Date.now() - lastMessageTime > TIMEOUT_THRESHOLD) {
    console.log("Connection timed out, reconnecting...");
    socket.close();
    socket = null;
  }
}

// Start a periodic check
setInterval(checkConnection, 5000); // Check every 5 seconds

export async function GET() {
  const setupSocket = () => {
    const url = "ws://localhost:1234";
    socket = new WebSocket(url);
    const headersList = headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const sendData = async (data: any) => {
      try {
        await fetch(`${baseUrl}/api/db/handlers`, {
          method: "POST",
          body: JSON.stringify(data),
          headers: {
            "Content-Type": "application/json",
          },
        });
      } catch (error) {
        console.error("Error forwarding data:", error);
      }
    };

    socket.onopen = () => {
      console.log("Connected to server");
      lastMessageTime = Date.now();
    };

    socket.onmessage = async (event) => {
      lastMessageTime = Date.now(); // Update last message time
      const data = JSON.parse(event.data);
      await sendData(data);
    };

    socket.onclose = () => {
      console.log("Connection closed, attempting to reconnect...");
      socket = null;
      // Attempt to reconnect after a short delay
      setTimeout(() => {
        if (!socket || socket.readyState === WebSocket.CLOSED) {
          setupSocket();
        }
      }, 5000);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      socket?.close();
    };
  };

  if (!socket || socket.readyState === WebSocket.CLOSED) {
    setupSocket();
  }

  return NextResponse.json({ status: "connected" });
}
