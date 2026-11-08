import type { Task } from "../../core/domain/index.ts";
import type { ProfileDefinition } from "../../agents/profiles/index.ts";
import { roleByName } from "../../agents/specialists/index.ts";

export interface RouteDecision {
  taskId: string;
  role: string;
  accepted: boolean;
  reason: string;
}

export function routeTask(task: Task, profile: ProfileDefinition): RouteDecision {
  const role = task.assignedRole ?? "planner";
  if (!profile.roles.includes(role) && role !== "planner" && role !== "evaluator") {
    return {
      taskId: task.id,
      role,
      accepted: false,
      reason: `El perfil ${profile.id} no incluye el rol ${role}.`,
    };
  }
  try {
    roleByName(role);
  } catch {
    return { taskId: task.id, role, accepted: false, reason: `Rol desconocido ${role}.` };
  }
  return { taskId: task.id, role, accepted: true, reason: `Enrutado a ${role}.` };
}
