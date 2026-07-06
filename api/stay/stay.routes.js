import express from 'express'
import { getStays, getStayById, addStay, updateStay, removeStay } from './stay.controller.js'

const router = express.Router()

router.get('/', getStays)
router.get('/:id', getStayById)
router.post('/', addStay)
router.put('/:id', updateStay)
router.delete('/:id', removeStay)

export const stayRoutes = router