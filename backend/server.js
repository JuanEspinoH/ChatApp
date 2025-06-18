import express from 'express'
import cors from 'cors'
import routes from './routes/index.js'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import { sessionMiddleware } from './authUtils/index.js'
import { setupPassport } from './authUtils/index.js'
import { initEventHandlers } from './events/socketEvents.js'
import prisma from './db/prismaClient.js'

const app = express()
const httpServer = createServer(app)
const forceSameSiteLax = (req, res, next) => {
  if (req.session && req.session.cookie) {
    req.session.cookie.sameSite = 'lax'
    req.session.cookie.secure = false
    req.session.save() // Forzar guardar los cambios
  }
  next()
}

// Usar después de sessionMiddleware
app.use(forceSameSiteLax)

app.set('x-powered-by', false)
app.use(express.urlencoded({ extended: true }))
app.use(express.json())
app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  })
)
export const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true,
  },
})

sessionMiddleware({ app, io, prisma })
setupPassport({ app, io, prisma })
initEventHandlers({ io, prisma })

app.use('/api', routes)

httpServer.listen(3000, () => {
  console.log('server listening at http://localhost:3000')
})
