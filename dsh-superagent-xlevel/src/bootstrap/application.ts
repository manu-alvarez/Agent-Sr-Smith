import { createContainer, type AppContainer } from "./container.ts";
import { health, type HealthReport } from "./health.ts";
import { runObjective } from "../orchestration/orchestrator/index.ts";
import type { ExecutionReport, RunInput } from "../core/domain/index.ts";

export interface Application {
  container: AppContainer;
  health(): HealthReport;
  run(input: RunInput): ExecutionReport;
}

export function createApplication(env?: Record<string, string | undefined>): Application {
  const container = createContainer(env);
  return {
    container,
    health: () => health(container),
    run(input) {
      return runObjective({
        profileId: input.profileId ?? container.config.profileId,
        mode: input.mode ?? container.config.mode,
        objective: input.objective,
        projectId: input.projectId,
        approvals: input.approvals,
      });
    },
  };
}
