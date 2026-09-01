import { createLocalSystem, type LocalSystem } from "@lcase/runtime";
import { config } from "./runtime.config.js";

export function bootstrap(): LocalSystem {
  return createLocalSystem(config);
}
