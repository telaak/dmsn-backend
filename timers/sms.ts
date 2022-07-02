import { ITimedMessage } from "./timers";
import * as serialportgsm from "serialport-gsm";
let modem = serialportgsm.Modem();
let options = {
  autoDeleteOnReceive: true,
  enableConcatenation: true,
  incomingCallIndication: true,
  incomingSMSIndication: true,
  cnmiCommand: "AT+CNMI=2,1,0,2,1",
  logger: console,
};

modem.open("/dev/tty.usbserial-2110", options);

modem.on('open', data => {
    modem.initializeModem()
})

export const sendSMS = (timedMessage: ITimedMessage) => {
  console.log(timedMessage.phoneNumber);
  try {
    modem.sendSMS(timedMessage.phoneNumber, timedMessage.content, false, (cb: any) => {
      console.log(cb);
    });
  } catch (error) {
    console.log(error);
  }
};
