import { UserModel } from './models/User'
import mongoose from 'mongoose'
mongoose.connect('mongodb://localhost:27017/dmsn')
UserModel.create({
  username: 'Test',
  password: 'Kys',
})
