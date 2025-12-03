import { EventBusPort } from "../bus/event-bus.port.js";
import { EmitterFactoryPort } from "../events/emitter-factory.port.js";
import { JobParserPort } from "../events/job-parser.port.js";
import { StepHandlerRegistryPort } from "./step-handler.port.js";
import { RunOrchestratorPort } from "./run-orchestrator.port.js";
import { StepRunnerPort } from "./step-runner.port.js";
import { EngineTelemetryPort } from "./telemetry.port.js";
import { FlowParserPort } from "../events/flow-parser.port.js";
import { FlowRouterPort } from "./flow-router.js";

export type EngineDeps = {
  bus: EventBusPort;
  ef: EmitterFactoryPort;
  tel: EngineTelemetryPort;
  flowParser: FlowParserPort;
  jobParser: JobParserPort;
  stepHandlerRegistry: StepHandlerRegistryPort;
  stepRunner: StepRunnerPort;
  runOrchestrator: RunOrchestratorPort;
  flowRouter: FlowRouterPort;
};
