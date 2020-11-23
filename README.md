# todoist-manager

Reschedules work Todoist tasks to keep the weekends free. :)

## Background

I use Todoist to track both personal and work todos. Personal and work todos are in separate Projects, but they all combine together in the Today view since that's the only view in Todoist that allows you to click and drag todos.

As time went on and more todos were added, I started relying on Todoist more for personal life todos... but I couldn't easily escape work since Today always had my work todos. This was particularly prevalent on the weekend, when I didn't want constant reminders of work. Thus, Todoist Manager was born. :D

## Project Info

Todoist Manager is a short bit of Cloud Function code that will automatically reschedule workday tasks. It's meant to be run at the end of the workday (either automatically or manually) and will defer everything due on or before today for the next workday.

## Setup + Deployment

Todoist Manager is setup to be deployed as a [Firebase Cloud function](https://firebase.google.com/docs/functions) on Google Cloud. It requires enabling a billing account, but it will stay well within free tier usage limits.

### Prereqs

- Install [Firebase CLI](https://firebase.google.com/docs/cli).
- Create a [Firebase project](https://console.firebase.google.com).
- Create a Google Cloud billing account (if necessary) and link to your project.
- TODO(document): Select your new project in the Firebase CLI.

### Setup

Copy `.env.sample` to `.env`. Fill in the environment fields:

`TODOIST_API_KEY`: Integration key from your [Todoist settings](https://todoist.com/prefs/integrations).

`TIMEZONE`: Your local timezone. (It might be possible to pull this from Todoist but I have not done that yet).

`PROJECT_TO_RESCHEDULE`: Comma-separated case insensitive list of projects with tasks that should be rescheduled. For me, this is a list of the Todoist projects that have work tasks in them.

`IGNORE_LABELS`: Comma-separated case insensitive list of labels that can be applied to skip a specific task. Note that labels are a feature of Todoist Premium and are not required to use this project.

`AUTH_KEY`: Generate some random word or phrase to pass to your function so it only reschedules on calls from you.

### Deploy

- cd into project directory
- `firebase deploy --only functions`

### Call manually

When your function is deployed, a URL is printed that you can visit to reschedule your tasks. Don't forget your auth key!

Ex: https://us-west1-YOUR-PROJECT-ID.cloudfunctions.net/rescheduleTasks?authKey=abc123somekey

### Call automatically

- [Google Cloud Scheduler](https://cloud.google.com/scheduler) would work for this but it only includes a few free tasks per billing account. (You can use it fully free for this project, but you just couldn't set it up for 50 other projects).
- I used [cron-job.org](https://cron-job.org) because it seemed fully free and exactly what I wanted. I schedule my task rescheduling every day at 8pm.

### Develop locally

`nodemon`: Runs a persistent local server that refreshes on changes.

A URL for your function is printed when the emulator starts (ex: http://localhost:5001/your-project/us-west1/rescheduleTasks). You can open this URL in your browser, but don't forget your auth key!

Ex: http://localhost:5001/YOUR_PROJECT/us-west1/rescheduleTasks?authKey=abc123somekey
