import { dbService } from '../../services/db.service.js'
import { logger } from '../../services/logger.service.js'
import { ObjectId } from 'mongodb'

export const orderService = {
    query,
    getById,
    remove,
    add,
    update
}




// async function query(filterBy = {}) {
//     try {
//         const collection = await dbService.getCollection('order')
//         // ADD FILTERING 
//         const orders = await collection.find({}).toArray()
//         return orders
//     } catch (err) {
//         logger.error('cannot find orders', err)
//         throw err
//     }
// }
async function query(filterBy = {}) {
    try {
        const criteria = {}

        if (filterBy.hostId) {
            criteria.hostId = filterBy.hostId
        }

        if (filterBy.buyerId) {
            criteria.$or = [
                { 'buyer._id': filterBy.buyerId },
                { 'buyer.id': filterBy.buyerId }
            ]
        }

        if (filterBy.upcoming === 'true' || filterBy.upcoming === true) {
            const today = new Date().toISOString().split('T')[0]
            criteria.endDate = { $gte: today }
        }

        const collection = await dbService.getCollection('order')
        const orders = await collection.find(criteria).toArray()
        return orders
    } catch (err) {
        logger.error('cannot find orders', err)
        throw err
    }
}
async function getById(orderId) {
    try {
        const collection = await dbService.getCollection('order')
        const order = await collection.findOne({ _id: new ObjectId(orderId) })
        return order
    } catch (err) {
        logger.error(`cannot find order ${orderId}`, err)
        throw err
    }
}

async function remove(orderId) {
    try {
        const collection = await dbService.getCollection('order')
        await collection.deleteOne({ _id: new ObjectId(orderId) })
        return orderId
    } catch (err) {
        logger.error(`cannot remove order ${orderId}`, err)
        throw err
    }
}

async function add(order) {
    try {
        const collection = await dbService.getCollection('order')
        const response = await collection.insertOne(order)
        order._id = response.insertedId
        return order
    } catch (err) {
        logger.error('cannot insert order', err)
        throw err
    }
}

async function update(order) {
    try {
        const collection = await dbService.getCollection('order')
        const id = order._id
        if (!id) throw new Error('missing _id') 
        const orderToSave = { ...order }
        delete orderToSave._id

        await collection.updateOne(
            { _id: new ObjectId(id) },
            { $set: orderToSave }
        )
        order._id = id
        return order
    } catch (err) {
        logger.error(`cannot update order ${order._id}`, err)
        throw err
    }
}