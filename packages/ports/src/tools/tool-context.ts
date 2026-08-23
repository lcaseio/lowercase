import type { ConsumerStreamPort, ProducerStreamPort } from "../stream.port.js";
import type { EmitterFactoryPort } from "../events/emitter-factory.port.js";

export type ToolDeps = {
  consumer?: ConsumerStreamPort;
  producer?: ProducerStreamPort;
  ef: EmitterFactoryPort;
};
