import * as sgMail from "@sendgrid/mail";
import { ITimedMessage } from "./timers";
import 'dotenv/config'
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendMail = (timedMessage: ITimedMessage) => {
  const emailMessage = {
    to: timedMessage.email,
    from: "dmsn@laaksonen.eu",
    subject: `DMS notification`,
    text: timedMessage.content,
  };
  sgMail.send(emailMessage);
};
