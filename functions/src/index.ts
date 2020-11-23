// @ts-ignore
require("dotenv").config();
import * as functions from "firebase-functions";
import { Moment } from "moment-timezone";
import moment = require("moment-timezone");
import todoist from "todoist-rest-api";
import { TodoistProject } from "todoist-rest-api/dist";

export const rescheduleTasks = functions.https.onRequest(
  async (request, response) => {
    const todoistApi = todoist(process.env.TODOIST_API_KEY!);

    const projectIdsToReschedule = await getProjectIdsToReschedule(todoistApi);
    console.log("project", projectIdsToReschedule);
    const tasks = await todoistApi.v1.task.findAll();
    const now = moment();
    const tasksToReschedule = tasks.filter((task) => {
      if (!task.due || !task.due.date) {
        return false;
      }
      // Tasks already scheduled in the future should not be rescheduled.
      if (moment(task.due.date).isAfter(now)) {
        return false;
      }
      return projectIdsToReschedule.has(task.project_id);
    });

    if (tasksToReschedule.length === 0) {
      console.log("No tasks to reschedule!");
      response.send("No tasks to reschedule");
      return;
    }

    const nextWorkday = getNextWorkday();
    const nextWorkdayStr = nextWorkday.format("YYYY-MM-DD");
    for (const taskToReschedule of tasksToReschedule) {
      console.log("rescheduling ", taskToReschedule.content);
      try {
        // @ts-ignore
        const result = await todoistApi.v1.task.update(taskToReschedule.id, {
          due_date: nextWorkdayStr,
        });
        if (!result) {
          console.error("Problem updating task", taskToReschedule);
        }
      } catch (error) {
        console.error(
          `Error encountered updating task ${taskToReschedule.content}`,
          error
        );
      }
    }
    console.log(`Updated ${tasksToReschedule.length} tasks`);
    response.send(`Updated ${tasksToReschedule.length} tasks`);
  }
);

async function getProjectIdsToReschedule(
  todoistApi: any
): Promise<Set<number>> {
  if (!process.env.PROJECTS_TO_RESCHEDULE) {
    console.error("No projects to reschedule found");
    return new Set();
  }
  const lowerProjectNames = new Set(
    process.env.PROJECTS_TO_RESCHEDULE.split(",").map((project) =>
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

function currentMoment(): Moment {
  return moment().tz(process.env.TIMEZONE!);
}
