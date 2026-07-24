import type { ArtifactIndex, FlowParamDefinition } from "@lcase/types";
import { isArtifactCompatible } from "@lcase/flow-analysis";
import { formatBytes } from "@/lib/format-bytes";
import { useAppDispatch, useAppSelector } from "@/redux/typed-hooks";
import {
  selectFlowVersionArtifactsState,
  setAuthoringShare,
  toggleAuthoringParam,
  updateAuthoringLabel,
} from "@/redux/slices/flow-version-artifacts-slice";
import { IdentityField } from "../fields/IdentityField";
import { InputField } from "../fields/InputField";
import { SwitchField } from "../fields/SwitchField";
import { CuratedParamsField } from "../fields/CuratedParamsField";

type Props = {
  flowVersionId: string | null;
  params?: Record<string, FlowParamDefinition>;
};

// right panel while authoring -- composes label/share/params for the
// artifact about to be created. No Save/Cancel here (those live in the
// middle panel, see FlowVersionArtifactUploadPanel) and no hash/time (never
// applicable pre-upload)
export function FlowVersionArtifactAuthoringMetadataPanel({
  flowVersionId,
  params,
}: Props) {
  const dispatch = useAppDispatch();
  const { authoringDraft } = useAppSelector((s) =>
    selectFlowVersionArtifactsState(s, flowVersionId),
  );

  if (!authoringDraft) return null;

  const file = authoringDraft.file;
  // same pre-filter FlowVersionArtifactMetadataPanel already uses -- only
  // offer params whose declared type is actually compatible; empty/absent
  // until a file (and therefore a content type) is known
  const compatibleParams =
    params && file
      ? Object.fromEntries(
          Object.entries(params).filter(([, def]) =>
            isArtifactCompatible(
              {
                contentType: file.contentType,
                format: file.format,
              } as ArtifactIndex,
              def.type,
            ),
          ),
        )
      : undefined;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex flex-col gap-4 p-4 overflow-y-auto">
        {/* em dash (not undefined) so these always render -- reserves the
        same vertical space whether or not a file is picked yet, so Label/
        Share below don't shift when one is */}
        <IdentityField label="Filename" value={file?.name ?? "—"} />
        <IdentityField label="Content Type" value={file?.contentType ?? "—"} />
        <IdentityField
          label="Size"
          value={file ? formatBytes(file.size) : "—"}
        />
        <IdentityField label="Format" value={file?.format ?? "—"} />

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
