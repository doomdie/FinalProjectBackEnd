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



_seedPastOrders()

async function _seedPastOrders() {
    try {
        const orderCollection = await dbService.getCollection('order')
        const currentOrderCount = await orderCollection.countDocuments()

        if (currentOrderCount > 0) return

        console.log('Seeding 3 past orders for every user in the database...')

        const userCollection = await dbService.getCollection('user')
        const stayCollection = await dbService.getCollection('stay')

        const users = await userCollection.find({}).toArray()
        const stays = await stayCollection.find({}).toArray()

        if (!users.length || !stays.length) {
            console.error('Cannot seed orders: Missing users or stays collections data.')
            return
        }

        const ordersToInsert = []
        const today = new Date()

        users.forEach(user => {
            for (let i = 1; i <= 3; i++) {
                const randomStay = stays[Math.floor(Math.random() * stays.length)]
                const pastStartDate = new Date(today)
                pastStartDate.setDate(today.getDate() - (i * 5) - 3)

                const pastEndDate = new Date(pastStartDate)
                pastEndDate.setDate(pastStartDate.getDate() + 3) 

                const mockOrder = {
                    hostId: randomStay.host._id || randomStay.host.id,
                    buyer: {
                        _id: user._id,
                        fullname: user.fullname
                    },
                    stay: {
                        _id: randomStay._id,
                        name: randomStay.name,
                        price: randomStay.price
                    },
                    startDate: pastStartDate.toISOString().split('T')[0], // "YYYY-MM-DD"
                    endDate: pastEndDate.toISOString().split('T')[0],
                    guests: {
                        adults: Math.floor(Math.random() * 2) + 1,
                        children: 0,
                        infants: 0,
                        pets: 0
                    },
                    totalPrice: randomStay.price * 3,
                    status: 'approved' 
                }

                ordersToInsert.push(mockOrder)
            }
        })

        await orderCollection.insertMany(ordersToInsert)
        console.log(`🚀 Successfully seeded ${ordersToInsert.length} historic orders into MongoDB!`)

    } catch (err) {
        console.error('❌ Failed to seed historic order collection:', err)
    }
}
async function query(filterBy = {}) {
    try {
        const collection = await dbService.getCollection('order')
        // ADD FILTERING 
        const orders = await collection.find({}).toArray()
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