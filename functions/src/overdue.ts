import moment = require("moment-timezone");
import { BaseRescheduler } from "./rescheduler";
import { TodoistTask } from "todoist-rest-api";
import { Moment } from "moment";

/** Reschedules tasks that were scheduled for the previous day. */
export class OverdueTaskRescheduler extends BaseRescheduler {
  async getRescheduleTime({
    task,
    now,
  }: {
    task: TodoistTask;
    now: Moment;
  }): Promise<Moment | undefined> {
    const startOfCurrentDay = now.startOf("day");
    const taskDueDate = moment
      .tz(task.due!.date, process.env.TIMEZONE!)
      .startOf("day");
    return taskDueDate.isBefore(startOfCurrentDay)
      ? startOfCurrentDay
      : undefined;
  }
}
