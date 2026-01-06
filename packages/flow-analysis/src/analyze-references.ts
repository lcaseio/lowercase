import type { FlowDefinition } from "@lcase/types";
import type { FlowAnalysis } from "./flow-analysis.types.js";

// find the references / interpolated strings
// parse them.  see if they even parse correctly as a valid shape.
// see if they begin with a valid prefix
// -> store the path pieces, typed nicely

// if so add it to the valid list to check for references
//

// looks through and finds references
// then tries to parse them, and gets a parsed result

export function analyzeReferences(flowDef: FlowDefinition, fa: FlowAnalysis) {}

export function parseReference() {}
