import express from 'express'
import { login, signup, logout } from './auth.controller.js'
import { authService } from './auth.service.js'

const router = express.Router()

router.get('/check', (req, res) => {
    try {
        const token = req.cookies.loginToken
        if (!token) return res.json(null)

        const loggedinUser = authService.validateToken(token) 
        if (!loggedinUser) return res.json(null)
        
        res.json(loggedinUser)
    } catch (err) {
        res.json(null) 
    }
})

router.post('/login', login)
router.post('/signup', signup)
router.post('/logout', logout)

export const authRoutes = router