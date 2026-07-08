import express from 'express'
import { getStays, getStayById, addStay, updateStay, removeStay, toggleLike  } from './stay.controller.js'
import { requireAuth } from '../../middlewares/requireAuth.middleware.js'


const router = express.Router()
router.post('/:id/like', requireAuth, toggleLike)
router.delete('/:id/like', requireAuth, toggleLike)

router.get('/', getStays)
router.get('/:id', getStayById)
router.post('/', addStay)
router.put('/:id', updateStay)
router.delete('/:id', removeStay)

export const stayRoutes = router