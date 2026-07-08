import { useAddJsonFlowMutation } from "../redux/api/flows-api";
import { parseFlow } from "@lcase/specs";
import type { PostFlowRes } from "@lcase/types";
import type { SerializedError } from "@reduxjs/toolkit";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useState } from "react";

type Response =
  | {
      data: PostFlowRes;
      error?: undefined;
    }
  | {
      data?: undefined;
      error: FetchBaseQueryError | SerializedError;
    };
export function AddJsonFlow() {
  const [addJsonFlow, { isLoading }] = useAddJsonFlowMutation();
  const [json, setJson] = useState<string>("");
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [response, setResponse] = useState<Response | null>(null);

  const handleChange = async (json: string) => {
    try {
      setJson(json);
      const object = JSON.parse(json.trim());
      const result = parseFlow(object);
      if (!result.ok) throw new Error(result.error);
      setIsValid(true);
    } catch (e) {
      setIsValid(false);
      console.error("error fetching", e);
    }
  };
  const handleSubmit = async () => {
    if (!isValid) return;
    try {
      const object = JSON.parse(json.trim());
      const result = parseFlow(object);
      if (!result.ok) throw new Error(result.error);

      const res = await addJsonFlow({ body: result.value });
      setResponse(res);
    } catch (e) {
      console.error("error fetching", e);
    }
  };

  return (
    <div>
      <p className="mt-8 text-md font-bold">Upload JSON Directly</p>
      <hr className="text-sky-600 text-o mb-6"></hr>
      <textarea
        value={json}
        onChange={(e) => handleChange(e.target.value)}
        id="add-json-flow"
        className="w-6/6 min-h-[500px] resize-none bg-blue-100
          dark:bg-slate-800 dark:border-slate-800 dark:text-amber-200

        rounded-md text-black p-4 mt-2 font-mono text-sm/4"
      ></textarea>
      <button onClick={handleSubmit}>Upload</button>
      <p>Status: {isLoading ? "loading" : "not loading"}</p>
      <p>Is Valid: {isValid ? "true" : "false"}</p>
      <p>
        Response:{" "}
        <span className="font-mono text-sm text-green-300">
          {response?.data?.ok
            ? ` Created flow ${response.data.value.flow.id} at version hash ${response.data.value.version.definitionHash}`
            : ""}
        </span>
      </p>
    </div>
  );
}
