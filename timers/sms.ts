import { ITimedMessage } from "./timers";
import * as serialportgsm from "serialport-gsm";
import { IUser, UserModel } from "../models/User";
let modem = serialportgsm.Modem();
let options = {
  enableConcatenation: true,
  incomingCallIndication: true,
  incomingSMSIndication: true,
  cnmiCommand: "AT+CNMI=2,1,0,2,1",
  logger: console,
};

modem.open("/dev/tty.usbserial-2110", options);

const processSMSPing = async (messageDetails: ISMSDetails) => {
  console.log(messageDetails);
  try {
    if (messageDetails.message.toLowerCase() === "ping") {
      const user = (await UserModel.findOne({
        "settings.phoneNumber": messageDetails.sender,
      }).exec()) as unknown as IUser;
      await user.ping();
      modem.deleteMessage(messageDetails)
    }
  } catch (error) {
    console.log(error);
  }
};

modem.on("onNewMessage", async (messageDetails: ISMSDetails) => {
  console.log(messageDetails);
});
modem.on("open", (data) => {
  console.log('open')
  modem.initializeModem(async () => {
    const messages = await modem.getSimInbox();
    console.log(messages)
    messages.data.forEach((message: ISMSDetails) => {
      // processSMSPing(message);
     //  modem.deleteMessage(message)
    });
  });
});

export const sendSMS = (timedMessage: ITimedMessage) => {
  console.log(timedMessage.phoneNumber);
  try {
    modem.sendSMS(
      timedMessage.phoneNumber,
      timedMessage.content,
      false,
      (cb: any) => {
        console.log(cb);
      }
    );
  } catch (error) {
    console.log(error);
  }
};

export interface ISMSDetails {
  sender: string;
  message: string;
  index: number;
  msgStatus: number;
  dateTimeSetn: Date;
  header: {
    encoding: string;
    smsc: string;
    smscType: string;
    smscPlan: string;
  };
}
