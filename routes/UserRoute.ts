import * as express from "express";
import { Request, Response } from "express";
import { Document, ObjectId } from "mongoose";
import { IContact, IMessage, IUser, UserModel } from "../models/User";
export const UserRoute = express.Router();

export const getUserFromSession = async (req: Request) => {
  try {
    const user = (await UserModel.findById(
      req.session.mongoId
    ).exec()) as unknown as Document<IUser>;
    const userObject = user.toJSON() as IUser;
    return [user, userObject];
  } catch (error) {
    throw "Not found";
  }
};

export const getContactsFromSession = async (req: Request): Promise<[Document<IUser>, IContact[], string[]]> => {
  try {
    const user = (await UserModel.findById(
      req.session.mongoId
    ).exec()) as unknown as Document<IUser>;
    const userObject = user.toJSON() as IUser;
    const contactDoc = user.get('contacts') as Document<IContact>
    return [user, userObject.contacts, ['contacts']];
  } catch (error) {
    throw "Not found";
  }
};


UserRoute.get("/current", async (req, res) => {
  try {
    const user = await getUserFromSession(req);
    res.send(user);
  } catch (error) {
    res.status(401).send(error);
  }
});

UserRoute.post("/login", async (req: Request, res: Response) => {
  UserModel.findOne(
    { username: req.body.username },
    function (err: Error, user: IUser) {
      if (err || !user) {
        return res.status(401).send(err);
      }

      user.comparePassword(
        req.body.password,
        function (err: Error, isMatch: boolean) {
          if (err) {
            return res.status(401).send(err);
          }
          if (isMatch) {
            req.session.mongoId = user._id as ObjectId;
          } else {
            req.session.destroy((err) => {});
            return res.status(401).send();
          }
          res.send(user);
        }
      );
    }
  );
});

UserRoute.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) res.status(500).send(err);
    res.status(200).send();
  });
});
