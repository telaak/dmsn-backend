import * as mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
const { Schema } = mongoose;

export interface IUserSettings {
  email: string;
  phoneNumber: string;
  enableDMS: boolean;
  enablePushNotifications: boolean;
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
}

export const UserSettingsSchema = new Schema<IUserSettings>({
  email: {
    type: String,
    required: false,
    unique: true,
  },
  phoneNumber: {
    type: String,
    required: false,
    unique: true,
  },
  enableDMS: {
    type: Boolean,
    required: false,
    default: true,
  },
  enablePushNotifications: {
    type: Boolean,
    required: false,
    default: true,
  },
  enableEmailNotifications: {
    type: Boolean,
    required: false,
  },
  enableSMSNotifications: {
    type: Boolean,
    required: false,
  },
});

export interface ILocation {
  coords: {
    accuracy: number;
    altitude: number;
    altitudeAccuracy: number;
    heading: number;
    latitude: number;
    longitude: number;
    speed: number;
  };
  timestamp: Date;
}

export const LocationSchema = new Schema<ILocation>({
  coords: {
    accuracy: Number,
    altitude: Number,
    altitudeAccuracy: Number,
    heading: Number,
    latitude: Number,
    longitude: Number,
    speed: Number,
  },
  timestamp: Date,
});

export interface IDuration {
  days: number;
  weeks: number;
  months: number;
  years: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
}

export interface IMessage {
  duration: IDuration;
  content: string;
  _id?: mongoose.ObjectId;
}

export interface IContact {
  name: string;
  email: string;
  phoneNumber: string;
  smsEnabled: boolean;
  emailEnabled: boolean;
  sendLocation: boolean;
  messages: IMessage[];
  pushToken: string;
  _id?: mongoose.ObjectId;
}

export interface IUser {
  username: string;
  password: string;
  contacts: IContact[];
  lastPing: Date;
  location: ILocation;
  pushToken: string;
  settings: IUserSettings;
  comparePassword: Function;
  ping: Function;
  setPushToken: Function;
  setLocation: Function;
  _id?: mongoose.ObjectId;
}

export const MessageSchema = new Schema<IMessage>({
  duration: {
    days: Number,
    weeks: Number,
    months: Number,
    years: Number,
    hours: Number,
    minutes: Number,
    seconds: Number,
    milliseconds: Number,
  },
  content: {
    type: String,
    required: true,
  },
});

export const ContactSchema = new Schema<IContact>({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: false,
  },
  phoneNumber: {
    type: String,
    required: false,
  },
  smsEnabled: {
    type: Boolean,
    required: false,
    default: false,
  },
  emailEnabled: {
    type: Boolean,
    required: false,
    default: false,
  },
  sendLocation: {
    type: Boolean,
    required: false,
    default: false,
  },
  messages: [MessageSchema],
});

export const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  lastPing: {
    type: Date,
    default: Date.now,
  },
  pushToken: {
    type: String,
    required: false,
  },
  location: {
    type: LocationSchema,
    required: false,
  },
  settings: UserSettingsSchema,
  contacts: [ContactSchema],
});

UserSchema.pre("save", function (next) {
  const user = this;

  if (!user.isModified("password")) {
    return next();
  }

  bcrypt.genSalt(10, function (err, salt) {
    if (err) {
      return next(err);
    }

    bcrypt.hash(user.password as string, salt, function (err, hash) {
      if (err) {
        return next(err);
      }
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function (
  candidatePassword: string,
  cb: Function
) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if (err) {
      return cb(err);
    }
    cb(null, isMatch);
  });
};

UserSchema.methods.ping = async function () {
  this.lastPing = Date.now();
  await this.save();
};

UserSchema.methods.setLocation = async function (newLocation: ILocation) {
  if (newLocation.coords) {
    this.location = newLocation;
    await this.save();
  }
};

UserSchema.methods.setPushToken = async function (newPushToken: string) {
  this.pushToken = newPushToken;
  await this.save();
};

UserSchema.set("toJSON", {
  transform: function (doc: mongoose.Document<IUser>, ret: Partial<IUser>) {
    delete ret?.password;
  },
});

import { updateTimers } from "../timers/timers";

UserSchema.pre("save", function (next) {
  const user = this as unknown as IUser;
  if (
    this.isModified("settings") ||
    this.isModified("contacts") ||
    this.isModified("lastPing")
  ) {
    updateTimers(user);
  }
  next();
});

export const UserSettingsModel = mongoose.model(
  "UserSettings",
  UserSettingsSchema
);

export const UserModel = mongoose.model("User", UserSchema);

export const ContactModel = mongoose.model("Contact", ContactSchema);

export const MessageModel = mongoose.model("Message", MessageSchema);
