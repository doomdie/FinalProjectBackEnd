// backend/api/order/order.controller.js
import { orderService } from './order.service.js'
import { logger } from '../../services/logger.service.js'

export async function getOrders(req, res) {
    try {
        const filterBy = req.query
        const orders = await orderService.query(filterBy)
        res.json(orders)
    } catch (err) {
        logger.error('Failed to get orders', err)
        res.status(400).send({ err: 'Failed to get orders' })
    }
}

export async function getOrderById(req, res) {
    try {
        const { id } = req.params
        const order = await orderService.getById(id)
        res.json(order)
    } catch (err) {
        logger.error('Failed to get order', err)
        res.status(400).send({ err: 'Failed to get order' })
    }
}

export async function addOrder(req, res) {
    try {
        const order = req.body
        // potential like.. filtering. maybe
        
        const addedOrder = await orderService.add(order)
        res.json(addedOrder)
    } catch (err) {
        logger.error('Failed to add order', err)
        res.status(400).send({ err: 'Failed to add order' })
    }
}

export async function updateOrder(req, res) {
    try {
        const order = req.body
        const updatedOrder = await orderService.update(order)
        res.json(updatedOrder)
    } catch (err) {
        logger.error('Failed to update order', err)
        res.status(400).send({ err: 'Failed to update order' })
    }
}

export async function removeOrder(req, res) {
    try {
        const { id } = req.params
        await orderService.remove(id)
        res.send(id)
    } catch (err) {
        logger.error('Failed to remove order', err)
        res.status(400).send({ err: 'Failed to remove order' })
    }
}