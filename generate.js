import { ObjectId } from 'mongodb'
import { dbService } from './services/db.service.js'

async function debugIDType(idString) {
    const collection = await dbService.getCollection('review')

    const asString = await collection.findOne({ targetId: idString })
    console.log('SEARCH AS STRING:', asString ? 'FOUND!' : 'NOT FOUND')

    const asObjectId = await collection.findOne({ targetId: new ObjectId(idString) })
    console.log('SEARCH AS OBJECTID:', asObjectId ? 'FOUND!' : 'NOT FOUND')

    const raw = await collection.findOne({})
    console.log('RAW DATA SAMPLE:', raw)
    console.log('IS targetId AN OBJECTID?', raw.targetId instanceof ObjectId)
    const testId = '6a4f7144e8f1e739c4da5c01';
    const found = await collection.findOne({ targetId: new ObjectId(testId) });
    console.log('DID I FIND IT?', found ? 'YES!' : 'NO');
}

debugIDType('622f337a75c7d36e498aab33')