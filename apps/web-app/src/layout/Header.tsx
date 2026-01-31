import type { FlowDefinition } from "@lcase/types";
import { useAddJsonFlowMutation } from "../redux/api/flows-api";
import { Nav } from "./Nav";

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

export function Header() {
  const [addJsonFlow, { isLoading }] = useAddJsonFlowMutation();

  const handleSubmit = async (flow: FlowDefinition) => {
    try {
      await addJsonFlow({ body: flow });
    } catch (e) {
      console.error("error fetching", e);
    }
  };
  return (
    <header>
      <h2>lowercase</h2>
      <Nav />
      <button onClick={() => handleSubmit(flow)}>Submit</button>
      <p>Status: {isLoading ? "loading" : "not loading"}</p>
    </header>
  );
}
