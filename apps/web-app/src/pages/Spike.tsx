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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import type { Node } from "@xyflow/react";
import { StepDetails } from "@/components/StepDetails";
import { FlowSettings } from "@/components/FlowSettings";

const defaultFlowDef = testFlowDef();
export function Spike() {
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [flowDef] = useState<FlowDefinition | null>(defaultFlowDef ?? null);
  const [activeDetailsTab, setActiveDetailsTab] = useState("settings");

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
            <ResizablePanel defaultSize="10%" className="pl-5">
              <h3 className="mt-2 mb-2 text-lg font-bold">Steps</h3>
              <h3 className="mt-2 text-lg font-bold">Capabilities</h3>
              <p>httpjson</p>
              <p>mcp</p>
              <h3 className="mt-2 text-lg font-bold">Control Flow</h3>
              <p>Parallel</p>
              <p>Join</p>
              <p>Branch</p>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="50%">
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
                <TabsContent value="list" className="flex-1 min-h-0">
                  {flowDef ? (
                    <FlowGraph
                      flowDef={flowDef}
                      onNodeClickHandler={handleNodeClick}
                    ></FlowGraph>
                  ) : (
                    "invalid flow def"
                  )}
                </TabsContent>
                <TabsContent value="create">
                  <p>create</p>
                </TabsContent>
              </Tabs>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize="40%" className="dark:bg-neutral-800">
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
                  <TabsTrigger value="details">
                    <Footprints />
                    Step Details
                  </TabsTrigger>
                  <TabsTrigger value="params">
                    <VariableIcon />
                    Parameters
                  </TabsTrigger>
                  <TabsTrigger value="problems">
                    <CircleAlertIcon />
                    Problems{" "}
                    <span className="text-xs font-normal rounded px-1.5 py-0.5 bg-cyan-900 text-cyan-100">
                      3
                    </span>
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
                <TabsContent value="details" className="ml-3 mr-3">
                  <h2 className="mt-3 text-lg">{selectedStepId}</h2>
                  <StepDetails stepId={selectedStepId} flowDef={flowDef} />
                </TabsContent>
                <TabsContent value="params">
                  <h2>Run Parameters</h2>
                  <label>Name</label>
                  <Input type="text"></Input>
                  <label>Content-Type</label>
                  <Select>
                    <SelectTrigger className="min-w-[10rem]">
                      <SelectValue placeholder="Select a Context-Type"></SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem key="placeholder1" value="application/json">
                          application/json
                        </SelectItem>
                        <SelectItem key="placeholder2" value="text/plain">
                          text/plain
                        </SelectItem>
                        <SelectItem key="placeholder3" value="text/markdown">
                          text/markdown
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  <Button variant="outline">Add</Button>
                </TabsContent>
                <TabsContent value="problems">
                  <h2>Flow Analysis Problems</h2>
                  <p>
                    A list of problems that should be fixed prior to publishing
                  </p>
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
      },
      "on": { "success": "five", "failure": "five"}
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
