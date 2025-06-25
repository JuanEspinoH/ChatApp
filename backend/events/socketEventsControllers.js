import prisma from '../db/prismaClient.js'
import { ajv } from '../utils/index.js'

const ackMessageValidate = ajv.compile({
  type: 'object',
  properties: {
    channelId: { type: 'string', format: 'uuid' },
    messageId: { type: 'string' },
  },
  required: ['channelId', 'messageId'],
  additionalProperties: false,
})

export const fetchUserChannels = async (userId) => {
  const data = await prisma.userChannel.findMany({
    where: {
      userId,
    },
  })

  const result = data.map((elem) => elem.channelId)
  return result
}

export async function listChannels(
  userId,
  query = { orderBy: 'name:asc', size: 100 }
) {
  const channels = await prisma.channel.findMany({
    where: {
      userChannels: {
        some: {
          userId: userId,
        },
      },
    },
    include: {
      userChannels: true,
      messages: true,
    },
    orderBy: query.orderBy === 'name:asc' ? { name: 'asc' } : undefined,
    take: query.size + 1,
    skip: 0,
  })

  const formattedChannels = channels.map((channel) => {
    const { id, name, type } = channel
    return {
      id,
      name,
      type,
      users:
        channel.type === 'PUBLIC'
          ? []
          : channel.userChannels
              .filter((uc) => uc.userId !== userId)
              .map((uc) => uc.userId),
      userCount: channel.userChannels.length,
      unreadCount: channel.messages.filter(
        (m) =>
          !channel.userChannels.some(
            (uc) => uc.userId === userId && m.id <= (uc.clientOffset ?? 0)
          )
      ).length,
    }
  })

  const hasMore = formattedChannels.length > query.size

  if (hasMore) {
    formattedChannels.pop()
  }

  return {
    data: formattedChannels,
    hasMore,
  }
}

export const listMessages = async (query) => {
  try {
    let messagesList
    let queryObject
    if (query.orderBy === 'id:asc') {
      queryObject = {
        where: {
          channelId: query.channelId,
        },
        select: {
          id: true,
          fromUserId: true,
          content: true,
          channelId: true,
        },
        take: query.size + 1,
        orderBy: {
          id: 'asc',
        },
      }
      if (query.after) {
        queryObject = {
          ...queryObject,
          where: {
            channelId: query.channelId,
            id: {
              gt: query.after,
            },
          },
        }
      }

      messagesList = await prisma.message.findMany(queryObject)
    } else {
      queryObject = {
        where: {
          channelId: query.channelId,
        },
        select: {
          id: true,
          fromUserId: true,
          content: true,
          channelId: true,
        },
        take: query.size + 1,
        orderBy: {
          id: 'desc',
        },
      }
      if (query.after) {
        queryObject = {
          ...queryObject,
          where: {
            channelId: query.channelId,
            id: {
              lt: query.after,
            },
          },
        }
      }
      messagesList = await prisma.message.findMany(queryObject)
    }

    const hasMore = messagesList.length > query.size
    if (hasMore) {
      messagesList.pop()
    }

    return {
      data: messagesList.map((item) => ({
        id: item.id,
        channelId: item.channelId,
        from: item.fromUserId,
        content: item.content,
      })),
      hasMore,
    }
  } catch (error) {
    console.log(error)
  }
}

export const ackMessage = async (userId, { channelId, messageId }) => {
  return async (payload, callback) => {
    if (typeof callback !== 'function') {
      return
    }

    if (!ackMessageValidate(payload)) {
      return callback({
        status: 'ERROR',
        errors: 'validate.errors',
      })
    }
    try {
      const req = await req.prisma.userChannel.update({
        where: {
          userId_channelId: {
            userId,
            channelId,
          },
        },
        data: {
          clientOffset: messageId,
        },
      })
    } catch (error) {
      return callback({
        status: 'ERROR',
      })
    }
    return callback({
      status: 'OK',
    })
  }
}

export const isUserInChannel = async (userId, channelId) => {
  const result = await prisma.channel.findUnique({
    where: { id: channelId },
    select: {
      userChannels: {
        where: { userId },
        select: { userId: true },
        take: 1,
      },
    },
  })

  return result.userChannels.length === 1
}

export const insertMessage = async (message) => {
  const newMessage = await prisma.message.create({
    data: {
      fromUserId: message.from,
      channelId: message.channelId,
      content: message.content,
    },
  })

  await prisma.userChannel.update({
    where: {
      userId_channelId: {
        userId: message.from,
        channelId: message.channelId,
      },
    },
    data: {
      clientOffset: newMessage.id,
    },
  })

  return newMessage.id
}

export const getUser = async (userId) => {
  const result = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      id: true,
      user_name: true,
      is_online: true,
    },
  })
  console.log(result)

  // if(result){
  //   return {
  //     id
  //   }
  // }

  return undefined
}
