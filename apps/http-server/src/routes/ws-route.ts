import type { WebSocket } from "@fastify/websocket";
import type { FastifyInstance, FastifyPluginAsync } from "fastify";

export const sockets = new Map<string, WebSocket>();

export const wsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/ws", { websocket: true }, (socket, req) => {
    sockets.set("client", socket);
    socket.send("hello from server");
    console.log("ws endpoint called");
    console.log(sockets.has("client"));

    socket.on("message", (msg) => {
      socket.send(String(msg));
    });
    socket.on("open", () => {
      console.log("open");
    });
    socket.on("close", (msg) => {
      console.log("socket closed");
    });
  });
};
