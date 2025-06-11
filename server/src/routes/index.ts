import { Router } from 'express'
import v1Routes from './v1/index.js'

const router = Router()

/**
 * API Version routing
 * Routes requests to appropriate API version
 */

// Route v1 API requests
router.use('/v1', v1Routes)

// Default to v1 for backward compatibility (no version specified)
router.use('/', v1Routes)

export default router 