import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

crons.interval(
  "sweep abandoned cancel sessions",
  { minutes: 15 },
  internal.cancelSessions.sweepAbandoned,
  {}
);

crons.monthly(
  "monthly saved-revenue receipts",
  { day: 1, hourUTC: 9, minuteUTC: 0 },
  internal.emails.monthlyReceipts,
  {}
);

export default crons;
