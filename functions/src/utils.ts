import { Moment } from "moment-timezone";
import moment = require("moment-timezone");
import todoist, {
  TodoistLabel,
  TodoistProject,
  TodoistRESTAPI,
} from "todoist-rest-api";

export const todoistApi = todoist(process.env.TODOIST_API_KEY!);

export function currentMoment(): Moment {
  return moment().tz(process.env.TIMEZONE!);
}

/** Returns a set of label IDs that shouldn't be touched by anything. */
export async function getLabelIdsToSkip(): Promise<Set<number>> {
  if (!process.env.IGNORE_LABELS) {
    console.error("No labels to ignore found");
    return new Set();
  }
  const lowerLabelNames = new Set(
    process.env.IGNORE_LABELS.split(",").map((label) =>
      label.trim().toLowerCase()
    )
  );
  const labels: TodoistLabel[] = await todoistApi.v1.label.findAll({});
  return new Set(
    labels
      .filter((label) => lowerLabelNames.has(label.name.trim().toLowerCase()))
      .map((label) => label.id)
  );
}
