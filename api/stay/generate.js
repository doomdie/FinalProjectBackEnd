import { dbService } from './services/db.service.js';

// These match your AMENITY_ICON_MAP keys for perfect frontend rendering
const VALID_AMENITIES = [
    'Wifi', 'Internet', 'Kitchen', 'TV', 'Washer', 'Dryer', 
    'Smoke detector', 'Dedicated workspace', 'Air conditioning', 
    'Essentials', 'Hangers', 'Carbon monoxide detector', 
    'Balcony', 'Iron', 'Heating', 'Luggage dropoff allowed', 
    'Free parking on premises'
];

async function updateAmenitiesOnly() {
    console.log('--- UPDATING AMENITIES ONLY ---');
    
    try {
        const stayCol = await dbService.getCollection('stay');
        const stays = await stayCol.find().toArray();

        for (const stay of stays) {
            // Shuffle the valid list and pick 5-10 random items
            const shuffled = [...VALID_AMENITIES].sort(() => 0.5 - Math.random());
            const randomCount = Math.floor(Math.random() * (10 - 5 + 1)) + 5;
            const newAmenities = shuffled.slice(0, randomCount);
            
            // Update only the amenities field
            await stayCol.updateOne(
                { _id: stay._id },
                { $set: { amenities: newAmenities } }
            );
            
            console.log(`UPDATED AMENITIES: ${stay.name}`);
        }
        
        console.log('--- AMENITIES UPDATE COMPLETE ---');
    } catch (err) {
        console.error('--- FAILED ---', err);
    }
    process.exit(0);
}

updateAmenitiesOnly();