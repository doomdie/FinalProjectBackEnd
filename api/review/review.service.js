import { ObjectId } from 'mongodb'

import { asyncLocalStorage } from '../../services/als.service.js'
import { logger } from '../../services/logger.service.js'
import { dbService } from '../../services/db.service.js'

export const reviewService = { query, remove, add }
export async function query(filterBy = {}) {
    try {
        const collection = await dbService.getCollection('review')
        
        const matchCriteria = {}
        if (filterBy.targetId) {
            matchCriteria.targetId = new ObjectId(filterBy.targetId)
        }
        
        console.log('DEBUG: Backend Strict Criteria:', matchCriteria)
        
        const pipeline = [
            { $match: matchCriteria },
            { $lookup: { from: 'user', localField: 'byUserId', foreignField: '_id', as: 'byUser' } },
            { $unwind: { path: '$byUser', preserveNullAndEmptyArrays: true } },
            { $lookup: { from: 'stay', localField: 'targetId', foreignField: '_id', as: 'targetStay' } },
            { $unwind: { path: '$targetStay', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    'txt': true, 'rating': true, 'targetId': true,
                    'byUser.fullname': true, 'byUser.imgUrl': true,
                    'targetStay.name': true
                }
            }
        ]

        const reviews = await collection.aggregate(pipeline).toArray()
        console.log('DEBUG: Backend found this many reviews:', reviews.length)
        return reviews
    } catch (err) {
        logger.error('cannot get reviews', err)
        throw err
    }
}
// async function query(filterBy = {}) {
//     try {
//         const criteria = _buildCriteria(filterBy)
//         const collection = await dbService.getCollection('review')
        
//        var reviews = await collection.aggregate([
//     {
//         $match: criteria,
//     },
//     {
//         $lookup: {
//             localField: 'byUserId',
//             from: 'user',
//             foreignField: '_id',
//             as: 'byUser',
//         },
//     },
//     {
//         $unwind: {
//             path: '$byUser',
//             preserveNullAndEmptyArrays: true
//         }
//     },
//     {
//         $lookup: {
//             from: 'stay',
//             localField: 'targetId',
//             foreignField: '_id',
//             as: 'targetStay'
//         }
//     },
//     {
//         $unwind: {
//             path: '$targetStay',
//             preserveNullAndEmptyArrays: true
//         }
//     },
//     {
//         $lookup: {
//             from: 'user',
//             localField: 'targetId',
//             foreignField: '_id',
//             as: 'targetUser'
//         }
//     },
//     {
//         $unwind: {
//             path: '$targetUser',
//             preserveNullAndEmptyArrays: true
//         }
//     },
//     { 
//         $project: {
//             'txt': true, 
//             'rating': true,
//             'targetType': true,
//             'targetId': true,
//             'createdAt': true,
//             'byUser._id': true, 
//             'byUser.fullname': true, 
//             'byUser.imgUrl': true,
//             'targetStay._id': true,
//             'targetStay.name': true,
//             'targetUser._id': true,
//             'targetUser.fullname': true,
//             'targetUser.imgUrl': true
//         } 
//     }
// ]).toArray()
//         return reviews
//     } catch (err) {
//         logger.error('cannot get reviews', err)
//         throw err
//     }
// }

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
    
    if (filterBy.targetId) {
        criteria.targetId = ObjectId.createFromHexString(filterBy.targetId)
    }

    if (filterBy.targetType) {
        criteria.targetType = filterBy.targetType
    }
    
    return criteria
}