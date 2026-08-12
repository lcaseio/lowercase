import { useRef, useState } from "react";
import type { ArtifactIndex, ArtifactUpdateMetadata } from "@lcase/types";
import { isArtifactCompatible } from "@lcase/flow-analysis";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { IdentityField } from "@/components/fields/IdentityField";
import { InputField } from "@/components/fields/InputField";
import { SwitchField } from "@/components/fields/SwitchField";
import { CuratedParamsField } from "@/components/fields/CuratedParamsField";
import { useGetFlowVersionDefQuery } from "@/redux/api/flows-api";
import {
  artifactsApi,
  useCreateArtifactMutation,
} from "@/redux/api/artifacts-api";
import { useAppDispatch } from "@/redux/typed-hooks";
import { detectFileFormat } from "@/lib/detect-file-format";
import { formatBytes } from "@/lib/format-bytes";
import { useDockviewApi } from "./explorer-dockview-context";
import { openOrFocusPanel } from "./explorer-panels";
import { titleFor } from "./artifact-title";
import { TextCursorIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  versionId: string;
};

// "Upload a file" stays entirely in this dialog -- small enough that a
// modal is plenty, no dockview panel needed (see PR 24 in
// docs/UI_WORKSPACE_MILESTONE.md). "Create" instead closes this and
// opens a real panel (needs Monaco, needs real room) -- see
// artifact-authoring-panel/Content.tsx.
export function CreateArtifactDialog({ open, onOpenChange, versionId }: Props) {
  const [step, setStep] = useState<"choose" | "upload">("choose");
  const dispatch = useAppDispatch();
  const dockviewApi = useDockviewApi();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: versionData } = useGetFlowVersionDefQuery(versionId);
  const flowDef = versionData?.ok ? versionData.value.definition : null;
  const version = versionData?.ok ? versionData.value.version : null;

  const [createArtifact, { isLoading: isSaving }] = useCreateArtifactMutation();
  const [file, setFile] = useState<File | null>(null);
  const [pickError, setPickError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [label, setLabel] = useState("");
  const [share, setShare] = useState(false);
  const [curatedParamNames, setCuratedParamNames] = useState<string[]>([]);

  const reset = () => {
    setStep("choose");
    setFile(null);
    setPickError(null);
    setSaveError(null);
    setLabel("");
    setShare(false);
    setCuratedParamNames([]);
  };

  // Reset only when a fresh open begins, never on close -- resetting on
  // close would flip content (e.g. back to the "choose" step) while
  // DialogContent is still mounted and fading out, making the close
  // transition look like a second dialog appearing then disappearing.
  // React's "adjust state during render when a prop changes" pattern
  // (not an effect -- setState directly in an effect body is disallowed
  // by this repo's lint config, and would cost an extra render anyway).
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) reset();
  }

  function handleAuthor() {
    if (!dockviewApi) return;
    openOrFocusPanel(dockviewApi, {
      kind: "artifact-authoring",
      label: "New Artifact",
      versionId,
    });
    onOpenChange(false);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSaveError(null);
    const picked = e.target.files?.[0] ?? null;
    if (!picked) {
      setFile(null);
      setPickError(null);
      return;
    }
    if (detectFileFormat(picked) === "bytes") {
      setFile(null);
      const message =
        "Unsupported file type -- only JSON, text, and Markdown files are supported right now.";
      setPickError(message);
      toast.error(message, { position: "top-center" });
      e.target.value = "";
      return;
    }
    setPickError(null);
    setFile(picked);
  }

  const format = file ? detectFileFormat(file) : undefined;
  const compatibleParams =
    flowDef && file && format
      ? Object.fromEntries(
          Object.entries(flowDef.params ?? {}).filter(([, def]) =>
            isArtifactCompatible(
              { contentType: file.type, format } as ArtifactIndex,
              def.type,
            ),
          ),
        )
      : undefined;

  async function handleSave() {
    if (!file || !version) return;
    setSaveError(null);
    const metadata: ArtifactUpdateMetadata = {
      label: label.trim() ? label.trim() : null,
      flowId: share ? version.flowId : null,
      flowVersionId: versionId,
      paramCurations: curatedParamNames,
    };
    try {
      const result = await createArtifact({
        kind: "file",
        file,
        metadata,
      }).unwrap();
      if (result.ok) {
        const associations = {
          flowId: metadata.flowId ?? undefined,
          flowVersionId: versionId,
          curated: true,
          paramCurations: curatedParamNames.map((paramName) => ({
            flowVersionId: versionId,
            paramName,
          })),
        };
        dispatch(
          artifactsApi.util.updateQueryData(
            "listArtifacts",
            { flowVersionId: versionId, curated: "true" },
            (list) => {
              if (!list.ok) return;
              list.value.push({ artifact: result.value, associations });
            },
          ),
        );
        if (dockviewApi) {
          openOrFocusPanel(dockviewApi, {
            kind: "artifact",
            label: titleFor({ artifact: result.value, associations }),
            hash: result.value.hash,
            versionId,
          });
        }
        toast.success(
          `Created artifact "${titleFor({ artifact: result.value, associations })}"`,
        );
        onOpenChange(false);
      } else {
        setSaveError(result.error);
        toast.error(result.error, { position: "top-center" });
      }
    } catch {
      setSaveError("Failed to create artifact. Please try again.");
      toast.error("Failed to create artifact. Please try again.", {
        position: "top-center",
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-0 dark:bg-neutral-875">
        <DialogHeader>
          <DialogTitle>New artifact</DialogTitle>
        </DialogHeader>

        {step === "choose" ? (
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer justify-start"
              onClick={() => setStep("upload")}
            >
              <UploadIcon />
              Upload a file
            </Button>
            <Button
              type="button"
              variant="outline"
              className="cursor-pointer justify-start"
              onClick={handleAuthor}
            >
              <TextCursorIcon />
              Create a file
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.txt,.md,application/json,text/plain,text/markdown"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer"
              >
                Browse...
              </Button>
              <p className="text-sm text-muted-foreground">
                {file ? file.name : "No file selected"}
              </p>
            </div>
            {pickError && (
              <p className="text-xs text-destructive">{pickError}</p>
            )}

            {file && (
              <>
                <IdentityField label="Content Type" value={file.type} />
                <IdentityField label="Size" value={formatBytes(file.size)} />
              </>
            )}

            <InputField label="Label" value={label} onChange={setLabel} />
            <SwitchField label="Share" value={share} onChange={setShare} />
            <CuratedParamsField
              label="Params"
              params={compatibleParams}
              curatedParamNames={curatedParamNames}
              onToggleParam={(paramName, checked) =>
                setCuratedParamNames((names) =>
                  checked
                    ? names.includes(paramName)
                      ? names
                      : [...names, paramName]
                    : names.filter((name) => name !== paramName),
                )
              }
            />
            {saveError && (
              <p className="text-sm text-destructive">{saveError}</p>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "choose" ? (
            <Button
              type="button"
              variant="secondary"
              className="cursor-pointer"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
          ) : (
            <>
              <Button
                type="button"
                variant="secondary"
                className="cursor-pointer"
                onClick={() => onOpenChange(false)}
                disabled={isSaving}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="cursor-pointer"
                onClick={handleSave}
                disabled={!file || isSaving}
              >
                Save
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
