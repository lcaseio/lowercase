import { useState } from "react";
import { useUploadFlowFileMutation } from "../redux/api/flows-api";
import { Button } from "./ui/button";

export function UploadFlowFile() {
  const [uploadFlowFile, uploadState] = useUploadFlowFileMutation();

  const [files, setFiles] = useState<File[]>([]);
  const [uploadRes, setUploadRes] = useState<string>("");

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
    <div className="mt-8">
      <form onSubmit={handleSubmit}>
        <h3 className="font-bold">Upload JSON Flow File</h3>
        <hr className="text-gray-400 dark:text-gray-700 text-o mb-5"></hr>
        <label>
          File:
          <input
            type="file"
            accept=".json,application/json,text/json"
            onChange={onSelectFile}
            className="bg-gray-300 dark:bg-gray-700  cursor-pointer rounded-md
            ml-2
            mr-2
            pl-2
            w-80
            text-md
            transition duration-300 ease-in-out hover:translate
           hover:inset-ring hover:inset-ring-gray-500"
          />
        </label>
        <Button
          className="cursor-pointer"
          type="submit"
          disabled={uploadState.isLoading || files.length === 0}
        >
          {uploadState.isLoading ? "Uploading... " : "Upload"}
        </Button>
        <p>Status: {uploadRes.toString()}</p>
      </form>
    </div>
  );
}
