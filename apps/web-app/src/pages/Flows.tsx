import type { FlowDefinition } from "@lcase/types";
import { AddJsonFlow } from "../components/AddJsonFlow";
import { FlowTree } from "../components/FlowTree";
import { ListFlows } from "../components/ListFlows";
import { UploadFlowFile } from "../components/UploadFlowFile";
import { Header } from "../layout/Header";
import { Main } from "../layout/Main";

const flow: FlowDefinition = {
  name: "Parallel Flow Test",
  version: "0.1.0-alpha.9",
  start: "p",
  steps: {
    p: {
      type: "parallel",
      steps: ["one", "two", "three"],
    },
    one: {
      type: "httpjson",
      url: "https://swapi.tech/api/people/1",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    two: {
      type: "httpjson",
      url: "https://swapi.tech/api/people/2",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    three: {
      type: "httpjson",
      url: "https://swapi.tech/api/people/3",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
    "join-step": {
      type: "join",
      steps: ["two", "one"],
      next: "five",
    },

    five: {
      type: "httpjson",
      url: "{{steps.two.output.body.result.properties.homeworld}}",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  },
};

export function Flows() {
  return (
    <div id="page-wrapper">
      <Header />
      <Main>
        <h2 className="text-xl font-bold mb-5">Flows</h2>
        <ListFlows />
        <FlowTree flowDef={flow} />
        <UploadFlowFile />
        <AddJsonFlow />
      </Main>
    </div>
  );
}
