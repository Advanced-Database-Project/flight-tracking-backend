import express from 'express'
import env from '../../../shared/env.js'
import connectneo4j from '../../../shared/neo4j.js'
import routeRoutes from './routes/routeRoutes.js'

const app = express()

await connectneo4j()
app.use('/routes', routeRoutes)

app.listen(env.ROUTE_FINDER_SERVICE_PORT, () => 
  console.log(`Route Finder running on port ${env.ROUTE_FINDER_SERVICE_PORT}`)
)