/**
 *
 *
 *
 * Create a config / spec for runs.  These are user supplied args that affect
 * runs.  different than a run plan.
 *
 * so for args like:
 *
 * {
 *  llm-template: 1235351283051928752398 // hash
 * }
 *
 * so eventually eventually a runspec will be like:
 * run spec
 * {
 *    flowDefHash: string;
 *    simSpecHash?: string;
 *    runInput: {
 *        prompt: "long literal string",
 *        promptSaved: {{artifacts:12353102951240985723049875}}
 *        promptSaved2: {{artifacts:Whatever the Name is.txt}}
 *    }
 * }
 *
 * RunInputs {
 * }
 *
 * then in step definition:
 *
 *
 * llm: {
 *  type: "httpjson",
 *  args: {
 *    template: {{inputs.llm-template}}
 *  }
 * }
 *
 *
 * inputs: {
 *  llm-template: hash,
 *  counter: string,
 *  total: number,
 * }
 *
 *
 * i make a prompt file
 * my prompt whatever
 *
 * artifact label / index
 *
 * prompt label /index
 *
 * {
 *  label: string;
 *  filename: string;
 *  hash: string;
 *  id: string;
 * }
 *
 *
 *
 * simplest mvp:
 *
 * somehow add a runParamsIndex or runParams that is an artifact with hashes
 *
 * looks like:
 *
 * {
 *    prompt: hash,
 *    apiPrompt: hash,
 * }
 *
 * add a way to add artifacts to the system through file upload
 *
 * prompt.md
 * upload through file upload or json.
 *
 * get those hashes, create a runParamsIndex or whatever.
 *
 * worker gets runParamsIndex hash, opens it.
 *
 * then files the key, opens that hash.
 *
 * then traverses that if its necessary and a json object.
 *
 *
 * problem:  ArtifactStore is currently json, not md.
 */
