Yes — this is exactly the right shape for your engine.

The key idea: **an eval system is not just “run a benchmark batch.”** A proper eval system has several separable layers:

1. **What are you evaluating?**
   A final answer, a step output, a whole trace, a tool call, a retrieval result, a simulation branch, a prompt version, or a whole workflow version.

2. **How are you scoring it?**
   Exact match, schema validation, code assertion, reference/golden answer, similarity, LLM-as-judge, pairwise preference, human review, safety check, cost/latency metric, etc.

3. **How are scores stored?**
   Per run, per step, per evaluator, per metric, per experiment.

4. **How are scores aggregated?**
   Pass rate, average score, grouped by scenario, compared across versions, plotted over time, regression-tested.

5. **How are results used?**
   Debug one trace, compare two runs, compare two flow versions, detect regressions, optimize prompts, or build reports.

That maps very naturally onto what you are building.

## The main eval families

### 1. Deterministic / rule-based evals

These are the simplest and often the most important.

Examples:

- Did the output parse as JSON?
- Did it match a Zod schema?
- Did it include required fields?
- Did it call the expected tool?
- Did the workflow complete without errors?
- Did a step produce an artifact?
- Did a value fall within an allowed range?
- Did latency stay under a threshold?

This is the eval equivalent of unit testing. OpenAI’s grader docs list simple grader types like string checks, text similarity, model graders, and Python code execution; the important conceptual point is that deterministic graders return clear, repeatable scores, often `0` or `1`. ([OpenAI Developers][1])

For your workflow engine, this should absolutely be part of v1.

Example score:

```ts
{
  evaluatorType: "schema_check",
  metric: "valid_json",
  score: 1,
  passed: true
}
```

These are not “less real” than LLM evals. They are often the most trustworthy.

---

### 2. Golden-answer / reference evals

These compare a model or workflow output against a known expected answer.

Examples:

- Classification: expected label is `"rainy"`; model says `"rainy"` → pass.
- QA: expected answer includes “Paris”; model says “Paris” → pass.
- Extraction: expected JSON field equals known value.
- Summarization: compare against a reference summary.

Typical metrics:

- accuracy
- exact match
- precision / recall / F1
- edit distance
- BLEU / ROUGE / METEOR
- embedding cosine similarity
- semantic similarity

OpenAI’s eval guide describes the common pattern: define the task, run test inputs, compare model outputs against criteria or ground truth, then analyze and iterate. It also shows test data containing inputs plus ground-truth labels. ([OpenAI Developers][2])

This is the traditional “proper eval” shape people think of first, but it requires a dataset. For your current project, you do **not** need this first unless you already have clean examples.

Good for:

- classification
- extraction
- routing
- tool selection
- factual QA with known answers
- regression tests

Weak for:

- open-ended writing
- creative output
- multi-step agent behavior
- subjective quality

---

### 3. Rubric-based LLM-as-judge evals

This is where a separate model scores the workflow output according to a rubric.

Example rubric dimensions:

- correctness
- completeness
- faithfulness to provided data
- helpfulness
- clarity
- instruction following
- unnecessary speculation
- safety / policy compliance
- formatting quality

This is probably the best v1 “AI eval” for your system because you can run it as a normal workflow step. OpenAI’s current grader docs describe “score model” graders as model-based graders that return a numeric score within a configured range. ([OpenAI Developers][1])

A v1 judge output could be:

```ts
{
  "overall": 0.82,
  "passed": true,
  "dimensions": {
    "correctness": 0.8,
    "faithfulness": 0.9,
    "completeness": 0.7,
    "format": 1.0
  },
  "failureModes": ["minor_omission"],
  "rationale": "The answer used the weather data correctly but omitted wind information."
}
```

This fits your engine beautifully because the judge can consume:

- run params
- step exports
- final output
- trace summary
- selected artifacts
- simulation metadata
- mock/sim branch information

LLM-as-judge is especially useful for open-ended outputs, but it has known failure modes. The MT-Bench / Chatbot Arena paper found strong LLM judges can approximate human preference well, but also discusses position bias, verbosity bias, self-enhancement bias, and limited reasoning ability. ([arXiv][3])

So: use it, but do not worship it. Store its raw rationale, model version, prompt version, and rubric version.

---

### 4. Pairwise / preference evals

Instead of asking “what score did output A get?”, you ask:

> Which is better: output A or output B?

This is useful when absolute scores are hard but relative comparison is easier.

Examples:

- Prompt v1 vs prompt v2
- Model A vs model B
- Flow version A vs flow version B
- With retrieval vs without retrieval
- Real tool result vs mocked result
- Original run vs simulation branch

Chatbot Arena popularized large-scale pairwise human preference evaluation for LLMs, using pairwise comparisons and statistical ranking methods. ([arXiv][4]) LangSmith also supports pairwise evaluation for comparing experiment outputs. ([Docs by LangChain][5])

For your system, pairwise evals are probably **long-term gold**, because your simulation/forking/mocking system naturally creates comparable run branches.

Example:

```ts
{
  evaluatorType: "pairwise_llm_judge",
  baselineRunId: "run_a",
  candidateRunId: "run_b",
  winner: "candidate",
  preferenceScore: 0.71,
  reasons: ["more grounded", "better structured", "less vague"]
}
```

This is not necessary for v1, but it should influence your data model early.

---

### 5. Trace / process evals

This is the one that matters most for your workflow engine as a workflow engine.

Instead of only asking whether the final answer was good, you ask whether the **process** was good:

- Did the right steps execute?
- Did the flow call the weather API before summarizing?
- Did the LLM use the tool result rather than inventing data?
- Did the router choose the correct branch?
- Did a retry happen?
- Did a guardrail stop something?
- Did the trace contain an avoidable error?
- Did the workflow spend too many tokens?
- Did it make unnecessary tool calls?

OpenAI’s agent eval docs explicitly call out trace grading for workflow-level issues: traces capture model calls, tool calls, guardrails, and handoffs, and graders can score those traces for regressions and failure modes. ([OpenAI Developers][6])

This is where your system has a real architectural advantage. You already have events, run indexes, step outputs, exports, artifacts, and trace-like history. That means you can evaluate not only “what came out,” but “how it happened.”

For your engine, this might become more distinctive than generic LLM output scoring.

---

### 6. RAG / retrieval evals

This matters if you later add retrieval, memory, file search, vector search, or context assembly.

Common metrics:

- context precision: were retrieved chunks relevant?
- context recall: did retrieval include needed evidence?
- answer faithfulness: is the answer supported by retrieved context?
- answer relevance: does the answer address the user’s question?
- citation correctness
- hallucination / unsupported claim rate

Ragas is one common framework in this space; its docs describe metrics such as context precision, including versions that compare retrieved contexts against either a reference answer or generated response. ([Ragas][7])

You probably do not need RAG evals in v1 unless your demo flow includes retrieval. But the abstraction should support them later.

---

### 7. Human review / annotation evals

Human evaluation is still the best signal for subjective product quality.

Examples:

- “Was this answer useful?”
- “Would you ship this?”
- “Which output do you prefer?”
- “Was the tool use appropriate?”
- “Was the failure acceptable?”

LangSmith treats human review, code rules, LLM-as-judge, and pairwise comparison as different evaluator types inside an evaluation workflow. ([Docs by LangChain][8])

For your system, human review can be simple at first:

```ts
{
  evaluatorType: "human",
  score: 4,
  scale: [1, 5],
  label: "good",
  notes: "Accurate but too verbose."
}
```

Long term, your UI could let you inspect a run and manually attach feedback to a step or final output.

---

### 8. Online / production evals

Offline evals run against curated datasets before shipping. Online evals score real runs after deployment, often without reference answers. LangSmith makes this distinction explicitly: offline evals use datasets/examples, while online evals run on production traces where reference outputs may not exist. ([Docs by LangChain][9])

Your engine can support both:

- **offline**: run 50 test cases against flow version A and B
- **online/live**: every actual run emits eval events, maybe sampled
- **debug**: manually evaluate a single trace
- **simulation**: evaluate forked runs against originals

This is why your instinct is right: evals can be part of your system, not just a separate batch tool.

## The levels of evals in your engine

I would think of your system as having five eval levels.

### Level 1: Step eval

Evaluate one step’s output.

Examples:

- LLM step produced valid JSON.
- Weather API step returned required fields.
- Template interpolation succeeded.
- Markdown export exists.
- Tool call arguments matched schema.

This is very v1-friendly.

---

### Level 2: Run eval

Evaluate the whole run’s final result.

Examples:

- Final answer was useful.
- Final answer used the weather data.
- No hallucinated weather values.
- Output followed requested format.

This is also v1-friendly.

---

### Level 3: Trace/process eval

Evaluate the execution path.

Examples:

- Correct branch was selected.
- Required steps happened in order.
- Retry logic worked.
- No unnecessary tool calls.
- Mocked step was correctly reused.
- Simulated branch differs only where expected.

This is where your event-driven observability becomes powerful.

---

### Level 4: Experiment eval

Evaluate a group of runs.

Examples:

- Prompt v2 improved faithfulness by 12%.
- Local LLM judge gives lower completeness than remote judge.
- Flow version B has fewer schema failures.
- Mocked API responses expose a failure mode.
- Temperature increase improved creativity but hurt factuality.

This is the batch runner / charts layer.

---

### Level 5: Regression / release gate

Evaluate whether a change is safe to merge or demo.

Examples:

- Must pass all schema checks.
- Must maintain average judge score above 0.75.
- Must not regress by more than 5% from baseline.
- Must not introduce new failure mode tags.
- Must pass smoke dataset.

This is later, but it is where evals become engineering infrastructure.

## Standard scoring shapes

You do not need one universal score shape. You need a common envelope that can hold different score types.

The major score types are:

```ts
type ScoreKind =
  | "boolean" // pass/fail
  | "numeric" // 0..1, 1..5, etc.
  | "categorical" // good / bad / partial
  | "multi_metric" // correctness, faithfulness, format, etc.
  | "pairwise" // A wins, B wins, tie
  | "ranking" // ordered candidates
  | "diagnostic"; // failure tags, notes, explanations
```

Most eval platforms end up combining these. HELM is a good example of why multi-metric evaluation matters: it evaluates across multiple scenarios and desiderata such as accuracy, calibration, robustness, fairness, bias, toxicity, and efficiency rather than relying on one number. ([arXiv][10])

For your engine, I would avoid designing around a single `score: number` field. Use a flexible result envelope.

Something like:

```ts
type EvalResult = {
  evalResultId: string;
  evalRunId: string;

  target: {
    runId: string;
    stepId?: string;
    artifactId?: string;
    exportName?: string;
  };

  evaluator: {
    evaluatorId: string;
    evaluatorType: string;
    evaluatorVersion: string;
    rubricVersion?: string;
    model?: string;
  };

  metric: {
    name: string;
    dimension?: string;
    scoreKind:
      | "boolean"
      | "numeric"
      | "categorical"
      | "pairwise"
      | "diagnostic";
    score?: number;
    passed?: boolean;
    label?: string;
    threshold?: number;
  };

  diagnostics?: {
    rationale?: string;
    failureModes?: string[];
    evidenceRefs?: string[];
  };

  metadata: {
    flowId: string;
    flowVersion?: string;
    runStartedAt: string;
    createdAt: string;
  };
};
```

That lets you store deterministic checks, LLM judge scores, human ratings, pairwise preferences, and trace diagnostics without redesigning later.

## What I would build for v1

For your actual next milestone, I would keep v1 intentionally small but architecturally correct.

### V1 goal

Build an eval system that can:

1. run a workflow,
2. collect the run output / step exports / trace summary,
3. run one or more evaluators,
4. store structured eval results,
5. aggregate them into a basic experiment view,
6. show a chart or table.

That is enough to tell the story.

### V1 evaluator types

I would implement only three evaluator types at first:

#### 1. Schema / assertion evaluator

For boring correctness.

Examples:

- output is valid JSON
- final answer exists
- required artifact exists
- step status is completed
- field equals expected value
- numeric field is within range

This gives you reliable pass/fail scores.

#### 2. LLM judge evaluator

For open-ended quality.

Use your local LLM first if that is what fits your project. Have it return structured JSON only.

Suggested dimensions:

```json
{
  "correctness": 0.0,
  "faithfulness": 0.0,
  "completeness": 0.0,
  "format": 0.0,
  "overall": 0.0,
  "passed": false,
  "failureModes": [],
  "rationale": ""
}
```

For your weather flow, the judge can ask:

- Did the answer use the provided weather JSON?
- Did it avoid inventing values?
- Was the answer useful?
- Did it mention uncertainty when data was missing?
- Did it follow the requested style?

#### 3. Trace/process evaluator

This is your differentiator.

Examples:

```json
{
  "usedRequiredSteps": true,
  "calledWeatherBeforeFinalLLM": true,
  "reusedMockedStepCorrectly": true,
  "unnecessaryToolCalls": 0,
  "passed": true
}
```

Even a small version of this would make your system feel deeper than a generic eval script.

## V1 data concepts

I would define these core concepts:

```ts
EvalSuite;
```

A named collection of evaluators.

Example: `"weather-answer-quality-v1"`.

```ts
EvalRun;
```

One execution of an eval suite against one or more workflow runs.

Example: “Evaluate 20 weather prompt variants.”

```ts
EvalResult;
```

One evaluator’s score for one target.

Example: “LLM judge scored run 123 faithfulness as 0.9.”

```ts
Experiment;
```

A grouping layer for comparing variants.

Example: “Prompt A vs Prompt B, 10 runs each.”

```ts
DatasetItem;
```

Optional in v1, but useful. Inputs plus optional reference outputs and metadata. LangSmith’s model of datasets/examples/experiments is a useful conceptual reference: examples contain inputs, optional reference outputs, and metadata, while experiments capture outputs, scores, and traces for each example. ([Docs by LangChain][9])

## How this fits your system specifically

Your architecture should probably look like this:

```txt
Business Flow Run
  -> emits events
  -> produces step outputs / exports / artifacts
  -> run index summarizes trace

Eval Flow
  -> consumes runId / stepId / artifact refs / exports
  -> runs deterministic checks
  -> runs LLM judge
  -> optionally runs trace/process checks
  -> emits eval.result.created events
  -> stores eval result rows

Experiment Runner
  -> launches many business runs
  -> optionally varies params/prompts/mocks/sims
  -> attaches eval suite
  -> aggregates results
  -> shows table/charts
```

The important design decision: **do not bake comparison logic into the business flow.** You already said you want the business flow to remain the business process, while experiments compare runs externally. That is exactly right.

So:

- a normal workflow answers the weather question;
- an eval workflow judges the answer;
- an experiment runner orchestrates many runs;
- a report aggregates scores.

That separation is clean.

## Long-term version

Long term, I would aim for this:

### 1. Eval-as-workflow

An evaluator can be implemented as:

- code
- config
- LLM prompt
- another workflow
- human annotation
- external service call

This lets your engine dogfood itself.

### 2. Trace-native scoring

Because you already have event logs and run indexes, you can support evals over:

- final outputs
- intermediate steps
- event sequences
- timing
- retries
- branches
- simulations
- mocks
- artifacts

This is stronger than only evaluating final text.

### 3. Simulation-aware evals

This could become one of the coolest pieces.

Example:

> Freeze steps 1–2 from a previous run, change the final prompt, rerun only the final LLM step, and compare outputs.

Or:

> Mock weather API responses across 20 scenarios and evaluate whether the final answer remains grounded.

This gives you controlled experiments.

### 4. Pairwise comparisons

Once you can generate comparable branches, add pairwise judging:

```txt
baseline run vs candidate run
flow v1 vs flow v2
prompt A vs prompt B
model A vs model B
mock scenario A vs mock scenario B
```

This is often more stable than absolute 1–5 scoring.

### 5. Aggregation and charts

Basic charts should show:

- average score by evaluator
- pass rate by scenario
- score distribution
- failure mode counts
- score over time
- baseline vs candidate deltas
- latency/cost vs quality
- per-step failure heatmap

For v1, one simple table plus one bar chart is enough.

## My recommended v1 implementation plan

I would build it in this order:

### Milestone 1: Eval result storage

Add tables/entities for:

- `eval_suites`
- `eval_runs`
- `eval_results`
- maybe `experiment_runs`

Do not overcomplicate datasets yet.

### Milestone 2: Manual eval of one run

From a completed workflow run, select:

- final output export
- trace summary
- relevant step outputs

Then run:

- one schema evaluator
- one LLM judge evaluator

Store the results.

### Milestone 3: Eval flow

Make the eval itself executable by your engine.

Input:

```json
{
  "targetRunId": "...",
  "targetStepId": "...",
  "exportName": "final_answer"
}
```

Output:

```json
{
  "overall": 0.82,
  "passed": true,
  "dimensions": { ... }
}
```

### Milestone 4: Batch runner

Run the same flow over N parameter sets.

Example:

```txt
weather prompt style = concise
weather prompt style = detailed
weather prompt style = cautious
```

Evaluate each run.

### Milestone 5: Basic report

Show:

- run id
- variant
- overall score
- correctness
- faithfulness
- format
- pass/fail
- latency
- failure modes

Then add one chart.

That would be a complete eval story.

## What I would not do in v1

I would not start with a huge public benchmark.

I would not build a full annotation UI first.

I would not make a complex golden dataset system first.

I would not try to support every metric type immediately.

I would not make evals only batch-based.

I would not make `score` a single universal number.

I would not overfit to OpenAI’s current Evals API shape, especially because OpenAI’s own docs say the older Evals platform is being deprecated, even though the concepts remain useful. ([OpenAI Developers][2])

## The big framing

For your engine, I would define evals like this:

> An eval is a workflow-native measurement process that consumes run data, artifacts, traces, references, or comparison candidates, and emits structured scores, labels, diagnostics, and evidence.

That definition is broad enough to cover:

- unit-style assertions,
- LLM-as-judge,
- golden datasets,
- pairwise comparisons,
- trace grading,
- simulation experiments,
- human review,
- online monitoring.

And it fits what you are already building.

The v1 version can be simple:

> Run a flow, judge the final output and trace with structured evaluators, store scores, and visualize the results.

That is not a toy. That is the foundation of a serious eval platform.

[1]: https://developers.openai.com/api/docs/guides/graders "Graders | OpenAI API"
[2]: https://developers.openai.com/api/docs/guides/evals "Working with evals | OpenAI API"
[3]: https://arxiv.org/abs/2306.05685?utm_source=chatgpt.com "Judging LLM-as-a-Judge with MT-Bench and Chatbot Arena"
[4]: https://arxiv.org/abs/2403.04132?utm_source=chatgpt.com "Chatbot Arena: An Open Platform for Evaluating LLMs by Human Preference"
[5]: https://docs.langchain.com/langsmith/evaluate-pairwise?utm_source=chatgpt.com "How to run a pairwise evaluation"
[6]: https://developers.openai.com/api/docs/guides/agent-evals "Evaluate agent workflows | OpenAI API"
[7]: https://docs.ragas.io/en/stable/concepts/metrics/available_metrics/context_precision/ "Context Precision - Ragas"
[8]: https://docs.langchain.com/langsmith/evaluation "LangSmith Evaluation - Docs by LangChain"
[9]: https://docs.langchain.com/langsmith/evaluation-concepts "Evaluation concepts - Docs by LangChain"
[10]: https://arxiv.org/abs/2211.09110?utm_source=chatgpt.com "Holistic Evaluation of Language Models"
