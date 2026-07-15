import { useState } from "react";
import { Outlet } from "react-router-dom";
import { useFlowAnalysis } from "@/hooks/use-flow-analysis";
import type { FlowDefinition } from "@lcase/types";
import { FlowVersionModeNav } from "./FlowVersionModeNav";
import type { FlowVersionOutletContext } from "./context";

const defaultFlowDef = testFlowDef();

export function FlowVersionWorkspace() {
  const [flowDef] = useState<FlowDefinition | null>(defaultFlowDef ?? null);
  const flowAnalysis = useFlowAnalysis(flowDef);

  const outletContext: FlowVersionOutletContext = { flowDef, flowAnalysis };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex flex-row justify-center">
          <h2 className="text-xl font-bold mb-3 mt-3 ml-3 text-sky-800 dark:text-sky-300">
            {flowDef?.name ?? "Untitled flow"} - version{" "}
            {flowDef?.version ?? "?"}
          </h2>
        </div>
        <div className="flex-1 min-h-0">
          <Outlet context={outletContext} />
        </div>
      </div>
      <FlowVersionModeNav />
    </div>
  );
}

function testFlowDef(): FlowDefinition | undefined {
  const testFlow = `{
  "name": "Parallel Flow Test",
  "version": "0.1.0-alpha.10",
  "description": "A description of a flow",
  "start": "p",
  "params": {
    "userWeatherQuery": {
      "type": "text/markdown"
    },
    "systemParser": {
      "type": "text/markdown"
    },
    "userParser": {
      "type": "text/markdown"
    },
    "systemReport": {
      "type": "text/markdown",
      "optional": "true"
    }
  },
  "steps": {
    "p": {
      "type": "parallel",
      "steps": ["one", "two", "three"]
    },
    "one": {
      "type": "httpjson",
      "url": "https://swapi.tech/api/people/1",
      "method": "GET",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "two": {
      "type": "httpjson",
      "url": "https://swapi.tech/api/people/2",
      "method": "GET",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "three": {
      "type": "httpjson",
      "url": "https://swapi.tech/api/people/3",
      "method": "GET",
      "headers": {
        "Content-Type": "application/json"
      }
    },
    "join-step": {
      "type": "join",
      "steps": ["two", "one"],
      "next": "five"
    },

    "five": {
      "type": "httpjson",
      "url": "{{steps.two.output.body.result.properties.homeworld}}",
      "method": "GET",
      "headers": {
        "Content-Type": "application/json"
      },

      "body": {
        "model": "local-mistral",
        "messages": [
          {
            "role": "system",
            "content": "{{params.systemParser}}"
          },
          {
            "role": "user",
            "content": "{{params.userWeatherQuery}}\\n"
          }
        ],
        "temperature": 0,
        "max_tokens": 500,
        "response_format": { "type": "json_object" }
      },
            "exports": {
        "json": {
          "ref": "{{output.body.choices[0].message.content}}",
          "type": "application/json",
          "schema": {
            "type": "object",
            "properties": {
              "location": { "type": "string" },
              "intent": {
                "type": "string",
                "enum": ["forecast", "airquality", "unrelated"]
              }
            },
            "required": ["intent"],
            "if": {
              "properties": { "intent": { "enum": ["forecast", "airquality"] } }
            },
            "then": {
              "required": ["location"]
            }
          },
                    "evalContext": {
            "originalQuestion": {
              "source": "param",
              "name": "userWeatherQuery"
            },
            "groundingContext": { "source": "output", "stepId": "getForecast" }
          }
        },
        "json-markdown": {
          "ref": "{{output.body.choices[0].message.content}}",
          "type": "text/markdown"
        }
      }
    }
  }
}
`;
  try {
    return JSON.parse(testFlow) as FlowDefinition;
  } catch (e) {
    console.log(e);
  }
}
