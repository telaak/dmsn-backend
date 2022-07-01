import * as mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
const { Schema } = mongoose;

export interface IMessage {
  duration: number;
  content: string;
  _id?: mongoose.ObjectId
}

export interface IContact {
  name: String;
  email: String;
  phoneNumber: String;
  smsEnabled: Boolean;
  emailEnabled: Boolean;
  messages: IMessage[];
  pushToken: String;
  _id?: mongoose.ObjectId;
}

export interface IUser {
  username: string;
  password: string;
  contacts: IContact[];
  lastPing: Date;
  comparePassword: Function;
  ping: Function;
  setPushToken: Function;
  _id?: mongoose.ObjectId;
}

export const MessageSchema = new Schema<IMessage>({
  duration: {
    type: Number,
    required: true,
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
    required: true,
  },
  emailEnabled: {
    type: Boolean,
    required: true,
  },
  messages: [MessageSchema],
});

export const UserSchema = new Schema({
  username: {
    type: String,
    required: true,
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
      required: false
  },
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

UserSchema.methods.ping = async function() {
    this.lastPing = Date.now()
    await this.save()
}

UserSchema.methods.setPushToken = async function(newPushToken: string) {
    this.pushToken = newPushToken
    await this.save()
}

UserSchema.set("toJSON", {
  transform: function (doc: mongoose.Document<IUser>, ret: Partial<IUser>) {
    delete ret?.password;
  },
});

export const UserModel = mongoose.model("User", UserSchema);

export const ContactModel = mongoose.model("Contact", ContactSchema);

export const MessageModel = mongoose.model("Message", MessageSchema);
