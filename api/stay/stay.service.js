import { dbService } from '../../services/db.service.js'
import { ObjectId } from 'mongodb'
import gDefaultStays from './stay.json' with { type: 'json' }

async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        
        const collection = await dbService.getCollection('stay')

        const count = await collection.countDocuments()
        if (count === 0) {
            console.log('Stay collection is empty, seeding default stays with native ObjectIds...')

            const staysToInsert = gDefaultStays.map(stay => {
                return {
                    ...stay,
                    _id: new ObjectId(stay._id)
                }
            })

            await collection.insertMany(staysToInsert)
            console.log('Seeded MongoDB with default stays!')
        }

        const stays = await collection.find(criteria).toArray()
        
        return stays
    } catch (err) {
        throw err
    }
}

async function remove(stayId) {
    try {
        const collection = await dbService.getCollection('stay')
        await collection.deleteOne({ _id: new ObjectId(stayId) })
        return stayId
    } catch (err) {
        console.error(`cannot remove stay ${stayId}`, err)
        throw err
    }
}

async function save(stay) {
    try {
        const collection = await dbService.getCollection('stay')

        if (stay._id) {
            const id = stay._id
            const stayToSave = { ...stay }
            delete stayToSave._id

            await collection.updateOne(
                { _id: new ObjectId(id) },
                { $set: stayToSave }
            )
            stay._id = id
            return stay
        } else {
            const response = await collection.insertOne(stay)
            stay._id = response.insertedId.toString()
            return stay
        }
    } catch (err) {
        console.error('cannot save stay', err)
        throw err
    }
}

async function getById(stayId) {
    try {
        if (!ObjectId.isValid(stayId)) {
            console.error(`❌ Invalid MongoDB ObjectId format received: "${stayId}"`)
            return null
        }

        const collection = await dbService.getCollection('stay')
        const stay = await collection.findOne({ _id: new ObjectId(stayId) })

        if (!stay) console.log(`⚠️ Stay with ID ${stayId} was not found in MongoDB.`)
        return stay
    } catch (err) {
        console.error('❌ Error inside stay.service.js getById:', err)
        throw err
    }
}

function _buildCriteria(filterBy) {

    const criteria = {}
    if (filterBy.hostId) {

        criteria['host._id'] = filterBy.hostId

    }
    if (filterBy.txt) {
        criteria['loc.city'] = { $regex: filterBy.txt, $options: 'i' }
    }

    if (filterBy.minPrice) {
        criteria.price = { $gte: +filterBy.minPrice }
    }

    if (filterBy.amenities) {
        const wanted = filterBy.amenities.split(',')
        criteria.amenities = { $all: wanted }
    }

    if (filterBy.likedByUserId) {
        criteria.likedByUsers = filterBy.likedByUserId
    }

    return criteria
}

async function toggleLike(stayId, userId, isLike) {
    try {
        if (!ObjectId.isValid(stayId)) {
            throw new Error(`Invalid stayId format: ${stayId}`)
        }

        const collection = await dbService.getCollection('stay')

        const updateOperator = isLike
            ? { $addToSet: { likedByUsers: userId.toString() } }
            : { $pull: { likedByUsers: userId.toString() } }

        const result = await collection.updateOne(
            { _id: new ObjectId(stayId) },
            updateOperator
        )
        return result
    } catch (err) {
        console.error('Error in stayService toggleLike:', err)
        throw err
    }
}

export const stayService = {
    query,
    getById,
    remove,
    save,
    toggleLike
}