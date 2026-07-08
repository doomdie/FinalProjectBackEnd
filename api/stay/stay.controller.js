import { logger } from '../../services/logger.service.js'
import { stayService } from './stay.service.js'
import { socketService } from '../../services/socket.service.js'
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
        const savedStay = await stayService.save(stay)
        res.json(savedStay)
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

export async function toggleLike(req, res) {
    try {
        const { id } = req.params
        const loggedInUserId = req.loggedinUser?._id || req.loggedinUser?.id

        if (!loggedInUserId) {
            return res.status(401).send({ err: 'Not authenticated' })
        }

        const isLike = req.method === 'POST'

        await stayService.toggleLike(id, loggedInUserId, isLike)

        const updatedStay = await stayService.getById(id)
        const likedByUsers = updatedStay?.likedByUsers || []

      
        await socketService.broadcast({
            type: 'stay-like-toggled',
            data: { stayId: id, likedByUsers },
            userId: loggedInUserId 
        })

        res.send({ status: 'success', likedByUserId: loggedInUserId })
    } catch (err) {
        logger.error('Controller error in toggleLike:', err)
        res.status(400).send({ err: 'Failed to toggle like update' })
    }
}