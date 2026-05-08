import { findRoute } from "../../../../shared/utils.js";

export async function findRouteController(req, res) {
  const { from, to } = req.query
  if (!from || !to) return res.status(400).json({ status: 400, message: 'from and to are required' })

  try {
    const routes = await findRoute(from.toUpperCase(), to.toUpperCase())
    if (!routes) return res.status(404).json({status: 404, message: `No route found from ${from} to ${to}` })
    res.status(200).json({ status: 200,
    message: `Successfully found route from ${from} to ${to}`,data :{ from, to, routes }})
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}