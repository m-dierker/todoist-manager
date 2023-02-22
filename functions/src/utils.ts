import { TodoistApi, Label } from "@doist/todoist-api-typescript";
import { Moment } from "moment-timezone";
import moment = require("moment-timezone");

export const todoistApi = new TodoistApi(process.env.TODOIST_API_KEY!);

export function currentMoment(): Moment {
  return moment().tz(process.env.TIMEZONE!);
}

/** Returns a set of lowercase label names that shouldn't be touched by anything. */
export async function getLowerLabelNamesToSkip(): Promise<Set<string>> {
  if (!process.env.IGNORE_LABELS) {
    console.error("No labels to ignore found");
    return new Set();
  }
  return new Set(
    process.env.IGNORE_LABELS.split(",").map((label) =>
      label.trim().toLowerCase()
    )
  );
}
