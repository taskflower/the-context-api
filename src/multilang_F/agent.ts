import s from "dedent";
import { z } from "zod";
import {
  assistant,
  getSteps,
  Message,
  system,
  toolCalls,
  user,
} from "./messages";
import { Provider } from "./models";
import { finish, WorkflowState } from "./state";
import { Tool } from "./tool";
import { Workflow } from "./workflow";
import { _t } from "./translations/_translations";
import { locale } from "./translations/agent";

export type AgentOptions = Partial<Agent>;

export type AgentName = string;
export type Agent = {
  description?: string;
  tools: {
    [key: AgentName]: Tool;
  };
  provider?: Provider;
  run: (
    provider: Provider,
    state: WorkflowState,
    context: Message[],
    workflow: Workflow
  ) => Promise<WorkflowState>;
};

export const agent = (options: AgentOptions = {}): Agent => {
  const { description, tools = {}, provider } = options;

  return {
    description,
    tools,
    provider,
    run:
      options.run ??
      (async (provider, state, context, workflow) => {
        const [, ...messages] = context;

        const response = await provider.chat({
          messages: [
            system(
              _t(
                `${description}\n\nYour job is to complete the assigned task:\n- You can break down complex tasks into multiple steps if needed.\n- You can use available tools if needed.\n\nTry to complete the task on your own.`,
                locale
              )
            ),
            assistant(_t("What have been done so far?", locale)),
            user(
              _t("Here is all the work done so far by other agents:", locale)
            ),
            ...getSteps(messages),
            assistant(_t("Is there anything else I need to know?", locale)),
            workflow.knowledge
              ? user(
                  _t(
                    "Here is all the knowledge available: ${knowledge}",
                    locale,
                    {
                      knowledge: workflow.knowledge,
                    }
                  )
                )
              : user(
                  _t("No, I do not have any additional information.", locale)
                ),
            assistant(_t("What is the request?", locale)),
            ...state.messages,
          ],
          tools,
          response_format: {
            step: z.object({
              name: z
                .string()
                .describe(
                  _t(
                    "Name of the current step or action being performed",
                    locale
                  )
                ),
              result: z
                .string()
                .describe(
                  _t(
                    "The output of this step. Include all relevant details and information.",
                    locale
                  )
                ),
              reasoning: z
                .string()
                .describe(
                  _t("The reasoning for performing this step.", locale)
                ),
              next_step: z
                .string()
                .describe(
                  _t(
                    `The next step ONLY if required by the original request.\nReturn empty string if you have fully answered the current request, even if you can think of additional tasks.`,
                    locale
                  )
                ),
              has_next_step: z
                .boolean()
                .describe(
                  _t("True if you provided next_step. False otherwise.", locale)
                ),
            }),
            error: z.object({
              reasoning: z
                .string()
                .describe(
                  _t("The reason why you cannot complete the task", locale)
                ),
            }),
          },
        });

        if (response.type === "tool_call") {
          return {
            ...state,
            status: "paused",
            messages: [...state.messages, toolCalls(response.value)],
          };
        }

        if (response.type === "error") {
          throw new Error(response.value.reasoning);
        }

        const agentResponse = assistant(response.value.result);

        if (response.value.has_next_step) {
          return {
            ...state,
            status: "running",
            messages: [
              ...state.messages,
              agentResponse,
              user(response.value.next_step),
            ],
          };
        }

        return finish(state, agentResponse);
      }),
  };
};
