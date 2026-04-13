import express from 'express'
import { fileURLToPath } from 'url'
import path from 'path'
import { initDb } from './db.js'
import colorsRouter from './routes/colors.js'
import pigmentsRouter from './routes/pigments.js'
import plannerRouter from './routes/planner.js'

const app = express()
app.use(express.json())

app.use('/api/colors', colorsRouter)
app.use('/api/pigments', pigmentsRouter)
app.use('/api/planner', plannerRouter)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')))

initDb()
const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Masterpaint listening on :${PORT}`))
