import { Moment } from "moment";
import { TodoistTask } from "todoist-rest-api";
import { Request } from "firebase-functions";
import { Response } from "express";
import { currentMoment, getLabelIdsToSkip, todoistApi } from "./utils";

export abstract class BaseRescheduler {
  abstract getRescheduleTime({
    task,
    now,
  }: {
    task: TodoistTask;
    now: Moment;
  }): Promise<Moment | undefined>;

  async reschedule(request: Request, response: Response): Promise<void> {
    if (request.query["authKey"] !== process.env.AUTH_KEY) {
      response.sendStatus(403);
      return;
    }

    const allTasks = await todoistApi.v1.task.findAll();
    const labelsToSkip = await getLabelIdsToSkip(todoistApi);
    const now = currentMoment();

    const rescheduledTasks = await Promise.all(
      allTasks.map((task) => this.rescheduleTask(task, labelsToSkip, now))
    );

    const numComplete = rescheduledTasks.filter((success) => success).length;

    console.log(`Updated ${numComplete} tasks`);
    response.send(`Updated ${numComplete} tasks`);
  }

  private async rescheduleTask(
    task: TodoistTask,
    labelsToSkip: Set<number>,
    now: Moment
  ): Promise<boolean> {
    // If the task doesn't have a date, it can't be rescheduled.
    if (!task.due || !task.due.date) {
      return false;
    }

    // If the task has an ignore label, it shouldn't be rescheduled.
    if (task.label_ids.some((label) => labelsToSkip.has(label))) {
      return false;
    }

    // Check with the child.
    const rescheduleTime = await this.getRescheduleTime({ task, now });
    if (!rescheduleTime) {
      return false;
    }

    const formattedRescheduleDate = rescheduleTime.format("YYYY-MM-DD");
    console.log(`Rescheduling ${task.content} for ${formattedRescheduleDate}`);

    try {
      // @ts-ignore
      const result = await todoistApi.v1.task.update(task.id, {
        due_date: formattedRescheduleDate,
      });
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
