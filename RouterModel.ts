import * as express from "express";
import mongoose, { Document, Model } from "mongoose";

export class RouterModel {
  public route: string;
  public router = express.Router();
  public Model: Model<any>;
  public getterFn: Function;
  public pathString: string;

  constructor(
    route: string,
    model: Model<any>,
    getterFn: Function,
    pathString: string
  ) {
    this.route = route;
    this.Model = model;
    this.getterFn = getterFn as Function;
    this.pathString = pathString;
    this.initRoutes();
  }

  private async getRootAndTarget(req: express.Request) {
    const [root, subDocumentKeys]: [Document, string[]] = await this.getterFn(
      req
    );
    const paramArray = Object.values(req.params);
    let target = root;
    for (let i = 0; i < subDocumentKeys.length; i++) {
      target = target.get(subDocumentKeys[i]);
      if (paramArray[i]) {
        target = target.id(paramArray[i]);
      }
    }
    return [root, target];
  }

  private initRoutes() {
    this.router.get(this.route, async (req, res) => {
      try {
        const [root, target] = await this.getRootAndTarget(req);
        target ? res.send(target) : res.status(404).send();
      } catch (error) {
        if (typeof error === "number") {
          res.sendStatus(error as number);
        } else {
          res.sendStatus(500);
        }
      }
    });

    this.router.get(`${this.route}${this.pathString}`, async (req, res) => {
      try {
        const [root, target] = await this.getRootAndTarget(req);
        target ? res.send(target) : res.status(404).send();
      } catch (error) {
        if (typeof error === "number") {
          res.sendStatus(error as number);
        } else {
          res.sendStatus(500);
        }
      }
    });

    this.router.post(this.route, async (req, res) => {
      try {
        const [root, target] = await this.getRootAndTarget(req);
        const targetArray =
          target as unknown as mongoose.Types.DocumentArray<any>;
        const newDocument = new this.Model(req.body);
        targetArray.push(newDocument);
        await root.save();
        res.send(root);
      } catch (error) {
        console.log(error)
        if (typeof error === "number") {
          res.sendStatus(error as number);
        } else {
          res.sendStatus(500);
        }
      }
    });

    this.router.delete(`${this.route}:id`, async (req, res) => {
      console.log('removing')
      try {
        const [root, target] = await this.getRootAndTarget(req);
        await target.remove();
        await root.save();
        res.send(root);
      } catch (error) {
        console.log(error)
        if (typeof error === "number") {
          res.sendStatus(error as number);
        } else {
          res.sendStatus(500);
        }
      }
    });

    this.router.patch(`${this.route}:id`, async (req, res) => {
      try {
        const [root, target] = await this.getRootAndTarget(req);
        target.set(req.body);
        await root.save();
        res.send(root);
      } catch (error) {
        if (typeof error === "number") {
          res.sendStatus(error as number);
        } else {
          res.sendStatus(500);
        }
      }
    });
  }
}
