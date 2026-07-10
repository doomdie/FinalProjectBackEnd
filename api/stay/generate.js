import fs from 'fs';
import { ObjectId } from 'mongodb'; // THIS IS THE MISSING PIECE

// Load your existing data
const users = JSON.parse(fs.readFileSync('./users.json', 'utf8'));
const stays = JSON.parse(fs.readFileSync('./stay.json', 'utf8'));

const reviews = [];
const guests = users.filter(u => !u.isHost); 

stays.forEach(stay => {
    // Ensure stay._id is a string if it's currently an object
    const stayId = typeof stay._id === 'object' ? stay._id.$oid || stay._id : stay._id;

    const numReviews = Math.floor(Math.random() * 5) + 1; 

    for (let i = 0; i < numReviews; i++) {
        const randomGuest = guests[Math.floor(Math.random() * guests.length)];
        
        reviews.push({
            _id: new ObjectId().toHexString(), 
            targetId: stayId, // Correctly linked
            targetType: 'stay',
            txt: "Amazing place, highly recommended! Great location and clean.", 
            rating: Math.floor(Math.random() * 5) + 1, 
            createdAt: Date.now(),
            byUser: {
                _id: randomGuest._id,
                fullname: randomGuest.fullname,
                imgUrl: randomGuest.imgUrl
            },
            targetStay: {
                _id: stayId,
                name: stay.name
            }
        });
    }
});

fs.writeFileSync('./reviews.json', JSON.stringify(reviews, null, 2));
console.log(`Generated ${reviews.length} reviews for ${stays.length} stays.`);