import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"

dotenv.config()
const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db
try {
    await mongoClient.connect()
    
} catch (error) {
    console.log("Server Error")
}
const app = express()
app.use(express.json())
app.use(cors())
db = mongoClient.db()
app.post("/participants", async (req, res) => {
    const participant = req.body
    const entry = Date.now()
    const participantSchema = joi.object({
        name: joi.string().required(),
    });
    const validation = participantSchema.validate(participant, {pick:["name"],abortEarly:false})
    console.log(validation)
    if (validation.error){
        const errors = validation.error.details.map((detail) => detail.message)
        return res.status(422).send(errors)
    }
    try {
        const findName = await db.collection("participants").findOne({name:participant.name})
        if(findName) return res.status(409).send("Já existe com esse nome")
        const time = dayjs().format("HH:mm:ss")
        await db
            .collection('participants')
            .insertOne({name:participant.name, lastStatus:entry})
        await db
            .collection("messages")
            .insertOne({from: participant.name, to: 'Todos', text: 'entra na sala...', type: 'status', time: time})
        res.sendStatus(201)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
app.get("/participants", async (req, res) => {
    try {
        const list = await db
        .collection("participants")
        .find()
        .toArray()
        res.send(list)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
app.post("/messages", async (req, res) => {
    try {

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
app.get("/messages", async (req, res) => {
    try {

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
app.post("/status", async (req, res) => {
    try {

    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

const PORT = process.env.PORT

app.listen(PORT, () => console.log("Server online in "+PORT)) 