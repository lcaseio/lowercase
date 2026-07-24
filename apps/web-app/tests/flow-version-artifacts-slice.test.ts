import { describe, expect, it } from "vitest";
import {
  artifactAuthored,
  artifactMetadataSaved,
  cancelAuthoringArtifact,
  cancelEditingArtifactMetadata,
  enterFlowVersionArtifactsScope,
  flowVersionArtifactsSlice,
  selectArtifact,
  selectFlowVersionArtifactsState,
  setAuthoringFile,
  setAuthoringShare,
  setDraftShare,
  startAuthoringArtifact,
  startEditingArtifactMetadata,
  toggleAuthoringParam,
  toggleDraftParam,
  updateAuthoringLabel,
  updateDraftLabel,
} from "@/redux/slices/flow-version-artifacts-slice";
import type { RootState } from "@/redux/store";

const reducer = flowVersionArtifactsSlice.reducer;

const BASE_STATE = {
  flowVersionId: null,
  flowId: null,
  selectedArtifactHash: null,
  draft: null,
  isEditing: false,
  mode: "browsing" as const,
  authoringDraft: null,
};

function stateFor(flowVersionArtifacts: ReturnType<typeof reducer>) {
  return { flowVersionArtifacts } as unknown as RootState;
}

describe("flowVersionArtifactsSlice", () => {
  it("enters a scope, storing flowVersionId and flowId", () => {
    const state = reducer(
      undefined,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    expect(state).toEqual({
      ...BASE_STATE,
      flowVersionId: "fv-1",
      flowId: "flow-1",
    });
  });

  it("resets the selection when entering a different flow version's scope", () => {
    const initial = reducer(
      undefined,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    const selected = reducer(initial, selectArtifact("a".repeat(64)));
    expect(selected.selectedArtifactHash).toBe("a".repeat(64));

    const nextScope = reducer(
      selected,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-2",
        flowId: "flow-2",
      }),
    );
    expect(nextScope).toEqual({
      ...BASE_STATE,
      flowVersionId: "fv-2",
      flowId: "flow-2",
    });
  });

  it("keeps an existing selection when re-entering the same flow version's scope", () => {
    const initial = reducer(
      undefined,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    const selected = reducer(initial, selectArtifact("a".repeat(64)));

    const sameScope = reducer(
      selected,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    expect(sameScope.selectedArtifactHash).toBe("a".repeat(64));
  });

  it("selectArtifact sets the selected artifact hash", () => {
    const state = reducer(undefined, selectArtifact("a".repeat(64)));
    expect(state.selectedArtifactHash).toBe("a".repeat(64));
  });

  it("selectArtifact can be called again to freely switch artifacts", () => {
    const first = reducer(undefined, selectArtifact("a".repeat(64)));
    const second = reducer(first, selectArtifact("b".repeat(64)));
    expect(second.selectedArtifactHash).toBe("b".repeat(64));
  });

  it("selectFlowVersionArtifactsState returns the empty default when the flowVersionId doesn't match the active scope", () => {
    const active = reducer(
      undefined,
      enterFlowVersionArtifactsScope({
        flowVersionId: "fv-1",
        flowId: "flow-1",
      }),
    );
    expect(
      selectFlowVersionArtifactsState(stateFor(active), "fv-other"),
    ).toEqual(BASE_STATE);
    expect(selectFlowVersionArtifactsState(stateFor(active), "fv-1")).toBe(
      active,
    );
  });

  it("startEditingArtifactMetadata seeds the draft and enters edit mode", () => {
    const state = reducer(
      undefined,
      startEditingArtifactMetadata({
        label: "my label",
        share: true,
        curatedParamNames: ["input"],
      }),
    );
    expect(state.draft).toEqual({
      label: "my label",
      share: true,
      curatedParamNames: ["input"],
    });
    expect(state.isEditing).toBe(true);
  });

  it("updateDraftLabel and setDraftShare update the draft in place", () => {
    const editing = reducer(
      undefined,
      startEditingArtifactMetadata({
        label: "old",
        share: false,
        curatedParamNames: [],
      }),
    );
    const labeled = reducer(editing, updateDraftLabel("new"));
    expect(labeled.draft?.label).toBe("new");

    const shared = reducer(labeled, setDraftShare(true));
    expect(shared.draft?.share).toBe(true);
  });

  it("updateDraftLabel and setDraftShare are no-ops when there is no draft", () => {
    const state = reducer(undefined, updateDraftLabel("new"));
    expect(state.draft).toBeNull();
  });

  it("toggleDraftParam adds and removes a param name", () => {
    const editing = reducer(
      undefined,
      startEditingArtifactMetadata({
        label: "",
        share: false,
        curatedParamNames: [],
      }),
    );
    const added = reducer(
      editing,
      toggleDraftParam({ paramName: "input", checked: true }),
    );
    expect(added.draft?.curatedParamNames).toEqual(["input"]);

    const removed = reducer(
      added,
      toggleDraftParam({ paramName: "input", checked: false }),
    );
    expect(removed.draft?.curatedParamNames).toEqual([]);
  });

  it("artifactMetadataSaved exits edit mode but keeps the draft as the display override", () => {
    const editing = reducer(
      undefined,
      startEditingArtifactMetadata({
        label: "new label",
        share: false,
        curatedParamNames: [],
      }),
    );
    const saved = reducer(editing, artifactMetadataSaved());
    expect(saved.isEditing).toBe(false);
    expect(saved.draft).toEqual({
      label: "new label",
      share: false,
      curatedParamNames: [],
    });
  });

  it("cancelEditingArtifactMetadata exits edit mode and discards the draft", () => {
    const editing = reducer(
      undefined,
      startEditingArtifactMetadata({
        label: "old",
        share: false,
        curatedParamNames: [],
      }),
    );
    const cancelled = reducer(editing, cancelEditingArtifactMetadata());
    expect(cancelled.isEditing).toBe(false);
    expect(cancelled.draft).toBeNull();
  });

  it("selectArtifact resets any leftover draft/isEditing from the previous selection", () => {
    const editing = reducer(
      undefined,
      startEditingArtifactMetadata({
        label: "old",
        share: false,
        curatedParamNames: [],
      }),
    );
    const saved = reducer(editing, artifactMetadataSaved());
    expect(saved.draft).not.toBeNull();

    const switched = reducer(saved, selectArtifact("b".repeat(64)));
    expect(switched.selectedArtifactHash).toBe("b".repeat(64));
    expect(switched.draft).toBeNull();
    expect(switched.isEditing).toBe(false);
  });

  it("startAuthoringArtifact enters authoring mode with a fresh draft", () => {
    const state = reducer(undefined, startAuthoringArtifact());
    expect(state.mode).toBe("authoring");
    expect(state.authoringDraft).toEqual({
      label: "",
      share: false,
      curatedParamNames: [],
      file: null,
    });
  });

  it("startAuthoringArtifact is a no-op while editing metadata", () => {
    const editing = reducer(
      undefined,
      startEditingArtifactMetadata({
        label: "",
        share: false,
        curatedParamNames: [],
      }),
    );
    const state = reducer(editing, startAuthoringArtifact());
    expect(state.mode).toBe("browsing");
    expect(state.authoringDraft).toBeNull();
  });

  it("startEditingArtifactMetadata is a no-op while authoring", () => {
    const authoring = reducer(undefined, startAuthoringArtifact());
    const state = reducer(
      authoring,
      startEditingArtifactMetadata({
        label: "",
        share: false,
        curatedParamNames: [],
      }),
    );
    expect(state.isEditing).toBe(false);
    expect(state.draft).toBeNull();
    expect(state.mode).toBe("authoring");
  });

  it("cancelAuthoringArtifact and artifactAuthored both return to browsing with no draft", () => {
    const authoring = reducer(undefined, startAuthoringArtifact());

    const cancelled = reducer(authoring, cancelAuthoringArtifact());
    expect(cancelled.mode).toBe("browsing");
    expect(cancelled.authoringDraft).toBeNull();

    const authored = reducer(authoring, artifactAuthored());
    expect(authored.mode).toBe("browsing");
    expect(authored.authoringDraft).toBeNull();
  });

  it("updateAuthoringLabel, setAuthoringShare, and toggleAuthoringParam update the authoring draft in place", () => {
    const authoring = reducer(undefined, startAuthoringArtifact());

    const labeled = reducer(authoring, updateAuthoringLabel("new label"));
    expect(labeled.authoringDraft?.label).toBe("new label");

    const shared = reducer(labeled, setAuthoringShare(true));
    expect(shared.authoringDraft?.share).toBe(true);

    const added = reducer(
      shared,
      toggleAuthoringParam({ paramName: "input", checked: true }),
    );
    expect(added.authoringDraft?.curatedParamNames).toEqual(["input"]);

    const removed = reducer(
      added,
      toggleAuthoringParam({ paramName: "input", checked: false }),
    );
    expect(removed.authoringDraft?.curatedParamNames).toEqual([]);
  });

  it("updateAuthoringLabel, setAuthoringShare, and toggleAuthoringParam are no-ops when there is no authoring draft", () => {
    const state = reducer(undefined, updateAuthoringLabel("new"));
    expect(state.authoringDraft).toBeNull();
  });

  it("setAuthoringFile sets the file breadcrumb and always clears curatedParamNames", () => {
    const authoring = reducer(undefined, startAuthoringArtifact());
    const withParam = reducer(
      authoring,
      toggleAuthoringParam({ paramName: "input", checked: true }),
    );
    expect(withParam.authoringDraft?.curatedParamNames).toEqual(["input"]);

    const withFile = reducer(
      withParam,
      setAuthoringFile({
        name: "notes.md",
        size: 42,
        contentType: "text/markdown",
        format: "markdown",
      }),
    );
    expect(withFile.authoringDraft?.file).toEqual({
      name: "notes.md",
      size: 42,
      contentType: "text/markdown",
      format: "markdown",
    });
    expect(withFile.authoringDraft?.curatedParamNames).toEqual([]);

    const rePicked = reducer(
      reducer(
        withFile,
        toggleAuthoringParam({ paramName: "input", checked: true }),
      ),
      setAuthoringFile({
        name: "other.json",
        size: 1,
        contentType: "application/json",
        format: "json",
      }),
    );
    expect(rePicked.authoringDraft?.curatedParamNames).toEqual([]);

    const cleared = reducer(rePicked, setAuthoringFile(null));
    expect(cleared.authoringDraft?.file).toBeNull();
    expect(cleared.authoringDraft?.curatedParamNames).toEqual([]);
  });

  it("selectArtifact resets authoring mode/draft too", () => {
    const authoring = reducer(undefined, startAuthoringArtifact());
    const switched = reducer(authoring, selectArtifact("b".repeat(64)));
    expect(switched.mode).toBe("browsing");
    expect(switched.authoringDraft).toBeNull();
  });
});
