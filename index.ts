import express = require('express');
import { connect, ObjectId } from 'mongoose'
import { getContactsFromSession, getMessagesFromSession, getUserFromSession, UserRoute } from './routes/UserRoute'
import session = require('express-session');
import cors = require('cors');
import 'dotenv/config'
import { ContactModel, IUser, MessageModel, UserModel } from './models/User';
import { RouterModel } from './RouterModel';
const MongoDBStore = require('connect-mongodb-session')(session)

declare module 'express-session' {
  interface Session {
    mongoId: ObjectId;
  }
}

const app = express()
app.set('trust proxy', 1);
const port = 3000

connect(`mongodb://${process.env.MONGO_ADDRESS}:27017/dmsn`)

app.use(express.json())
app.use(
  cors({
    credentials: true,
    origin: true
  })
)
app.use(express.urlencoded({ extended: true }))

app.listen(port, () => {
  console.log(`Running on port ${port}`)
})

app.use(
  session({
    secret: 'secret',// process.env.COOKIE_SECRET,
    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      domain: process.env.DOMAIN
    },
    resave: true,
    saveUninitialized: false,
    rolling: true,
    store: new MongoDBStore({
      uri: `mongodb://${process.env.MONGO_ADDRESS}:27017/mongodb_session`,
      collection: 'mySessions'
    })
  })
)

const ContactRouter = new RouterModel('/', ContactModel, getContactsFromSession, ':contactId')
const MessageRouter = new RouterModel('/:contactId/message/', MessageModel, getContactsFromSession, ':messageId')


app.get('/test/:id1/', async (req, res) => {
  const [user, subDocumentKeys] = await getMessagesFromSession(req)
  const paramArray = Object.values(req.params)
  let target = user
  for (let i = 0; i < paramArray.length; i++) {
    target = target.get(subDocumentKeys[i])
    target = target.id(paramArray[i])
  }
  console.log(req.params)
  res.send(target)
})


app.use('/api/user', UserRoute)
app.use('/api/contact', ContactRouter.router)
app.use('/api/contact', MessageRouter.router)