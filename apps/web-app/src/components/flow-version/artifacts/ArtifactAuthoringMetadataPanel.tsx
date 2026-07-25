import type { ArtifactIndex, FlowParamDefinition } from "@lcase/types";
import { isArtifactCompatible } from "@lcase/flow-analysis";
import { formatBytes } from "@/lib/format-bytes";
import { detectFileFormat } from "@/lib/detect-file-format";
import { detectAuthoredFormat } from "@/lib/detect-authored-format";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  selectFlowVersionArtifactsState,
  setAuthoringContentType,
  setAuthoringShare,
  toggleAuthoringParam,
  updateAuthoringLabel,
} from "@/redux/slices/flow-version-artifacts-slice";
import { IdentityField } from "../../fields/IdentityField";
import { InputField } from "../../fields/InputField";
import { SwitchField } from "../../fields/SwitchField";
import { SelectField } from "../../fields/SelectField";
import { CuratedParamsField } from "../../fields/CuratedParamsField";

const CONTENT_TYPE_OPTIONS = [
  { value: "application/json", label: "JSON" },
  { value: "text/markdown", label: "Markdown" },
  { value: "text/plain", label: "Plain Text" },
];

type Props = {
  flowVersionId: string | null;
  params?: Record<string, FlowParamDefinition>;
};

// right panel while authoring -- composes label/share/params for the
// artifact about to be created. No Save/Cancel here (those live in the
// middle panel, see ArtifactUploadPanel/ArtifactAuthorTextPanel)
// and no hash/time (never applicable pre-upload)
export function ArtifactAuthoringMetadataPanel({
  flowVersionId,
  params,
}: Props) {
  const dispatch = useAppDispatch();
  const { authoringDraft } = useAppSelector((s) =>
    selectFlowVersionArtifactsState(s, flowVersionId),
  );

  if (!authoringDraft) return null;

  const file = authoringDraft.kind === "file" ? authoringDraft.file : null;
  // format is never stored (see ArtifactAuthoringDraftFile) -- derived here,
  // right at the one place that actually needs it (isArtifactCompatible's
  // fallback check), from whichever fields the current kind already has
  const contentType =
    authoringDraft.kind === "file"
      ? file?.contentType
      : authoringDraft.contentType;
  const format =
    authoringDraft.kind === "file"
      ? file
        ? detectFileFormat({ name: file.name, type: file.contentType })
        : undefined
      : detectAuthoredFormat(authoringDraft.contentType);

  // same pre-filter ArtifactMetadataPanel already uses -- only
  // offer params whose declared type is actually compatible; empty/absent
  // until a content type is known (file kind: not yet picked)
  const compatibleParams =
    params && contentType && format
      ? Object.fromEntries(
          Object.entries(params).filter(([, def]) =>
            isArtifactCompatible(
              { contentType, format } as ArtifactIndex,
              def.type,
            ),
          ),
        )
      : undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        {authoringDraft.kind === "file" ? (
          <>
            {/* em dash (not undefined) so these always render -- reserves
            the same vertical space whether or not a file is picked yet, so
            Label/Share below don't shift when one is */}
            <IdentityField label="Filename" value={file?.name ?? "—"} />
            <IdentityField
              label="Content Type"
              value={file?.contentType ?? "—"}
            />
            <IdentityField
              label="Size"
              value={file ? formatBytes(file.size) : "—"}
            />
          </>
        ) : (
          <SelectField
            label="Content Type"
            value={authoringDraft.contentType}
            options={CONTENT_TYPE_OPTIONS}
            onChange={(v) =>
              dispatch(
                setAuthoringContentType(v as typeof authoringDraft.contentType),
              )
            }
          />
        )}

        <InputField
          label="Label"
          value={authoringDraft.label}
          onChange={(v) => dispatch(updateAuthoringLabel(v))}
        />
        <SwitchField
          label="Share"
          value={authoringDraft.share}
          onChange={(checked) => dispatch(setAuthoringShare(checked))}
        />
        <CuratedParamsField
          label="Params"
          params={compatibleParams}
          curatedParamNames={authoringDraft.curatedParamNames}
          onToggleParam={(paramName, checked) =>
            dispatch(toggleAuthoringParam({ paramName, checked }))
          }
        />
      </div>
    </div>
  );
}
