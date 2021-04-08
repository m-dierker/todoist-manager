// @ts-ignore
require("dotenv").config();
import * as functions from "firebase-functions";
import { OverdueTaskRescheduler } from "./overdue";
import { WorkdayTaskRescheduler } from "./workday";

export const rescheduleWorkTasks = functions.https.onRequest((req, res) =>
  new WorkdayTaskRescheduler().reschedule(req, res)
);

export const rescheduleOverdueTasks = functions.https.onRequest((req, res) =>
  new OverdueTaskRescheduler().reschedule(req, res)
);
