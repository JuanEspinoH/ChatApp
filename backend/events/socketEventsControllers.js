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
          fromUser: true,
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
      messagesList = prisma.findMany(queryObject)
    } else {
      queryObject = {
        where: {
          channelId: query.channelId,
        },
        select: {
          id: true,
          fromUser: true,
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
      messagesList = prisma.findMany(queryObject)
    }

    const hasMore = messagesList.length > query.size
    if (hasMore) {
      messagesList.pop()
    }
    return {
      data: result.map((item) => ({
        id: item.id,
        channelId: item.channelId,
        from: item.fromUser,
        content: item.content,
      })),
      hasMore,
    }
  } catch (error) {
    console.log(e)
  }
}

export const ackMessage = async (userId, { channelId, messageId }) => {
  return async (payload, callback) => {
    if (typeof callback !== 'function') {
      return
    }
    console.log(payload, 'payload')

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
      console.log(req, 'req')
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
