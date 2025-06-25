import {
  fetchUserChannels,
  listChannels,
  listMessages,
  ackMessage,
  isUserInChannel,
  insertMessage,
  getUser,
} from './socketEventsControllers.js'
import { ajv } from '../utils/index.js'

const validateMessageSend = ajv.compile({
  type: 'object',
  properties: {
    content: { type: 'string', minLength: 1, maxLength: 5000 },
    channelId: { type: 'string', format: 'uuid' },
  },
  required: ['content', 'channelId'],
  additionalProperties: false,
})

const validateGetUser = ajv.compile({
  type: 'object',
  properties: {
    userId: { type: 'string', format: 'uuid' },
  },
  additionalProperties: false,
})
export const initEventHandlers = ({ io, prisma, config }) => {
  io.use(async (socket, next) => {
    socket.userId = socket.request.user.id

    let channels
    try {
      channels = await fetchUserChannels(socket.userId)
    } catch (e) {
      console.log(e)
      next(new Error('something went wrong fetching user channels'))
    }
    channels.forEach((channelId) => {
      socket.join(`channel:${channelId}`)
    })

    // socket.join(`user:${socket.userId}`)
    // socket.join(`session:${socket.request.session.id}`)
    next()
  })

  io.on('connection', async (socket) => {
    console.log('coneccion iniciada backend')

    // socket.on('channel:create', createChannel({ io, socket, prisma }))
    // socket.on('channel:join', joinChannel({ io, socket, prisma }))
    socket.on('channel:list', async (query, callback) => {
      try {
        const resultado = await listChannels(socket.userId, query)

        callback(resultado)
      } catch (error) {
        console.error('Error:', error)
      }
    })
    // socket.on('channel:search', searchChannels({ io, socket, prisma }))

    socket.on('user:get', async (query, callback) => {
      if (typeof callback !== 'function') {
        return
      }

      if (!validateGetUser(query)) {
        return callback({
          status: 'ERROR',
          errors: validate.errors,
        })
      }

      const user = await getUser(query.userId)

      if (user) {
        socket.join(`channel:${user.id}`)
        callback({
          status: 'OK',
          data: user,
        })
      } else {
        callback({
          status: 'ERROR',
        })
      }
    })
    // socket.on('user:reach', reachUser({ io, socket, prisma }))
    // socket.on('user:search', searchUsers({ io, socket, prisma }))

    socket.on('message:send', async (payload, callback) => {
      if (typeof callback !== 'function') {
        return
      }

      if (!validateMessageSend(payload)) {
        return callback({
          status: 'ERROR',
          errors: validateMessageSend.errors,
        })
      }

      const message = {
        from: socket.userId,
        channelId: payload.channelId,
        content: payload.content,
      }

      try {
        message.id = await insertMessage(message)
      } catch (error) {
        return callback({
          status: 'ERROR',
        })
      }

      socket.broadcast
        .to(`channel:${payload.channelId}`)
        .emit('message:sent', message)
      console.log({
        status: 'OK',
        data: {
          id: message.id,
        },
      })

      callback({
        status: 'OK',
        data: {
          id: message.id,
        },
      })
    })
    socket.on('message:list', async (query, callback) => {
      if (typeof callback !== 'function') {
        return
      }

      // if (!(await isUserInChannel(socket.userId, query.channelId))) {
      //   return callback({
      //     status: 'ERROR',
      //   })
      // }

      const res = await listMessages(query)

      callback({
        status: 'OK',
        data: res.data,
        hasMore: res.hasMore,
      })
    })
    socket.on('message:ack', async () => {
      ackMessage(data)
    })
    // socket.on('message:typing', typingMessage({ io, socket, prisma }))

    socket.on('disconnect', async () => {
      console.log('coneccion desconectada back')
      //   setTimeout(async () => {
      //     const sockets = await io.in(userRoom(socket.userId)).fetchSockets()
      //     const hasReconnected = sockets.length > 0
      //     if (!hasReconnected) {
      //       await db.setUserIsDisconnected(socket.userId)
      //       io.to(userStateRoom(socket.userId)).emit(
      //         'user:disconnected',
      //         socket.userId
      //       )
      //     }
      //   }, config.disconnectionGraceDelay ?? 10_000)
      //   const channels = await db.fetchUserChannels(socket.userId)
      //   channels.forEach((channelId) => {
      //     io.to(channelRoom(channelId)).emit('message:typing', {
      //       channelId,
      //       userId: socket.userId,
      //       isTyping: false,
      //     })
      //   })
    })

    // const wasOnline = await db.setUserIsConnected(socket.userId)

    // if (!wasOnline) {
    //   socket
    //     .to(userStateRoom(socket.userId))
    //     .emit('user:connected', socket.userId)
    // }
  })
}
