import { FlowDefinition } from "@lcase/types";
import { RuntimeControls } from "../components/RuntimeControls.js";
import { useClientApi } from "../context/ClientApiContext.js";
import { Nav } from "./Nav.js";

const flow: FlowDefinition = {
  name: "HTTP JSON Flow",
  version: "0.1.0-alpha.9",
  start: "post",
  steps: {
    post: {
      type: "httpjson",
      url: "https://swapi.tech/api/people/1",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      on: {
        failure: "delete",
      },
    },
    delete: {
      type: "httpjson",
      url: "https://swapi.tech/api/people/2",
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    },
  },
};

export function Header(props: { title: string }) {
  const api = useClientApi();

  const result = api.postJsonFlow(flow);
  return (
    <header>
      <h2>{props.title}</h2>
      <Nav />
      {/* <RuntimeControls /> */}
    </header>
  );
}
