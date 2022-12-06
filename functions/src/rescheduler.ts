import { Request } from "firebase-functions";
import { Response } from "express";
import { currentMoment, getLabelIdsToSkip, todoistApi } from "./utils";
import moment = require("moment-timezone");
import { Task, UpdateTaskArgs } from "@doist/todoist-api-typescript";

export abstract class BaseRescheduler {
  abstract getRescheduleTime({
    task,
    now,
  }: {
    task: Task;
    now: moment.Moment;
  }): Promise<moment.Moment | undefined>;

  async reschedule(request: Request, response: Response): Promise<void> {
    if (request.query["authKey"] !== process.env.AUTH_KEY) {
      response.sendStatus(403);
      return;
    }

    const allTasks = await todoistApi.getTasks();
    const labelsToSkip = await getLabelIdsToSkip();
    const now = currentMoment();

    const rescheduledTasks = await Promise.all(
      allTasks.map((task) => this.rescheduleTask(task, labelsToSkip, now))
    );

    const numComplete = rescheduledTasks.filter((success) => success).length;

    console.log(`Updated ${numComplete} tasks`);
    response.send(`Updated ${numComplete} tasks`);
  }

  private async rescheduleTask(
    task: Task,
    labelsToSkip: Set<string>,
    now: moment.Moment
  ): Promise<boolean> {
    // If the task doesn't have a date, it can't be rescheduled.
    if (!task.due || !task.due.date) {
      return false;
    }

    // If the task has an ignore label, it shouldn't be rescheduled.
    if (task.labels.some((label) => labelsToSkip.has(label))) {
      return false;
    }

    // Check with the child.
    const rescheduleTime = await this.getRescheduleTime({ task, now });
    if (!rescheduleTime) {
      return false;
    }

    // If this is a datetime (i.e. not midnight), update the datetime instead.
    let updateArg: UpdateTaskArgs;
    if (rescheduleTime.hour() !== 0 || rescheduleTime.minute() !== 0) {
      updateArg = {
        dueDatetime: rescheduleTime.toISOString(),
      };
    } else {
      const formattedRescheduleDate = rescheduleTime.format("YYYY-MM-DD");
      updateArg = { dueDate: formattedRescheduleDate };
    }

    console.log(
      `Rescheduling ${task.content} for ${JSON.stringify(updateArg)}`
    );

    try {
      // @ts-ignore
      const result = await todoistApi.updateTask(task.id, updateArg);
      if (result) {
        return true;
      }
      console.error("Problem updating task", task);
    } catch (error) {
      console.error(`Error encountered updating task ${task.content}`, error);
    }
    return false;
  }
}
