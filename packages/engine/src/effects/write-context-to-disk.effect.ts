import { appendFileSync, writeFileSync } from "fs";
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
  const filename = `${effect.runId.slice(0, 8)}-original.temp.jsonl`;
  const fullFilePath = path.join(process.cwd(), filename);
  appendFileSync(fullFilePath, JSON.stringify(effect.context) + "\n", {
    encoding: "utf8",
  });
};
