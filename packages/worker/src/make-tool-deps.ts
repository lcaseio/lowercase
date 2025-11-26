import { EmitterFactoryPort, StreamRegistryPort, ToolDeps } from "@lcase/ports";
import { PipeData } from "@lcase/types";

export function makeTookDeps(
  pipe: PipeData,
  ef: EmitterFactoryPort,
  sr: StreamRegistryPort
): ToolDeps {
  const deps: ToolDeps = { ef };
  if (pipe.to?.id) {
    deps.producer = sr.getProducer(pipe.to.id);
  }
  if (pipe.from?.id) {
    deps.consumer = sr.getConsumer(pipe.from.id);
  }
  return deps;
}
