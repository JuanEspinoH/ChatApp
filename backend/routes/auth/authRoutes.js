import { Router } from 'express'
import { createUser, onError, onSuccess, logout } from './authControllers.js'
import passport from 'passport'
import prisma from '../../db/prismaClient.js'
// import { listChannelsDetails } from '../../events/socketEventsControllers.js'

const router = Router()

router.post('/create-user', createUser)
router.post('/login', passport.authenticate('json'), onSuccess, onError)
router.post('/logout', logout)
router.get('/self', async (req, res) => {
  if (req.user) {
    const checkUser = await prisma.user.findUnique({
      where: {
        id: req.user.id,
      },
      select: {
        id: true,
        email: true,
        user_name: true,
        is_online: true,
        last_ping: true,
      },
    })
    res.status(200).send(checkUser)
  } else {
    res.status(401).end()
  }
})
// router.get('/listDetails/:userId', async (req, res) => {
//   const { userId } = req.params

//   try {
//     const result = await listChannelsDetails(userId, {
//       orderBy: 'name:asc',
//       size: 100,
//     })
//     res.status(200).send(result)
//   } catch (error) {
//     console.log(error)
//     res.status(400).json({ err: 'err' })
//   }
// })

export default router
