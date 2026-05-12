import express from 'express'
import { findRouteController } from '../controller/routeController.js'

const router = express.Router()
router.get('/', findRouteController)

export default router