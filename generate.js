import { MongoClient, ObjectId } from 'mongodb'

const DRY_RUN = false
const STAY_ID = '6a4f7144e8f1e739c4da5c01'
const REVIEW_COUNT = 20
const MONGO_URL = 'mongodb+srv://yair123:yair123@cluster0.gixxl2w.mongodb.net/?retryWrites=true&w=majority'
const DB_NAME = 'tester_db'

const REVIEW_TEXTS = [
    'Amazing place, would definitely come back!',
    'Great location and super clean. Host was very responsive.',
    'Beautiful home, exactly as pictured. Highly recommend.',
    'We had a wonderful stay. Everything was perfect.',
    'Lovely space, great amenities, easy check-in.',
    'The host went above and beyond. Fantastic experience.',
    'Very comfortable and stylish. Loved the neighborhood.',
    'Spotless, cozy, and quiet. Slept like a baby.',
    'Perfect for our family trip. Kids loved it.',
    'Incredible views and a great vibe. 10/10.',
    'Check-in was smooth and the place felt like home.',
    'Better than the photos! Will book again.',
    'Great value, wonderful host, prime location.',
    'Everything we needed was there. Super convenient.',
    'Charming place with lots of character.',
]

function getRandomItems(arr, count) {
    const shuffled = [...arr].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
}

async function run() {
    const client = await MongoClient.connect(MONGO_URL)
    const db = client.db(DB_NAME)

    try {
        const sample = await db.collection('review').findOne({})
        console.log('=== Sample existing review (compare shapes!) ===')
        console.log(JSON.stringify(sample, null, 2))
        console.log('================================================\n')

        const stay = await db.collection('stay').findOne({ _id: new ObjectId(STAY_ID) })
        if (!stay) {
            console.log(`No stay found with _id ${STAY_ID}`)
            return
        }
        console.log(`Stay: ${stay.name}`)

        const users = await db.collection('user').find({}).toArray()
        console.log(`Found ${users.length} users\n`)
        if (!users.length) return

        const reviewers = getRandomItems(users, Math.min(REVIEW_COUNT, users.length))

        const newReviews = reviewers.map(user => ({
            txt: REVIEW_TEXTS[Math.floor(Math.random() * REVIEW_TEXTS.length)],
            rate: Math.random() < 0.5 ? 4 : 5,
            by: {
                _id: user._id.toString(),
                fullname: user.fullname,
                imgUrl: user.imgUrl || '',
            },
            aboutStay: {
                _id: stay._id.toString(),
                name: stay.name,
            },
            createdAt: Date.now(),
        }))

        console.log(`Generated ${newReviews.length} reviews:\n`)
        newReviews.forEach(r => {
            console.log(`  ${r.rate}  ${r.by.fullname}: "${r.txt}"`)
        })

        if (DRY_RUN) {
            console.log('\nDRY RUN - nothing inserted.')
            console.log('1. Compare the generated shape against the sample review above.')
            console.log('2. Fix field names if they differ, then set DRY_RUN = false.')
            return
        }

        const { insertedCount } = await db.collection('review').insertMany(newReviews)
        console.log(`\nInserted ${insertedCount} reviews.`)
    } finally {
        await client.close()
    }
}

run().catch(console.error)