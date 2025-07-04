import { ITimedMessage } from "./timers";
import "dotenv/config";
import dayjs from "dayjs";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export const sendMail = async (timedMessage: ITimedMessage) => {
  console.log(timedMessage);
  let emailText = timedMessage.content;

  if (timedMessage.sendLocation) {
    emailText += ` ${dayjs(timedMessage.location.timestamp).format(
      "DD-MM-YYYY HH:mm:ss"
    )} Latitude: ${timedMessage.location.coords.latitude} Longitude: ${
      timedMessage.location.coords.longitude
    }`;
  }

  const emailMessage = {
    to: timedMessage.email,
    from: "dmsn@laaksonen.eu",
    subject: `DMS notification`,
    text: emailText,
  };
  try {
    await transporter.sendMail(emailMessage);
    console.log(`sent ${emailMessage}`);
  } catch (error) {
    console.error(error);
  }
};
