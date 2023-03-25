import * as schedule from "node-schedule";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import duration from "dayjs/plugin/duration";
import { IContact, ILocation, IUser, UserModel } from "../models/User";
import { sendMail } from "./email";
// import { sendSMS } from "./sms";
import { connect, ObjectId } from "mongoose";
import { Expo } from "expo-server-sdk";
import "dotenv/config";
dayjs.extend(relativeTime);
dayjs.extend(duration);

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

export interface ITimedMessage {
  phoneNumber: string;
  email: string;
  content: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  sendLocation: boolean;
  location: ILocation;
}

connect(`mongodb://${process.env.MONGO_ADDRESS}:27017/dmsn`).then(() => {
  const setupTimers = UserModel.find({}).then((users) => {
    users.forEach((user) => {
      const userData = user as unknown as IUser;
      timerHandlers.push(new TimerHandler(userData));
    });
  });
});

const timerHandlers: TimerHandler[] = [];

class TimerHandler {
  public jobArray: schedule.Job[] = [];
  public user: IUser;

  constructor(user: IUser) {
    this.user = user;
    this.createTimers();
  }

  cancelTimers() {
    console.log(`canceling timers for: ${this.user.username}`);
    this.jobArray.forEach((j) => {
      j.cancel();
    });
    this.jobArray = [];
  }

  createTimers() {
    this.cancelTimers();
    console.log(`creating timers for ${this.user.username}`);
    if (this.user.settings.enableDMS) {
      const warningTimes = this.createTimedMessages();
      const notifications = this.createWarningNotifications(warningTimes);
    }
  }

  createTimedMessages = () => {
    const lastPing = this.user.lastPing;
    const contacts = this.user.contacts as IContact[];
    const warningTimes = new Set<number>();
    for (const contact of contacts) {
      if (contact.smsEnabled || contact.emailEnabled) {
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
              location: this.user.location,
              smsEnabled: contact.smsEnabled,
              emailEnabled: contact.emailEnabled,
            };

            if (timedMessage.smsEnabled) {
              sendSMS(timedMessage.phoneNumber, timedMessage.content);
            }
            if (timedMessage.emailEnabled) {
              sendMail(timedMessage);
            }
          });
          if (newDMSJob) this.jobArray.push(newDMSJob);
        }
      }
    }
    return warningTimes;
  };

  createWarningNotifications = (warningTimes: Set<number>) => {
    for (const warningTime of Array.from(warningTimes)) {
      for (const offset of notificationOffsets) {
        const warningTarget = dayjs(warningTime).subtract(offset);
        const userSettings = this.user.settings;
        const warningJob = schedule.scheduleJob(warningTarget.toDate(), () => {
          if (userSettings.enablePushNotifications) {
            if (Expo.isExpoPushToken(this.user.pushToken)) {
              console.log("token ok");
              const messages = [];

              messages.push({
                to: this.user.pushToken,
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
            // TODO
          }

          if (userSettings.enableSMSNotifications) {
            // TODO
          }
        });
        if (warningJob) this.jobArray.push(warningJob);
      }
    }
  };
}

export const updateTimers = async (updatedUser: IUser) => {
  const updatedUserId = String(updatedUser._id) as unknown as string;
  const foundHandler = timerHandlers.find((handler) => {
    const handlerUserId = String(handler.user._id) as unknown as string;
    return updatedUserId === handlerUserId;
  });
  if (foundHandler) {
    console.log("found");
    foundHandler.user = updatedUser;
    foundHandler.createTimers();
  }
};

async function sendSMS(recipient: string, message: string) {
  try {
    await fetch(process.env.SMSAPI as string, {
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        recipient,
        message,
      }),
      method: "POST",
    }).then(res => res.text()).then(console.log)
  } catch (error) {
    console.error(error);
  }
}