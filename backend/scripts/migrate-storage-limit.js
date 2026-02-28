require('dotenv').config()
const mongoose = require('mongoose')

const NEW_LIMIT = 20 * 1024 * 1024 // 20 MB

async function run() {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('Connected to MongoDB')

    const result = await mongoose
        .model('User', new mongoose.Schema({}, { strict: false }))
        .updateMany({}, { $set: { storageLimit: NEW_LIMIT } })

    console.log(`Updated ${result.modifiedCount} users to storageLimit = 20 MB`)
    await mongoose.disconnect()
}

run().catch((err) => {
    console.error(err)
    process.exit(1)
})
