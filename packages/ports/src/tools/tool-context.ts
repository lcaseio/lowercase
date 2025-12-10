import { JobEventData } from "@lcase/types";
import { ConsumerStreamPort, ProducerStreamPort } from "../stream.port.js";
import { EmitterFactoryPort } from "../events/emitter-factory.port.js";

export type ToolDeps = {
  consumer?: ConsumerStreamPort;
  producer?: ProducerStreamPort;
  ef: EmitterFactoryPort;
};
