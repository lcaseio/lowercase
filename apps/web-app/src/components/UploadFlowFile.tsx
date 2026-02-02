import { useState } from "react";
import { useUploadFlowFileMutation } from "../redux/api/flows-api";
import type { FlowList } from "@lcase/ports";

export function UploadFlowFile() {
  const [uploadFlowFile, uploadState] = useUploadFlowFileMutation();

  const [files, setFiles] = useState<File[]>([]);
  const [uploadRes, setUploadRes] = useState<FlowList | string>("");

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    setFiles([...fileList]);
  };

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    if (files.length === 0) return;

    try {
      const result = await uploadFlowFile({ files });
      if (result.error) setUploadRes(JSON.stringify(result.error, null, 2));
      else setUploadRes(JSON.stringify(result.data, null, 2));
      setFiles([]);
    } catch (e) {
      console.log(e);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <h3>Upload JSON Flow File</h3>
      <label>
        File:
        <input
          type="file"
          accept=".json,application/json,text/json"
          onChange={onSelectFile}
          className="bg-sky-800 cursor-pointer rounded-md
            ml-2
            mr-2
            pl-2
            w-80
            text-md
            transition duration-300 ease-in-out hover:translate
           hover:inset-ring hover:inset-ring-sky-500"
        />
      </label>
      <button
        type="submit"
        disabled={uploadState.isLoading || files.length === 0}
      >
        {uploadState.isLoading ? "Uploading... " : "Upload"}
      </button>
      <p>Status: {uploadRes.toString()}</p>
    </form>
  );
}
