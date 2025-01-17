// app/api/socket/route.ts
import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { OrderType } from "@prisma/client";
import { PlaceOrderLogResult } from "@/lib/types";
export const runtime = "edge";

import { headers } from "next/headers";
let socket: WebSocket | null = null;

export async function GET() {
  if (!socket || socket.readyState === WebSocket.CLOSED) {
    const url = "ws://localhost:1234";
    socket = new WebSocket(url);
    const headersList = headers();
    const host = headersList.get("host");
    const protocol = process.env.NODE_ENV === "development" ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;

    const sendData = async (data: any) => {
      try {
        // Forward the data to your database handler route
        console.log("sending data", data);
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
    };

    socket.onmessage = async (event) => {
      const data = JSON.parse(event.data);
      await sendData(data);
    };

    socket.onclose = () => {
      // Handle reconnection logic
      socket = null;
    };
  }

  return NextResponse.json({ status: "connected" });
}
