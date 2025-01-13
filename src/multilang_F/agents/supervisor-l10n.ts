import { z } from "zod";

import { agent, AgentOptions } from "../agent";
import { getSteps, system } from "../messages";
import { assistant, user } from "../messages";
import { delegate } from "../state";
import { _t } from "../translations/_translations";
import { locale } from "../translations/supervisor";

export const supervisor = (options?: AgentOptions) => {
  return agent({
    run: async (provider, state) => {
      const [workflowRequest, ...messages] = state.messages;

      const response = await provider.chat({
        messages: [
          system(
            _t(
              `You are a planner that breaks down complex workflows into smaller, actionable steps.
              Your job is to determine the next task that needs to be done based on the <workflow> and what has been completed so far.

              Rules:
              1. Each task should be self-contained and achievable
              2. Tasks should be specific and actionable
              3. Return null when the workflow is complete
              4. Consider dependencies and order of operations
              5. Use context from completed tasks to inform next steps.`,

              locale
            )
          ),
          assistant(_t("What is the request?", locale)),
          workflowRequest,
          ...(messages.length > 0
            ? [
                assistant(_t("What has been completed so far?", locale)),
                ...getSteps(messages),
              ]
            : []),
        ],
        temperature: 0.2,
        response_format: {
          next_task: z.object({
            task: z.string().describe(
              _t(
                "The next task to be completed, or empty string if workflow is complete",

                locale
              )
            ),
            reasoning: z.string().describe(
              _t(
                "The reasoning for selecting the next task or why the workflow is complete",

                locale
              )
            ),
          }),
        },
      });

      try {
        if (!response.value.task) {
          return {
            ...state,
            status: "finished",
          };
        }
        return delegate(state, [
          ["resourcePlanner", user(response.value.task)],
        ]);
      } catch (error) {
        throw new Error("Failed to determine next task");
      }
    },
    ...options,
  });
};
