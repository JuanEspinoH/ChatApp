import session from 'express-session'
import { PrismaSessionStore } from '@quixo3/prisma-session-store'
import argon2 from 'argon2'
import passport from 'passport'
import { Strategy as JsonStrategy } from 'passport-json'

const _30_DAYS = 30 * 24 * 60 * 60 * 1000

export const sessionMiddleware = ({ app, io, prisma }) => {
  const sessionMiddleware = session({
    name: 'sid',
    secret: process.env.SECRETS,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: _30_DAYS,
      sameSite: 'lax',
      secure: false,
      rolling: true,
    },
    store: new PrismaSessionStore(prisma, {
      checkPeriod: 2 * 60 * 1000, // Limpiar sesiones expiradas cada 2 minutos
      dbRecordIdIsSessionId: true,
    }),
  })

  app.use(sessionMiddleware)
  io.engine.use(sessionMiddleware)
}

export const setupPassport = ({ app, io, prisma }) => {
  passport.use(
    new JsonStrategy(
      { usernameProp: 'email', passwordProp: 'password' },
      async (email, password, done) => {
        try {
          const user = await prisma.user.findFirst({
            where: {
              email,
            },
          })

          if (!user) {
            return done(new Error('invalid credentials 1'))
          }

          const isPasswordValid = await argon2.verify(user.password, password)

          if (!isPasswordValid) {
            return done(new Error('invalid credentials 2'))
          }

          const userData = {
            // id: user.id,
            data: user,
          }
          return done(null, user)
        } catch (error) {
          return done(error)
        }
      }
    )
  )

  passport.serializeUser((user, cb) => {
    cb(null, {
      id: user.id,
      data: user,
    })
  })

  passport.deserializeUser((user, cb) => {
    cb(null, user)
  })

  app.use(passport.initialize())
  app.use(passport.session())

  io.engine.use(passport.initialize())
  io.engine.use(passport.session())

  io.engine.use((req, res, next) => {
    if (req.user) {
      next()
    } else {
      res.writeHead(401)
      res.end()
    }
  })
}
