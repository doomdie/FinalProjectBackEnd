import { MongoClient, ObjectId } from 'mongodb'

// ======================= SETTINGS =======================
const DRY_RUN = false   // true = only print what WOULD be created, false = actually insert
const MONGO_URL = process.env.MONGO_URL || 'mongodb+srv://yair123:yair123@cluster0.gixxl2w.mongodb.net/?retryWrites=true&w=majority'
const DB_NAME = 'tester_db'
const HOST_ID = '6a56179b66e321901a0e4bc3'   // Yair - reviews go on this host's stays
const REVIEWS_PER_STAY = 5
// ========================================================

const REVIEW_TEXTS = [
    'Amazing place, highly recommended! Great location and clean.',
    'Had a wonderful stay. The host was super responsive and helpful.',
    'Beautiful apartment, exactly like the photos. Would book again!',
    'Great value for the price. Comfortable beds and a fully equipped kitchen.',
    'Perfect location, walking distance to everything we wanted to see.',
    'Spotlessly clean and very cozy. Check-in was smooth and easy.',
    'Lovely views and a quiet neighborhood. We slept great every night.',
    'The host thought of everything - great communication throughout.',
    'Stylish, comfortable, and even better in person. Highly recommend.',
    'Fantastic experience from start to finish. Five stars well earned.',
    'Everything was as described. Quick responses and great local tips.',
    'Charming place with lots of character. We loved our stay here.',
    'Super comfortable and immaculate. The photos do not do it justice.',
    'Ideal for our family trip - spacious, clean, and well located.',
    'One of the best stays we have had. Warm host and a beautiful home.',
]

function shuffle(arr) {
    const a = [...arr]
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[a[i], a[j]] = [a[j], a[i]]
    }
    return a
}

function randomPastDate(maxDaysAgo = 240) {
    const daysAgo = 3 + Math.floor(Math.random() * maxDaysAgo)
    const d = new Date()
    d.setDate(d.getDate() - daysAgo)
    d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60), Math.floor(Math.random() * 60))
    return d
}

function toObjectId(id) {
    return typeof id === 'string' ? new ObjectId(id) : id
}

async function run() {
    const client = await MongoClient.connect(MONGO_URL)
    const db = client.db(DB_NAME)

    try {
        const stayCollection = db.collection('stay')
        const userCollection = db.collection('user')
        const reviewCollection = db.collection('review')

        const stays = await stayCollection
            .find({ $or: [{ 'host._id': HOST_ID }, { 'host._id': new ObjectId(HOST_ID) }] })
            .toArray()

        if (!stays.length) {
            console.log(`No stays found for host ${HOST_ID} - aborting.`)
            return
        }
        console.log(`Found ${stays.length} stay(s) for the host:`)
        stays.forEach(s => console.log(`  - "${s.name}" (${s._id})`))

        const reviewers = await userCollection
            .find({
                _id: { $nin: [new ObjectId(HOST_ID)] },
                fullname: { $ne: null },
            })
            .toArray()

        if (reviewers.length < REVIEWS_PER_STAY) {
            console.log(`Only ${reviewers.length} eligible reviewer(s) in the database - need at least ${REVIEWS_PER_STAY}. Aborting.`)
            return
        }
        console.log(`\nEligible reviewers (host excluded): ${reviewers.length}`)

        const newReviews = []
        let textIdx = 0
        const shuffledTexts = shuffle(REVIEW_TEXTS)

        for (const stay of stays) {
            // fresh shuffle per stay: 5 DISTINCT users for this stay,
            // but the same user may appear again on a different stay
            const pickedUsers = shuffle(reviewers).slice(0, REVIEWS_PER_STAY)

            for (const user of pickedUsers) {
                newReviews.push({
                    txt: shuffledTexts[textIdx++ % shuffledTexts.length],
                    rating: 4 + Math.round(Math.random()),   // 4 or 5
                    targetType: 'stay',
                    createdAt: randomPastDate(),
                    targetId: toObjectId(stay._id),
                    byUserId: toObjectId(user._id),
                })
            }

            console.log(`\n"${stay.name}" gets ${REVIEWS_PER_STAY} reviews from:`)
            pickedUsers.forEach((u, i) => {
                const r = newReviews[newReviews.length - REVIEWS_PER_STAY + i]
                console.log(`  - ${u.fullname} (${u.username}) | ${r.rating}★ | "${r.txt.slice(0, 50)}..."`)
            })
        }

        if (DRY_RUN) {
            console.log(`\n[DRY RUN] Nothing was inserted. Set DRY_RUN = false to create ${newReviews.length} reviews for real.`)
            return
        }

        const result = await reviewCollection.insertMany(newReviews)
        console.log(`\nInserted ${result.insertedCount} reviews across ${stays.length} stays`)
    } finally {
        await client.close()
    }
}

run().catch(err => {
    console.error('Script failed:', err)
    process.exit(1)
})