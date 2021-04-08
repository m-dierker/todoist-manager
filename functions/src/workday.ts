import { Moment } from "moment-timezone";
import moment = require("moment-timezone");
import todoist, { TodoistTask } from "todoist-rest-api";
import { TodoistProject } from "todoist-rest-api/dist";
import { Request } from "firebase-functions";
import { Response } from "express";
import { currentMoment, getLabelIdsToSkip, todoistApi } from "./utils";
import { BaseRescheduler } from "./rescheduler";

export class WorkdayTaskRescheduler extends BaseRescheduler {
  /** Cached work project IDs for the life of the rescheduler. */
  private projectIdsToReschedule: Promise<Set<number>>;

  private nextWorkday: Moment;

  constructor() {
    super();
    this.projectIdsToReschedule = getWorkProjectIds();
    this.nextWorkday = getNextWorkday();
  }

  async getRescheduleTime({
    task,
    now,
  }: {
    task: TodoistTask;
    now: Moment;
  }): Promise<Moment | undefined> {
    const taskDueDate = moment
      .tz(task.due!.date, process.env.TIMEZONE!)
      .startOf("day");

    // Tasks already scheduled in the future should not be rescheduled.
    if (taskDueDate.isAfter(now)) {
      return;
    }

    // Filter to just work tasks.
    const projectIdsToReschedule = await this.projectIdsToReschedule;
    if (!projectIdsToReschedule.has(task.project_id)) {
      return;
    }

    return this.nextWorkday;
  }
}

async function getWorkProjectIds(): Promise<Set<number>> {
  if (!process.env.WORK_PROJECTS_TO_RESCHEDULE) {
    console.error("No projects to reschedule found");
    return new Set();
  }
  const lowerProjectNames = new Set(
    process.env.WORK_PROJECTS_TO_RESCHEDULE.split(",").map((project) =>
      project.trim().toLowerCase()
    )
  );
  const projects: TodoistProject[] = await todoistApi.v1.project.findAll({});
  return new Set(
    projects
      .filter((project) =>
        lowerProjectNames.has(project.name.trim().toLowerCase())
      )
      .map((project) => project.id)
  );
}

const ISO_WEEKDAY_MONDAY = 1;
const ISO_WEEKDAY_FRIDAY = 5;

function getNextWorkday(): Moment {
  const now = currentMoment();
  const nextIsoWeekday = now.isoWeekday() + 1;
  if (nextIsoWeekday <= ISO_WEEKDAY_FRIDAY) {
    return now.isoWeekday(nextIsoWeekday);
  } else {
    // On weekends, defer to next Monday.
    return now.add(1, "weeks").isoWeekday(ISO_WEEKDAY_MONDAY);
  }
}
