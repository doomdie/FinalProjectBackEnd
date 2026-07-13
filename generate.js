import 'dotenv/config'
import { dbService } from './services/db.service.js'

const DRY_RUN = false  // ← flip to false to actually delete

async function purgeBoris() {
    const userCol = await dbService.getCollection('user')
    const reviewCol = await dbService.getCollection('review')
    const orderCol = await dbService.getCollection('order')

    if (DRY_RUN) console.log('=== DRY RUN — nothing will be deleted ===')
    else console.log('=== LIVE RUN — deletions WILL happen ===')

    const borises = await userCol.find({ fullname: { $regex: 'boris', $options: 'i' } }).toArray()

    if (!borises.length) {
        console.log('No users named Boris found')
        return
    }

    console.log(`\nFound ${borises.length} Boris(es):`)
    borises.forEach(user => console.log(`  - ${user.fullname} (${user._id})`))

    const borisObjectIds = borises.map(user => user._id)
    const borisStringIds = borises.map(user => user._id.toString())

    const reviewCriteria = { byUserId: { $in: borisObjectIds } }
    const orderCriteria = { 'buyer._id': { $in: borisStringIds } }

    const doomedReviews = await reviewCol.find(reviewCriteria).toArray()
    const doomedOrders = await orderCol.find(orderCriteria).toArray()

    console.log(`\nReviews by them: ${doomedReviews.length}`)
    doomedReviews.forEach(review => {
        const preview = (review.txt || '').slice(0, 50)
        console.log(`  - "${preview}..." [${review.targetType}] (${review._id})`)
    })

    console.log(`\nOrders by them: ${doomedOrders.length}`)
    doomedOrders.forEach(order => {
        console.log(`  - ${order.stay?.name || 'unknown stay'} ${order.startDate} → ${order.endDate} (${order._id})`)
    })

    if (!doomedReviews.length && !doomedOrders.length) {
        console.log('\nNothing to delete.')
        return
    }

    if (DRY_RUN) {
        console.log(`\nDRY RUN complete. WOULD delete: ${doomedReviews.length} reviews, ${doomedOrders.length} orders.`)
        console.log('Set DRY_RUN to false and run again to execute.')
        return
    }

    const reviewResult = await reviewCol.deleteMany(reviewCriteria)
    const orderResult = await orderCol.deleteMany(orderCriteria)
    console.log(`\nDeleted ${reviewResult.deletedCount} reviews, ${orderResult.deletedCount} orders.`)
}

purgeBoris()
    .catch(err => {
        console.error('Script failed:', err)
        process.exitCode = 1
    })
    .finally(() => process.exit())