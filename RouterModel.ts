import * as express from 'express'
import { AnyArray, Document, Model } from 'mongoose'
import { IUser } from './models/User';
import { getUserFromSession } from './routes/UserRoute';

export class RouterModel {
  public route: string;
  public router = express.Router();
  public Model: Model<any>;
  public getterFn: Function;

  constructor (
    route: string,
    model: Model<any>,
    getterFn?: Function
  ) {
    this.route = route
    this.Model = model
    this.getterFn = getterFn as Function
    this.initRoutes()
  }

  private initRoutes () {
    this.router.get(this.route, async (req, res) => {
      const [rootParent, queriedDocument]: [Document, Object] = await this.getterFn(req)
      res.send(queriedDocument)
    })

    this.router.get(`${this.route}:id`, async (req, res) => {
      try {
        const [rootParent, queriedDocument, subDocumentKeys]: [Document, Object, string[]] = await this.getterFn(req)
        const test = rootParent.get(subDocumentKeys[0])
        res.send(test)
      } catch (error) {
        res.send(error)
      }
    })
  
    this.router.post(this.route, async (req, res) => {
      try {
        const [rootParent, queriedDocument, subDocumentKeys]: [Document, Object, string[]] = await this.getterFn(req)
        let subDoc: any;
        for (let i = 0; i < subDocumentKeys.length; i++) {
          if (i === 0) {
            subDoc = rootParent.get(subDocumentKeys[i])
          } else {
            subDoc = subDoc.get(subDocumentKeys[i])
          }
        }
        const newDoc = new this.Model(req.body)
        subDoc.push(newDoc)
        await rootParent.save()
        res.send(newDoc)
      } catch (error) {
        res.send(error)
      }
    })
  /*
    this.router.delete(`${this.route}:id`, async (req, res) => {
      try {
        const document: Document = await this.Model.findByIdAndDelete(
          req.params.id
        )
        res.send(document)
      } catch (error) {
        res.send(error)
      }
    })

    this.router.patch(`${this.route}:id`, async (req, res) => {
      try {
        const document: Document = await this.Model.findById(
          req.params.id
        ).exec()
        document.set(req.body)
        await document.save()
        res.send(document)
      } catch (error) {
        res.send(error)
      }
    }) */
  }
}
