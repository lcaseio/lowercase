import { AnyEvent } from "@lcase/types";

export interface RmToolHandlerPort {
  handle(event: AnyEvent): void;
}
