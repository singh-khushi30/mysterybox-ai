import { HttpError } from "../utils/http.js";
import { listInterrogationMessages, runInterrogationGraph } from "./graph/workflow.js";
import { getSession } from "./sessions.js";
import { getSuspect } from "./suspects.js";

export type { InterrogationMessage } from "./graph/types.js";

export { listInterrogationMessages };

export async function interrogateSuspect(input: {
  sessionId: string;
  suspectId: string;
  message: string;
  evidenceId?: string;
  forcedReply?: string;
  userId?: string;
}) {
  const session = await getSession(input.sessionId, input.userId);
  const suspect = await getSuspect(input.suspectId);
  if (suspect.case_id !== session.case_id) {
    throw new HttpError(400, "Suspect does not belong to this case");
  }

  return runInterrogationGraph({
    sessionId: input.sessionId,
    suspectId: input.suspectId,
    message: input.message,
    evidenceId: input.evidenceId,
    forcedReply: input.forcedReply,
    userId: input.userId,
  });
}
