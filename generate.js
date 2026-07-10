import { dbService } from './services/db.service.js';

async function deleteHostSelfReviews() {
    console.log('--- STARTING: DELETING HOST SELF-REVIEWS ---');

    try {
        const reviewCol = await dbService.getCollection('review');
        const stayCol = await dbService.getCollection('stay');

        // 1. Fetch all stays to create a lookup map of stayId -> hostId
        const stays = await stayCol.find().toArray();
        const stayHostMap = new Map();
        
        stays.forEach(stay => {
            // Adjust 'host._id' if your path to the host ID is different
            if (stay.host && stay.host._id) {
                stayHostMap.set(stay._id.toString(), stay.host._id.toString());
            }
        });

        // 2. Fetch all reviews
        const reviews = await reviewCol.find().toArray();
        const idsToDelete = [];

        // 3. Identify reviews where reviewerId === hostId
        reviews.forEach(review => {
            const hostId = stayHostMap.get(review.targetId.toString());
            const reviewerId = review.byUserId.toString();

            if (hostId && reviewerId === hostId) {
                idsToDelete.push(review._id);
                console.log(`FLAGGED: Review ${review._id} by host ${reviewerId} on stay ${review.targetId}`);
            }
        });

        // 4. Perform deletion
        if (idsToDelete.length > 0) {
            const result = await reviewCol.deleteMany({ _id: { $in: idsToDelete } });
            console.log(`--- CLEANUP COMPLETE: Deleted ${result.deletedCount} self-reviews ---`);
        } else {
            console.log('--- NO SELF-REVIEWS FOUND ---');
        }

    } catch (err) {
        console.error('--- CLEANUP FAILED ---', err);
    }
    process.exit(0);
}

deleteHostSelfReviews();