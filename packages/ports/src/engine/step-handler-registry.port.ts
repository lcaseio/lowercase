import { StepHandlerPort } from "./step-handler.port.js";

export type StepHandlerRegistryPort = {
  [stepType in string]: () => StepHandlerPort;
};
