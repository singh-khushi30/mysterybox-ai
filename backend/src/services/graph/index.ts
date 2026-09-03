export { detectContradiction } from "./contradiction.js";
export { listSessionContradictions, saveContradiction } from "./persist.js";
export { nextValidationRoute, validateSuspectReply } from "./validate.js";
export { listInterrogationMessages, runInterrogationGraph } from "./workflow.js";
export { MAX_REPAIR_ATTEMPTS, SAFE_FALLBACK } from "./types.js";
export type {
  ContradictionHit,
  InterrogationGraphInput,
  InterrogationMessage,
  PublicFact,
  ValidationResult,
} from "./types.js";
