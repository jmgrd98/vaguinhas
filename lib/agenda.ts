// /lib/agenda.ts
import Agenda, { Job, JobPriority } from "agenda";

if (!process.env.MONGODB_URI) {
  throw new Error("MONGODB_URI must be defined to run Agenda");
}

// 1) Connect Agenda to the same MongoDB cluster
export const agenda = new Agenda({
  db: {
    address: process.env.MONGODB_URI,
    collection: "agendaJobs",
    // If you want to control the pool, you can pass extra options here.
  },
  processEvery: "30 seconds", // how often agenda checks for due jobs
});

// 2) Define a job “sendSupport_us” that simply calls sendSupportUsEmail()
import { sendSupportUsEmail } from "./email";

agenda.define(
  "sendSupport_us",
  { priority: JobPriority.normal, concurrency: 5 },
  async (job: Job) => {
    const { to } = job.attrs.data as { to: string };
    if (!to) {
      console.error("📛 No 'to' in job data for sendSupport_us!");
      return;
    }
    try {
      console.log(`🕒 [Agenda] Sending support email to ${to} …`);
      await sendSupportUsEmail(to);
      console.log(`✅ [Agenda] support us email sent to ${to}`);
    } catch (err) {
      console.error(`❌ [Agenda] Failed to send support-us to ${to}`, err);
    }
  }
);

// 3) Start Agenda (once, at server startup)
(async function () {
  // Wait until Agenda is ready
  await agenda.start();
  console.log("📬 Agenda started, waiting for jobs…");
})();
