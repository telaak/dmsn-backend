import * as express from 'express'
import mongoose, { Document, Model } from 'mongoose'

export class RouterModel {
  public route: string;
  public router = express.Router();
  public Model: Model<any>;
  public getterFn: Function;
  public pathString: string;

  constructor (
    route: string,
    model: Model<any>,
    getterFn: Function,
    pathString: string
  ) {
    this.route = route
    this.Model = model
    this.getterFn = getterFn as Function
    this.pathString = pathString
    this.initRoutes()
  }

  private initRoutes () {
    this.router.get(this.route, async (req, res) => {
      const [rootParent, queriedDocument]: [Document, Document] = await this.getterFn(req)
      res.send(queriedDocument)
    })

    this.router.get(`${this.route}${this.pathString}`, async (req, res) => {
      try {
        const [rootParent, queriedDocument]: [Document, mongoose.Types.DocumentArray<any>] = await this.getterFn(req)
        let target;
        for (let param in req.params) {
          target = queriedDocument.id(req.params[param])
        }
        res.send(target)
      } catch (error) {
        res.send(error)
      }
    })
  
    this.router.post(this.route, async (req, res) => {
      try {
        const [rootParent, queriedDocument]: [Document, mongoose.Types.DocumentArray<any>] = await this.getterFn(req)
        const newDoc = new this.Model(req.body)
        queriedDocument.push(newDoc)
        await rootParent.save()
        res.send(newDoc)
      } catch (error) {
        res.send(error)
      }
    })
  
    this.router.delete(`${this.route}:id`, async (req, res) => {
      try {
        const [rootParent, queriedDocument]: [Document, mongoose.Types.DocumentArray<any>] = await this.getterFn(req)
        const target = queriedDocument.id(req.params.id) as mongoose.Types.Subdocument
        await target.remove()
        await rootParent.save()
        res.send(target)
      } catch (error) {
        res.send(error)
      }
    })

    this.router.patch(`${this.route}:id`, async (req, res) => {
      try {
        const [rootParent, queriedDocument]: [Document, mongoose.Types.DocumentArray<any>] = await this.getterFn(req)
        const target = queriedDocument.id(req.params.id) as mongoose.Types.Subdocument
        target.set(req.body)
        await rootParent.save()
        res.send(target)
      } catch (error) {
        res.send(error)
      }
    })
  }
}
