import * as express from "express";
import { Request, Response } from "express";
import { Document, ObjectId } from "mongoose";
import { IContact, IMessage, IUser, UserModel } from "../models/User";
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

UserRoute.get("/ping", async (req, res) => {
  try {
    const user = await getUserFromSession(req) as unknown as IUser;
    await user.ping();
    res.send(user.lastPing)
  } catch (error) {
    res.sendStatus(401)
  }
});

UserRoute.post('/pushToken', async (req, res) => {
  try {
    const user = await getUserFromSession(req) as unknown as IUser;
    const newPushToken = req.body.pushToken as string
    await user.setPushToken(newPushToken)
    res.send(user)
  } catch (error) {
    res.sendStatus(500)
  }
})

UserRoute.get("/current", async (req, res) => {
  try {
    const user = await getUserFromSession(req);
    res.send(user);
  } catch (error) {
    res.sendStatus(401)
  }
});

UserRoute.post("/login", async (req: Request, res: Response) => {
  UserModel.findOne(
    { username: req.body.username },
    function (err: Error, user: IUser) {
      if (err || !user) {
        return res.sendStatus(401)
      }

      user.comparePassword(
        req.body.password,
        function (err: Error, isMatch: boolean) {
          if (err) {
            return res.sendStatus(401)
          }
          if (isMatch) {
            req.session.mongoId = user._id as ObjectId;
          } else {
            req.session.destroy((err) => {});
            return res.sendStatus(401)
          }
          res.send(user);
        }
      );
    }
  );
});

UserRoute.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) res.sendStatus(500)
    res.status(200).send();
  });
});
