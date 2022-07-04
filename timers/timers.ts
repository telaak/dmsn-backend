import * as schedule from "node-schedule";
import * as dayjs from "dayjs";
import * as relativeTime from "dayjs/plugin/relativeTime";
import * as duration from "dayjs/plugin/duration";
import { IContact, ILocation, IUser, UserModel } from "../models/User";
import { sendMail } from "./email";
import { sendSMS } from "./sms";
import { connect } from "mongoose";
import { Expo } from "expo-server-sdk";
import "dotenv/config";
dayjs.extend(relativeTime);
dayjs.extend(duration);

connect(`mongodb://${process.env.MONGO_ADDRESS}:27017/dmsn`).then(() => {
  const setupTimers = UserModel.find({}).then((users) => {
    users.forEach((user) => {
      const userData = user as unknown as IUser;
      updateTimers(userData);
    });
  });
});

const expo = new Expo();

const notificationOffsets = [
  dayjs.duration({
    seconds: 5,
  }),
  dayjs.duration({
    minutes: 5,
  }),
  dayjs.duration({
    hours: 1,
  }),
  dayjs.duration({
    hours: 6,
  }),
  dayjs.duration({
    hours: 12,
  }),
  dayjs.duration({
    days: 1,
  }),
  dayjs.duration({
    days: 3,
  }),
];

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

const createTimedMessages = (updatedUser: IUser, jobArray: schedule.Job[]) => {
  const lastPing = updatedUser.lastPing;
  const contacts = updatedUser.contacts as IContact[];
  const warningTimes = new Set<number>();
  for (const contact of contacts) {
    for (const message of contact.messages) {
      const targetDate = dayjs(lastPing)
        .add(dayjs.duration(message.duration))
        .toDate();

      warningTimes.add(targetDate.getTime());
      const newDMSJob = schedule.scheduleJob(targetDate, () => {
        const timedMessage: ITimedMessage = {
          phoneNumber: contact.phoneNumber,
          email: contact.email,
          content: message.content,
          sendLocation: contact.sendLocation,
          location: updatedUser.location,
          smsEnabled: contact.smsEnabled,
          emailEnabled: contact.emailEnabled,
        };

        if (timedMessage.smsEnabled) {
          sendSMS(timedMessage);
        }
        if (timedMessage.emailEnabled) {
          sendMail(timedMessage);
        }
      });
      jobArray.push(newDMSJob);
    }
  }
  return warningTimes;
};

const createWarningNotifications = (
  warningTimes: Set<number>,
  updatedUser: IUser,
  jobArray: schedule.Job[]
) => {
  for (const warningTime of Array.from(warningTimes)) {
    for (const offset of notificationOffsets) {
      const warningTarget = dayjs(warningTime).subtract(offset);
      const userSettings = updatedUser.settings;
      const warningJob = schedule.scheduleJob(warningTarget.toDate(), () => {
        if (userSettings.enablePushNotifications) {
          if (Expo.isExpoPushToken(updatedUser.pushToken)) {
            console.log("token ok");
            const messages = [];

            messages.push({
              to: updatedUser.pushToken,
              body: `Timer expiring in ${offset.humanize()}`,
            });
            let chunks = expo.chunkPushNotifications(messages);
            let tickets = [];

            for (let chunk of chunks) {
              try {
                let ticketChunk = expo
                  .sendPushNotificationsAsync(chunk)
                  .then((chunk) => {
                    console.log(chunk);
                    tickets.push(...chunk);
                  });
              } catch (error) {
                console.error(error);
              }
            }
          } else {
            console.log("token fail");
          }
        }

        if (userSettings.enableEmailNotifications) {
        }

        if (userSettings.enableSMSNotifications) {
        }
      });
      jobArray.push(warningJob);
    }
  }
};

export const updateTimers = async (updatedUser: IUser) => {
  const newJobs: schedule.Job[] = [];

  if (updatedUser.settings.enableDMS) {
    console.log("updating timers");
    const warningTimes = createTimedMessages(updatedUser, newJobs);
    createWarningNotifications(warningTimes, updatedUser, newJobs);
  }

  const id = updatedUser._id.toString();
  if (jobsObject[id] && jobsObject[id].length) {
    try {
      jobsObject[id].forEach((job: schedule.Job) => job.cancel());
    } catch (error) {}
  }
  jobsObject[id] = newJobs;
};
