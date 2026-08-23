// Describes streaming a step's output directly to another step (payload
// piped step-to-step, rather than via CAS export/ref resolution). Scaffolded,
// never wired into any real step type -- kept as a comment, not deleted,
// since the design intent is real even though it's not built.
//
// export type PipeFields = {
//   to?: {
//     step: string;
//     payload: string;
//   };
//   from?: {
//     step: string;
//     buffer?: number;
//   };
// };
