import { ObjectId } from 'mongodb'

import { asyncLocalStorage } from '../../services/als.service.js'

import { logger } from '../../services/logger.service.js'

import { dbService } from '../../services/db.service.js'

export const reviewService = { query, remove, add }
export async function query(filterBy = {}) {
    try {
        const collection = await dbService.getCollection('review')
        const matchCriteria = _buildCriteria(filterBy)
        const pipeline = [
            { $match: matchCriteria },
            { $lookup: { from: 'user', localField: 'byUserId', foreignField: '_id', as: 'byUser' } },
            { $unwind: { path: '$byUser', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'stay', localField: 'targetId', foreignField: '_id', as: 'targetStay' } },
            { $unwind: { path: '$targetStay', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'txt': true,
                    'rating': true,
                    'targetType': true,
                    'targetId': true,
                    'createdAt': true,
                    'byUser._id': true,
                    'byUser.fullname': true,
                    'byUser.imgUrl': true,
                    'byUser.location': true,
                    'targetStay._id': true,
                    'targetStay.imgUrls': true
                }
            },
            { $sort: { createdAt: -1 } }
        ]
        const reviews = await collection.aggregate(pipeline).toArray()
        return reviews
    } catch (err) {
        logger.error('cannot get reviews', err)
        throw err
    }
}
async function remove(reviewId) {

    try {

        const { loggedinUser } = asyncLocalStorage.getStore()

        const collection = await dbService.getCollection('review')

        const criteria = { _id: ObjectId.createFromHexString(reviewId) }

        if (!loggedinUser.isAdmin) {

            criteria.byUserId = ObjectId.createFromHexString(loggedinUser._id)

        }

        const { deletedCount } = await collection.deleteOne(criteria)

        return deletedCount

    } catch (err) {

        logger.error(`cannot remove review ${reviewId}`, err)

        throw err

    }

}

async function add(review) {

    try {

        const reviewToAdd = {

            byUserId: ObjectId.createFromHexString(review.byUserId),

            targetType: review.targetType,

            targetId: ObjectId.createFromHexString(review.targetId),

            txt: review.txt,

            rating: +review.rating,

            createdAt: new Date()

        }

        const collection = await dbService.getCollection('review')

        await collection.insertOne(reviewToAdd)

        return reviewToAdd

    } catch (err) {

        logger.error('cannot add review', err)

        throw err

    }

}

function _buildCriteria(filterBy) {

    const criteria = {}

    if (filterBy.byUserId) {

        criteria.byUserId = ObjectId.createFromHexString(filterBy.byUserId)

    }
    function _buildCriteria(filterBy) {

        const criteria = {}
        if (filterBy.hostId) {

            criteria['host._id'] = filterBy.hostId

        }
        if (filterBy.txt) {
            criteria['loc.city'] = { $regex: filterBy.txt, $options: 'i' }
        }
        // if (filterBy.stayIds) {
        //     const ids = (Array.isArray(filterBy.stayIds) ? filterBy.stayIds : [filterBy.stayIds])
        //         .map(id => ObjectId.createFromHexString(id))
        //     criteria.targetId = { $in: ids }
        //     criteria.targetType = 'stay'
        // }
        if (filterBy.stayIds) {
        const raw = Array.isArray(filterBy.stayIds)
            ? filterBy.stayIds
            : String(filterBy.stayIds).split(',')
        const ids = raw
            .map(id => id.trim())
            .filter(id => /^[0-9a-fA-F]{24}$/.test(id))
            .map(id => ObjectId.createFromHexString(id))
        if (ids.length) {
            criteria.targetId = { $in: ids }
            criteria.targetType = 'stay'
        }
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

    if (filterBy.targetId) {

        criteria.targetId = ObjectId.createFromHexString(filterBy.targetId)

    }

    if (filterBy.targetType) {

        criteria.targetType = filterBy.targetType

    }

    return criteria

}