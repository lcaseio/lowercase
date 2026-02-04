import type { FastifyInstance, FastifyPluginAsync } from "fastify";

export const wsRoute: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get("/ws", { websocket: true }, (socket, req) => {
    socket.send("hello from server");

    socket.on("message", (msg) => {
      socket.send(String(msg));
    });
  });
};
