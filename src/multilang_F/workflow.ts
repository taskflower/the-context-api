import { Agent } from "./agent";
import { finalBoss } from "./agents/final_boss";
import { resourcePlanner } from "./agents/resource_planner";
import { supervisor } from "./agents/supervisor-l10n";
import { Provider } from "./models";
import { openai } from "./providers/openai";
import { logger, Telemetry } from "./telemetry";


type WorkflowOptions = {
  description: string
  output: string

  team: Team

  knowledge?: string
  provider?: Provider
  maxIterations?: number
  snapshot?: Telemetry
}

export type Team = Record<string, Agent>

const coreTeam = {
  supervisor: supervisor(),
  resourcePlanner: resourcePlanner(),
  finalBoss: finalBoss(),
}

/**
 * Helper utility to create a workflow with defaults.
 */
export const workflow = (options: WorkflowOptions): Workflow => {
  const team = {
    ...coreTeam,
    ...options.team,
  }
  return {
    maxIterations: 50,
    provider: openai(),
    snapshot: logger,
    ...options,
    team,
  }
}

export type Workflow = Required<Omit<WorkflowOptions, 'knowledge'>> & {
  knowledge?: string
}

export const isCoreTeam = (name: string) => Object.keys(coreTeam).includes(name)
