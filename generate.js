import { MongoClient } from 'mongodb'

// ======================= SETTINGS =======================
const DRY_RUN = false   // true = only print what WOULD be deleted, false = actually delete
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://yair123:yair123@cluster0.gixxl2w.mongodb.net/?retryWrites=true&w=majority'
const DB_NAME = 'tester_db'
const HOST_ID = '6a56179b66e321901a0e4bc3'   // Yair - the order is removed from HIS reservations
// ========================================================

function todayStr() {
    const d = new Date()
    const pad = n => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

async function run() {
    const client = await MongoClient.connect(MONGO_URL)
    const db = client.db(DB_NAME)

    try {
        const orderCollection = db.collection('order')
        const today = todayStr()

        // upcoming = checkout date is today or later ("YYYY-MM-DD" strings compare correctly)
        const upcomingOrders = await orderCollection
            .find({ hostId: HOST_ID, endDate: { $gte: today } })
            .sort({ _id: -1 })   // ObjectId encodes creation time: newest first
            .toArray()

        if (!upcomingOrders.length) {
            console.log(`No upcoming orders found for host ${HOST_ID} - nothing to delete.`)
            return
        }

        console.log(`Upcoming orders for the host (newest first): ${upcomingOrders.length}`)
        upcomingOrders.forEach((o, i) => {
            const marker = i === 0 ? '  << WILL BE DELETED' : ''
            console.log(`  - ${o.buyer?.fullname || 'Unknown'} @ "${o.stay?.name || '?'}" | ${o.startDate} -> ${o.endDate} | total ${o.totalPrice} | _id ${o._id}${marker}`)
        })

        const target = upcomingOrders[0]

        if (DRY_RUN) {
            console.log(`\n[DRY RUN] Nothing was deleted. Set DRY_RUN = false to delete the marked order.`)
            return
        }

        const result = await orderCollection.deleteOne({ _id: target._id })
        console.log(`\nDeleted ${result.deletedCount} order: ${target.buyer?.fullname} @ "${target.stay?.name}" (${target.startDate} -> ${target.endDate})`)
    } finally {
        await client.close()
    }
}

run().catch(err => {
    console.error('Script failed:', err)
    process.exit(1)
})