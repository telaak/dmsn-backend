import sgMail from "@sendgrid/mail";
import { ITimedMessage } from "./timers";
import "dotenv/config";
import dayjs from "dayjs";
sgMail.setApiKey(process.env.SENDGRID_API_KEY as string);

export const sendMail = (timedMessage: ITimedMessage) => {
  console.log(timedMessage)
  let emailText = timedMessage.content;

  if (timedMessage.sendLocation) {
    emailText += ` ${dayjs(timedMessage.location.timestamp).format('DD-MM-YYYY HH:mm:ss')} Latitude: ${timedMessage.location.coords.latitude} Longitude: ${timedMessage.location.coords.longitude}`;
  }

  const emailMessage = {
    to: timedMessage.email,
    from: "dmsn@laaksonen.eu",
    subject: `DMS notification`,
    text: emailText,
  };
  sgMail.send(emailMessage);
};
