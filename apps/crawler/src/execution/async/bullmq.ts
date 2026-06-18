import type { JobsOptions as BullJobsOptions, Job } from "bullmq";
import * as bullmq from "bullmq/dist/cjs/index.js";

type BullMqModule = typeof import("bullmq");
const cjsBullmq = bullmq as unknown as BullMqModule;

export const Queue: BullMqModule["Queue"] = cjsBullmq.Queue;
export const QueueEvents: BullMqModule["QueueEvents"] = cjsBullmq.QueueEvents;
export const Worker: BullMqModule["Worker"] = cjsBullmq.Worker;

export type JobInstance = Job;
export type JobsOptions = BullJobsOptions;
export type QueueEventsInstance = InstanceType<BullMqModule["QueueEvents"]>;
export type QueueInstance = InstanceType<BullMqModule["Queue"]>;
export type WorkerInstance = InstanceType<BullMqModule["Worker"]>;
