import { findRoute } from "../../../../shared/utils.js";

export async function findRouteController(req, res) {
   //await connectneo4j()

  const { from, to } = req.query
  if (!from || !to) return res.status(400).json({ error: 'from and to are required' })

  try {
    const route = await findRoute(from.toUpperCase(), to.toUpperCase())
    if (!route) return res.status(404).json({ error: `No route found from ${from} to ${to}` })
    res.json(route)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}