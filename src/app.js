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

const PORT = process.env.PORT

app.post("/participants", async (req, res) => {
    const participant = req.body
    const entry = Date.now()
    const participantSchema = joi.object({
        name: joi.string().required(),
    });
    const validation = participantSchema.validate(participant, { pick: ["name"], abortEarly: false })
    console.log(validation)
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message)
        return res.status(422).send(errors)
    }
    try {
        const findName = await db.collection("participants").findOne({ name: participant.name })
        if (findName) return res.status(409).send("Já existe com esse nome")
        const time = dayjs().format("HH:mm:ss")
        await db
            .collection('participants')
            .insertOne({ name: participant.name, lastStatus: entry })
        await db
            .collection("messages")
            .insertOne({
                from: participant.name,
                to: 'Todos',
                text: 'entra na sala...',
                type: 'status',
                time: time
            })
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
    const message = req.body
    const from = req.headers.user
    const messageSchema = joi.object({
        to: joi.string().required(),
        text: joi.string().required(),
        type: joi.string().required().valid("message", "private_message"),
    });
    const validation = messageSchema.validate(message, { pick: ["to", "text", "type"], abortEarly: false })
    console.log(validation)
    if (validation.error) {
        const errors = validation.error.details.map((detail) => detail.message)
        return res.status(422).send(errors)
    }
    try {
        const findName = await db
            .collection("participants")
            .findOne({ name: from })
        if (!findName) return res.status(422).send("Não existe com esse nome")
        const time = dayjs().format("HH:mm:ss")
        await db
            .collection("messages")
            .insertOne({ from: from, to: message.to, text: message.text, type: message.type, time: time })
        res.sendStatus(201)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
app.get("/messages", async (req, res) => {
    try {
        const validLimit =
            !!req.query.limit &&
            Number.isInteger(+req.query.limit) &&
            +req.query.limit > 0;
        if (!!req.query.limit && !validLimit) {
            return res.sendStatus(422);
        }
        const from = req.headers.user
        const list = await db
            .collection("messages")
            .find({
                $or: [
                    { type: 'message' },
                    { type: 'status' },
                    { from: from },
                    { to: from },
                ]
            })
            .sort({ $natural: validLimit ? -1 : 1 })
            .limit(validLimit ? +req.query.limit : 0)
            .toArray()
        return res.send(list)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})
app.post("/status", async (req, res) => {
    try {
        const { user } = req.headers
        const list = await db
            .collection("participants")
            .findOne({ name: user })
        if (!list) return res.sendStatus(404)
        const entry = Date.now()
        await db
            .collection('participants')
            .updateOne({ name: user }, { $set: { lastStatus: entry } })

        res.sendStatus(200)
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
})

async function removeParticipants() {
    const entry = Date.now()
    const limit = 10000
    const time = dayjs().format("HH:mm:ss")
    try {
        const list = await db.collection("participants").find().toArray()
        list.map(async (participant) => {
            if (participant.lastStatus + limit < entry) {
                await db
                    .collection("participants")
                    .deleteOne(participant)

                await db
                    .collection("messages")
                    .insertOne({
                        from: participant.name,
                        to: 'Todos',
                        text: 'sai da sala...',
                        type: 'status',
                        time: time
                    })
            }
        })
    } catch (error) {
        console.log(error)
        res.sendStatus(500)
    }
}

setInterval(removeParticipants, 15000)

app.listen(PORT, () => console.log("Server online in " + PORT)) 