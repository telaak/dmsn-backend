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
    test: String;
  }
}

const app = express()

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
// app.set('trust proxy', 1)
app.listen(port, () => {
  console.log(`Running on port ${port}`)
})

app.use(
  session({
    secret: process.env.COOKIE_SECRET as string,
    cookie: {
      maxAge: 1000 * 60 * 60,
      httpOnly: true,
      domain: process.env.DOMAIN,
  //    secure: true
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
const MessageRouter = new RouterModel('/:contactId/message/', MessageModel, getMessagesFromSession, ':messageId')

app.use('/api/user', UserRoute)
app.use('/api/user/contact', ContactRouter.router)
app.use('/api/user/contact', MessageRouter.router)