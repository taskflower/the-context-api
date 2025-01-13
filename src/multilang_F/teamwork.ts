import { iterate } from "./iterate";
import { rootState } from "./state";
import { WorkflowState } from "./state";
import { Workflow } from "./workflow";

/**
 * Teamwork runs given workflow and continues iterating over the workflow until it finishes.
 * If you handle running tools manually, you can set runTools to false.
 */
export async function teamwork(
  workflow: Workflow,
  state: WorkflowState = rootState(workflow),
  runTools: boolean = true
): Promise<WorkflowState> {
  if (state.status === "finished") {
    return state;
  }
  if (runTools === false && hasPausedStatus(state)) {
    return state;
  }
  return teamwork(workflow, await iterate(workflow, state), runTools);
}

/**
 * Recursively checks if any state or nested state has a 'paused' status
 */
export const hasPausedStatus = (state: WorkflowState): boolean => {
  if (state.status === "paused") {
    return true;
  }
  return state.children.some(hasPausedStatus);
};
