import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const getSocket = () => {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000", {
      // Force polling to avoid websocket handshake issues in restricted environments.
      transports: ["polling"],
      upgrade: false,
    });
  }
  return socket;
};
