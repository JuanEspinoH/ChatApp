import {
  fetchUserChannels,
  listChannels,
  listMessages,
  ackMessage,
} from './socketEventsControllers.js'

export const initEventHandlers = ({ io, prisma, config }) => {
  io.use(async (socket, next) => {
    socket.userId = socket.request.user.id

    let channels
    try {
      channels = await fetchUserChannels(socket.userId)
      console.log(channels)
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
        // procesar resultado aquí
        callback(resultado)
      } catch (error) {
        console.error('Error:', error)
      }
    })
    // socket.on('channel:search', searchChannels({ io, socket, prisma }))

    // socket.on('user:get', getUser({ io, socket, prisma }))
    // socket.on('user:reach', reachUser({ io, socket, prisma }))
    // socket.on('user:search', searchUsers({ io, socket, prisma }))

    // socket.on('message:send', sendMessage({ io, socket, prisma }))
    socket.on('message:list', async (data, callback) => {
      listMessages(data)
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
