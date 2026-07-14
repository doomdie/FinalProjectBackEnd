import { MongoClient, ObjectId } from 'mongodb'

// ======================= SETTINGS =======================
const DRY_RUN = false   // true = only print what WOULD be created, false = actually insert
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://yair123:yair123@cluster0.gixxl2w.mongodb.net/?retryWrites=true&w=majority'
const DB_NAME = 'tester_db'
const HOST_ID = '6a56179b66e321901a0e4bc3'   // Yair - orders are created on his stays
const EARLIEST_FALLBACK = new Date('2022-01-01')   // used if a reviewer has no createdAt
// ========================================================

function pad(n) { return String(n).padStart(2, '0') }
function toDateStr(d) { return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` }

function randomStayDates(joinDate) {
    const floor = new Date(Math.max(joinDate.getTime() + 14 * 86400000, EARLIEST_FALLBACK.getTime()))
    const ceiling = new Date(Date.now() - 21 * 86400000)   // ends at least ~3 weeks ago

    const nights = 2 + Math.floor(Math.random() * 6)   // 2-7 nights

    const span = ceiling.getTime() - nights * 86400000 - floor.getTime()
    const startMs = span > 0
        ? floor.getTime() + Math.floor(Math.random() * span)
        : floor.getTime()

    const start = new Date(startMs)
    const end = new Date(startMs + nights * 86400000)
    return { start, end, nights }
}

function randomGuests(capacity = 4) {
    const adults = 1 + Math.floor(Math.random() * Math.min(3, capacity))
    const children = Math.random() < 0.3 ? 1 : 0
    return { adults, children }
}

async function run() {
    const client = await MongoClient.connect(MONGO_URL)
    const db = client.db(DB_NAME)

    try {
        const stayCollection = db.collection('stay')
        const userCollection = db.collection('user')
        const reviewCollection = db.collection('review')
        const orderCollection = db.collection('order')

        const stays = await stayCollection
            .find({ $or: [{ 'host._id': HOST_ID }, { 'host._id': new ObjectId(HOST_ID) }] })
            .toArray()

        if (!stays.length) {
            console.log(`No stays found for host ${HOST_ID} - aborting.`)
            return
        }
        const stayById = new Map(stays.map(s => [s._id.toString(), s]))
        console.log(`Host stays found: ${stays.length}`)

        const stayIds = stays.map(s => s._id)
        const stayIdStrings = stays.map(s => s._id.toString())

        const reviews = await reviewCollection
            .find({
                targetType: 'stay',
                $or: [
                    { targetId: { $in: stayIds } },
                    { targetId: { $in: stayIdStrings } },
                ],
            })
            .toArray()

        if (!reviews.length) {
            console.log('No reviews found on these stays - aborting.')
            return
        }
        console.log(`Reviews found on host stays: ${reviews.length}`)

        // unique (reviewer, stay) pairs - one order per review pair
        const pairs = new Map()
        for (const r of reviews) {
            if (!r.byUserId) continue
            const key = `${r.byUserId.toString()}|${r.targetId.toString()}`
            if (!pairs.has(key)) pairs.set(key, { userId: r.byUserId.toString(), stayId: r.targetId.toString() })
        }

        const reviewerIds = [...new Set([...pairs.values()].map(p => p.userId))]
        const reviewers = await userCollection
            .find({ _id: { $in: reviewerIds.map(id => new ObjectId(id)) } })
            .toArray()
        const userById = new Map(reviewers.map(u => [u._id.toString(), u]))
        console.log(`Distinct reviewers: ${reviewerIds.length} (${reviewers.length} found in user collection)`)

        const newOrders = []
        for (const { userId, stayId } of pairs.values()) {
            const user = userById.get(userId)
            const stay = stayById.get(stayId)
            if (!user || !stay) continue

            const joinDate = user.createdAt ? new Date(user.createdAt) : EARLIEST_FALLBACK
            const { start, end, nights } = randomStayDates(joinDate)

            newOrders.push({
                hostId: HOST_ID,
                buyer: {
                    _id: user._id.toString(),
                    fullname: user.fullname || 'Guest',
                },
                stay: {
                    _id: stay._id,
                    name: stay.name,
                    price: stay.price,
                },
                startDate: toDateStr(start),
                endDate: toDateStr(end),
                guests: randomGuests(stay.capacity),
                totalPrice: nights * stay.price,
                imgUrl: stay.imgUrls?.[0] || '',
            })
        }

        console.log(`\nOrders to create: ${newOrders.length}`)
        newOrders.forEach(o => {
            const joined = userById.get(o.buyer._id)?.createdAt
            console.log(`  - ${o.buyer.fullname} @ "${o.stay.name}" | ${o.startDate} -> ${o.endDate} | total ${o.totalPrice}` +
                (joined ? ` | joined ${toDateStr(new Date(joined))}` : ' | joined: unknown (fallback floor)'))
        })

        if (DRY_RUN) {
            console.log(`\n[DRY RUN] Nothing was inserted. Set DRY_RUN = false to create ${newOrders.length} orders for real.`)
            return
        }

        const result = await orderCollection.insertMany(newOrders)
        console.log(`\nInserted ${result.insertedCount} orders for host ${HOST_ID}`)
    } finally {
        await client.close()
    }
}

run().catch(err => {
    console.error('Script failed:', err)
    process.exit(1)
})