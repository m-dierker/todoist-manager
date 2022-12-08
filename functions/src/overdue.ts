import moment = require("moment-timezone");
import { BaseRescheduler } from "./rescheduler";
import { Task } from "@doist/todoist-api-typescript";

/** Reschedules tasks that were scheduled for the previous day. */
export class OverdueTaskRescheduler extends BaseRescheduler {
  async getRescheduleTime({
    task,
    now,
  }: {
    task: Task;
    now: moment.Moment;
  }): Promise<moment.Moment | undefined> {
    const startOfCurrentDay = now.startOf("day");
    console.log(task.content, task.due);
    let taskDueDate;
    if (task.due?.datetime) {
      // This has to be done manually since times are stored in UTC,
      // so a task due late in the day might be due "tomorrow" in UTC.
      // Both due.date and due.datetime are in UTC.
      taskDueDate = moment.tz(task.due.datetime, process.env.TIMEZONE!);
    } else {
      taskDueDate = moment
        .tz(task.due!.date, process.env.TIMEZONE!)
        .startOf("day");
    }
    // If a task isn't due yet, no adjustment is needed.
    if (!taskDueDate.isBefore(startOfCurrentDay)) {
      return undefined;
    }

    // If datetime is set, the task has a specific due time.
    // Adjust the day while keeping that time.
    if (task.due?.datetime) {
      const taskDatetime = moment.tz(task.due.datetime, process.env.TIMEZONE!);
      const todaySameTime = moment(startOfCurrentDay)
        .hour(taskDatetime.hour())
        .minute(taskDatetime.minute())
        .second(taskDatetime.second());
      console.log("todaySameTime", todaySameTime);
      return todaySameTime;
    }
    return taskDueDate.isBefore(startOfCurrentDay)
      ? startOfCurrentDay
      : undefined;
  }
}
