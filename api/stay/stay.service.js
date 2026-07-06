import { dbService } from '../../services/db.service.js'
import { ObjectId } from 'mongodb'
import gDefaultStays from './stay.json' with { type: 'json' }
async function query(filterBy = {}) {
    try {
        const criteria = _buildCriteria(filterBy)
        const collection = await dbService.getCollection('stay')
        
        const count = await collection.countDocuments()
        if (count === 0) {
            await collection.insertMany(gDefaultStays)
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
        const collection = await dbService.getCollection('stay')
        const stay = await collection.findOne({ _id: new ObjectId(stayId) })
        return stay
    } catch (err) {
        throw err
    }
}

function _buildCriteria(filterBy) {
    const criteria = {}
    
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
    
    return criteria
}

export const stayService = {
    query,
    getById,
    remove
}