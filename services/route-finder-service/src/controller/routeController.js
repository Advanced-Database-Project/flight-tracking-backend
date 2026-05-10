import { findRoute } from "../../../../shared/utils.js";

export async function findRouteController(req, res) {
  const { source, destination } = req.query  

  if (!source || !destination) return res.status(400).json({ status: 400, message: 'source and destination are required' })

  try {
    const routes = await findRoute(source.toUpperCase(), destination.toUpperCase())
    if (!routes) return res.status(404).json({status: 404, message: `No route found from ${source} to ${destination}` })
    res.status(200).json({ status: 200,
    message: `Successfully found route from ${source} to ${destination}`,data :{ source, destination, routes }})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}