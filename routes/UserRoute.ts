import * as dayjs from "dayjs";
import { Duration } from "dayjs/plugin/duration";
import * as express from "express";
import { Request, Response } from "express";
import { Document, ObjectId } from "mongoose";
import { scheduleJob } from "node-schedule";
import {
  IContact,
  ILocation,
  IMessage,
  IUser,
  IUserSettings,
  UserModel,
} from "../models/User";
import * as relativeTime from "dayjs/plugin/relativeTime";
import * as duration from "dayjs/plugin/duration";
dayjs.extend(relativeTime);
dayjs.extend(duration);
export const UserRoute = express.Router();

export const getUserFromSession = async (
  req: Request
): Promise<Document<IUser>> => {
  if (!req.session.mongoId) throw 401;
  try {
    const user = (await UserModel.findById(
      req.session.mongoId
    ).exec()) as unknown as Document<IUser>;
    return user;
  } catch (error) {
    throw 404;
  }
};

export const getContactsFromSession = async (
  req: Request
): Promise<[Document<IUser>, string[]]> => {
  const user = await getUserFromSession(req);
  return [user, ["contacts"]];
};

export const getMessagesFromSession = async (
  req: Request
): Promise<[Document<IUser>, string[]]> => {
  const user = await getUserFromSession(req);
  return [user, ["contacts", "messages"]];
};

UserRoute.post("/ping", async (req, res) => {
  try {
    const user = (await getUserFromSession(req)) as unknown as IUser;
    const newLocation = req.body as ILocation;
    if (newLocation) {
      await user.setLocation(newLocation);
    }
    await user.ping();
    res.send(user.lastPing);
  } catch (error) {
    if (typeof error === "number") {
      res.sendStatus(error as number);
    } else {
      res.sendStatus(500);
    }
  }
});

UserRoute.patch("/settings", async (req, res) => {
  try {
    const user = await getUserFromSession(req);
    const newSettings: Partial<IUserSettings> = req.body;
    // @ts-ignore:next-line
    user.settings = newSettings;
    await user.save();
    res.send(user);
  } catch (error) {
    console.log(error);
    if (typeof error === "number") {
      res.sendStatus(error as number);
    } else {
      res.sendStatus(500);
    }
  }
});

UserRoute.post("/pushToken", async (req, res) => {
  try {
    const user = (await getUserFromSession(req)) as unknown as IUser;
    const newPushToken = req.body.pushToken as string;
    console.log(newPushToken);
    await user.setPushToken(newPushToken);
    res.send(user);
  } catch (error) {
    if (typeof error === "number") {
      res.sendStatus(error as number);
    } else {
      res.sendStatus(500);
    }
  }
});

UserRoute.get("/current", async (req, res) => {
  try {
    console.log(
      `current, id:${req.session.id} mongoid: ${req.session.mongoId}`
    );
    const user = await getUserFromSession(req);
    res.send(user);
  } catch (error) {
    if (typeof error === "number") {
      res.sendStatus(error as number);
    } else {
      res.sendStatus(500);
    }
  }
});

UserRoute.post("/login", async (req: Request, res: Response) => {
  UserModel.findOne(
    { username: req.body.username },
    function (err: Error, user: IUser) {
      if (err || !user) {
        return res.sendStatus(401);
      }

      user.comparePassword(
        req.body.password,
        function (err: Error, isMatch: boolean) {
          if (err) {
            return res.sendStatus(401);
          }
          if (isMatch) {
            req.session.mongoId = user._id as ObjectId;
            console.log(
              `logged in, id:${req.session.id} mongoid: ${req.session.mongoId}`
            );
          } else {
            req.session.destroy((err) => {});
            return res.sendStatus(401);
          }
          res.send(user);
        }
      );
    }
  );
});

UserRoute.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) res.sendStatus(500);
    res.status(200).send();
  });
});
