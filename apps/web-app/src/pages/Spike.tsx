import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { FlowGraph } from "@/components/FlowGraph";
import type { FlowDefinition } from "@lcase/types";
import {
  BotIcon,
  CircleAlertIcon,
  CurlyBracesIcon,
  EditIcon,
  EyeIcon,
  FileTextIcon,
  Footprints,
  NetworkIcon,
  ScaleIcon,
  ScrollTextIcon,
  Settings2Icon,
  TerminalIcon,
  VariableIcon,
} from "lucide-react";
import { ToggleGroupItem, ToggleGroup } from "@/components/ui/toggle-group";
import type { Node } from "@xyflow/react";
import { StepDetails } from "@/components/StepDetails";
import { FlowSettings } from "@/components/FlowSettings";
import { CodeEditor } from "@/components/CodeEditor";
import { FlowParameters } from "@/components/FlowParameters";
import { FlowProblemsList } from "@/components/FlowProblemsList";
import { useFlowAnalysis } from "@/hooks/use-flow-analysis";
import { useState } from "react";
import { FlowVersionList } from "@/components/FlowVersionList";

const defaultFlowDef = testFlowDef();
export function Spike() {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [flowDef] = useState<FlowDefinition | null>(defaultFlowDef ?? null);
  const [activeDetailsTab, setActiveDetailsTab] = useState("settings");
  const flowAnalysis = useFlowAnalysis(flowDef);
  const problems = flowAnalysis?.flowAnalysis.problems ?? [];

  function handleNodeClick(node: Node) {
    setSelectedStepId(node.id);
    setActiveDetailsTab("details");
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        <div className="flex-1 min-h-0 flex flex-col">
          <div className="flex flex-row justify-center">
            <h2 className="text-xl font-bold mb-3 mt-3 ml-3 text-sky-800 dark:text-sky-300">
              Parallel Flow Test - version 5
            </h2>
          </div>
          <ResizablePanelGroup
            orientation="horizontal"
            className="flex-1 min-h-0 border dark:border-neutral-800"
          >
            <ResizablePanel
              defaultSize="10%"
              className="pl-5 dark:bg-neutral-875"
            >
              <FlowVersionList
                flowName="Parallel Flow Test"
                kind="business"
                versions={[
                  {
                    id: "version id",
                    flowId: "version flow id",
                    sequence: 0,
                    definitionHash: "definition hash",
                    createdAt: "created At",
                  },
                  {
                    id: "version id",
                    flowId: "version flow id",
                    sequence: 1,
                    definitionHash: "definition hash",
                    createdAt: "created At",
                    versionLabel: "Green Frog",
                  },
                ]}
              />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="60%">
              <Tabs defaultValue="list" className="h-full flex flex-col">
                <TabsList variant="line">
                  <TabsTrigger value="list">
                    <NetworkIcon />
                    Graph
                  </TabsTrigger>
                  <TabsTrigger value="create">
                    <CurlyBracesIcon />
                    JSON
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="list"
                  className="flex-1 min-h-0 dark:bg-panel-subtle"
                >
                  {flowDef ? (
                    <FlowGraph
                      flowDef={flowDef}
                      layout={flowAnalysis?.layout ?? null}
                      outEdges={flowAnalysis?.flowAnalysis.outEdges ?? {}}
                      onNodeClickHandler={handleNodeClick}
                    ></FlowGraph>
                  ) : (
                    "invalid flow def"
                  )}
                </TabsContent>
                <TabsContent value="create">
                  {flowDef && (
                    <CodeEditor
                      language="json"
                      value={JSON.stringify(flowDef, null, 2)}
                      height="100%"
                      readOnly
                    />
                  )}
                </TabsContent>
              </Tabs>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="30%" className="dark:bg-neutral-800">
              <Tabs
                value={activeDetailsTab}
                onValueChange={setActiveDetailsTab}
                className="h-full flex flex-col"
              >
                <TabsList variant="line">
                  <TabsTrigger value="settings">
                    <Settings2Icon />
                    Settings
                  </TabsTrigger>
                  <TabsTrigger value="params">
                    <VariableIcon />
                    Parameters
                  </TabsTrigger>
                  <TabsTrigger value="details">
                    <Footprints />
                    Step Details
                  </TabsTrigger>

                  <TabsTrigger value="problems">
                    <CircleAlertIcon />
                    Problems{" "}
                    {problems.length >= 1 ? (
                      <span className="text-xs font-normal rounded px-1.5 py-0.5 bg-cyan-900 text-cyan-100">
                        {problems.length}
                      </span>
                    ) : null}
                  </TabsTrigger>
                </TabsList>
                <TabsContent
                  value="settings"
                  className="flex-1 min-h-0 ml-3 mr-3"
                >
                  {flowDef && (
                    <FlowSettings
                      name={flowDef.name}
                      start={flowDef.start}
                      version={flowDef.version}
                      description={flowDef.description}
                      kind={flowDef.kind}
                    />
                  )}
                </TabsContent>
                <TabsContent value="params" className="ml-3 mr-3 flex flex-col">
                  <FlowParameters label="Params" value={flowDef?.params} />
                </TabsContent>
                <TabsContent value="details" className="ml-3 mr-3">
                  <h2 className="mt-3 text-lg">{selectedStepId}</h2>
                  <StepDetails stepId={selectedStepId} flowDef={flowDef} />
                </TabsContent>

                <TabsContent value="problems" className="ml-3 mr-3">
                  <h2 className="mt-3 mb-3 text-lg">Flow Analysis Problems</h2>
                  <FlowProblemsList problems={problems} />
                </TabsContent>
              </Tabs>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
        <ToggleGroup
          type="single"
          className="w-full flex justify-center overflow-hidden rounded-none text-sky-800 dark:text-sky-300 dark:bg-sky-950 bg-sky-200"
        >
          <ToggleGroupItem value="edit">
            <EditIcon />
            Edit
          </ToggleGroupItem>
          <ToggleGroupItem value="view">
            <EyeIcon />
            View
          </ToggleGroupItem>
          <ToggleGroupItem value="run">
            <TerminalIcon />
            Run
          </ToggleGroupItem>
          <ToggleGroupItem value="runs">
            <ScrollTextIcon />
            Run History
          </ToggleGroupItem>
          <ToggleGroupItem value="sims">
            <BotIcon />
            Sims
          </ToggleGroupItem>
          <ToggleGroupItem value="artifacts">
            <FileTextIcon />
            Artifacts
          </ToggleGroupItem>
          <ToggleGroupItem value="evals">
            <ScaleIcon />
            Evals
          </ToggleGroupItem>
        </ToggleGroup>
      </div>
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
