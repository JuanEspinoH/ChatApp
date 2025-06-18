import Ajv from 'ajv'
import addFormats from 'ajv-formats'

const ajv = new Ajv({
  useDefaults: true,
})
addFormats(ajv)

const formatUser = (user) => {
  return {
    msg: user.msg,
    data: {
      id: user.id,
      email: user.email,
      user_name: user.user_name,
      is_online: user.is_online,
      last_ping: user.last_ping,
    },
  }
}

const sessionRoom = (sessionId) => {
  return `session:${sessionId}`
}

export { ajv, formatUser, sessionRoom }
