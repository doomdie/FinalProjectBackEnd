import { stayService } from './stay.service.js'

export async function getStays(req, res) {
    try {
        const filterBy = req.query
        const stays = await stayService.query(filterBy)

        res.json(stays)
    } catch (err) {
        res.status(500).send({ err: 'Failed to get stays' })
    }
}
export async function addStay(req, res) {
    try {
        const stay = req.body
        // PLACED HODLERRRRRRRRRRRR
    } catch (err) {
        res.status(500).send({ err: 'Failed to add stay' })
    }
}
export async function getStayById(req, res) {
    try {
        const stayId = req.params.id
        const stay = await stayService.getById(stayId)
        res.json(stay)
    } catch (err) {
        res.status(500).send({ err: 'Failed to get stay' })
    }
}
export async function removeStay(req, res) {
    try {
        const stayId = req.params.id
        await stayService.remove(stayId)
        res.send(stayId) 
    } catch (err) {
        console.error('Failed to remove stay', err)
        res.status(500).send({ err: 'Failed to remove stay' })
    }
}
export async function updateStay(req, res) {
    try {
        const stay = req.body
        const savedStay = await stayService.save(stay)
        res.json(savedStay)
    } catch (err) {
        console.error('Failed to update stay', err)
        res.status(500).send({ err: 'Failed to update stay' })
    }
}