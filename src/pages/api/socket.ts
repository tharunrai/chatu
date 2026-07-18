import { Server as NetServer } from "http";
import { NextApiRequest, NextApiResponse } from "next";
import { Server as SocketIOServer } from "socket.io";
import { Socket as NetSocket } from "net";

// Define custom types to handle the socket server attaching to NextApiResponse
export type NextApiResponseServerIO = NextApiResponse & {
  socket: NetSocket & {
    server: NetServer & {
      io: SocketIOServer;
    };
  };
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
  if (!res.socket.server.io) {
    console.log("Starting Socket.io Server...");

    const httpServer = res.socket.server as any;
    const io = new SocketIOServer(httpServer, {
      path: "/api/socket",
      addTrailingSlash: false,
    });

    res.socket.server.io = io;

    io.on("connection", (socket) => {
      console.log("Client connected:", socket.id);

      socket.on("join-room", (roomId: string, username: string) => {
        socket.join(roomId);
        console.log(`User ${username} (${socket.id}) joined room ${roomId}`);
        socket.to(roomId).emit("user-joined", { username, id: socket.id });
      });

      socket.on("send-message", (data: { roomId: string; username: string; text: string; timestamp: number }) => {
        // Broadcast to everyone in the room EXCEPT the sender
        socket.to(data.roomId).emit("receive-message", data);
      });

      socket.on("disconnect", () => {
        console.log("Client disconnected:", socket.id);
      });
    });
  } else {
    // console.log("Socket.io Server already running");
  }

  res.end();
}
