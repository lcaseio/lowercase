import { writeFileSync } from "fs";
import {
  EffectHandler,
  EffectHandlerDeps,
  WriteContextToDiskFx,
} from "../engine.types.js";
import path from "path";

export const writeContextToDiskFx: EffectHandler<"WriteContextToDisk"> = (
  effect: WriteContextToDiskFx,
  deps: EffectHandlerDeps
) => {
  const filename = `run-${effect.runId.slice(0, 5)}-original.temp.json`;
  const fullFilePath = path.join(process.cwd(), filename);
  writeFileSync(fullFilePath, JSON.stringify(effect.context), {
    encoding: "utf8",
  });
};
