import * as schedule from "node-schedule";
import * as dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";
import * as duration from "dayjs/plugin/duration";
import { IContact, ILocation, IUser } from "../models/User";
import { sendMail } from "./email";
import { sendSMS } from "./sms";
import { connect } from "mongoose";
dayjs.extend(relativeTime);
dayjs.extend(duration);

connect(`mongodb://${process.env.MONGO_ADDRESS}:27017/dmsn`)


let jobsObject = {};

export interface ITimedMessage {
  phoneNumber: string;
  email: string;
  content: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  sendLocation: boolean;
  location: ILocation;
}

export const updateTimers = (updatedUser: IUser) => {
  const lastPing = updatedUser.lastPing;
  const contacts = updatedUser.contacts as IContact[];
  const newJobs: schedule.Job[] = [];
  for (const contact of contacts) {
    for (const message of contact.messages) {
      const targetDate = dayjs(lastPing)
        .add(dayjs.duration(message.duration))
        .toDate();

      const newJob = schedule.scheduleJob(targetDate, () => {
        const timedMessage: ITimedMessage = {
          phoneNumber: contact.phoneNumber,
          email: contact.email,
          content: message.content,
          sendLocation: contact.sendLocation,
          location: updatedUser.lastLocation,
          smsEnabled: contact.smsEnabled,
          emailEnabled: contact.emailEnabled,
        };

        if (timedMessage.smsEnabled) {
            sendSMS(timedMessage)
        }
        if (timedMessage.emailEnabled) {
          sendMail(timedMessage);
        }
      });
      newJobs.push(newJob);
    }
  }
  const id = updatedUser._id.toString();
  if (jobsObject[id] && jobsObject[id].length) {
    try {
      jobsObject[id].forEach((job: schedule.Job) => job.cancel());
    } catch (error) {}
  }
  jobsObject[id] = newJobs;
};
