import express from "express"
import cors from "cors"
import { MongoClient, MongoClient } from "mongodb"
import dotenv from "dotenv"

dotenv.config()

const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db
try{
await mongoClient.connect()
db = mongoClient.db()
}catch(err){
    console.log(err)
}
const app = express()
app.use(express.json())
app.use(cors())

app.listen(PORT, () => "Server online in" + PORT) 