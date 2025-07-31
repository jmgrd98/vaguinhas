// pages/api/queues.ts
import { NextApiRequest, NextApiResponse } from "next";
import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { HonoAdapter } from "@bull-board/hono";
import { getEmailQueue } from "@/lib/emailQueue";
import { Hono } from 'hono';

// Create an instance of Hono
const app = new Hono();

// 1) Create the Hono adapter and tell it our base-path
const serverAdapter = new HonoAdapter(app);
serverAdapter.setBasePath("/api/queues");
serverAdapter.setBasePath("/api/queues");

// 2) Register your BullMQ queue(s)
createBullBoard({
  queues: [
    new BullMQAdapter(getEmailQueue()),
    // new BullMQAdapter(anotherQueue), ...
  ],
  serverAdapter,
});

// 3) Export a handler that simply forwards Next.js req/res into the Hono router
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  return app(req, res);
}

// 4) Disable Next’s body parser so bull-board can stream properly
export const config = {
  api: {
    bodyParser: false,
  },
};
