import * as mongoose from "mongoose";
import * as bcrypt from "bcryptjs";
const { Schema } = mongoose;

export interface IMessage {
    duration: number
    content: string
}

export interface IContact {
    name: String,
    email: String,
    phoneNumber: String,
    smsEnabled: Boolean,
    emailEnabled: Boolean,
    messages: IMessage[]
    _id?: mongoose.ObjectId
}

export interface IUser {
    username: string
    password: string
    contacts: IContact[]
    lastPing: Date
    comparePassword: Function
    _id?: mongoose.ObjectId
}

export const MessageSchema = new Schema<IMessage>({
    duration: Number,
    content: String
})

export const ContactSchema = new Schema<IContact>({
    name: String,
    email: String,
    phoneNumber: String,
    smsEnabled: Boolean,
    emailEnabled: Boolean,
    messages: [MessageSchema]
})

export const UserSchema = new Schema({
  username: String,
  password: String,
  lastPing: Date,
  contacts: [ContactSchema]
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

UserSchema.set("toJSON", {
  transform: function (doc: mongoose.Document<IUser>, ret: Partial<IUser>) {
    delete ret?.password;
  },
});

export const UserModel = mongoose.model("User", UserSchema);

export const ContactModel = mongoose.model("Contact", ContactSchema)
