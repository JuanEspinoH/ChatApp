import { ajv, formatUser, sessionRoom } from '../../utils/index.js'
import prisma from '../../db/prismaClient.js'
import argon2 from 'argon2'
import { io } from '../../server.js'

const validate = ajv.compile({
  type: 'object',
  properties: {
    user_name: { type: 'string', minLength: 2, maxLength: 32 },
    email: { type: 'string', minLength: 8, maxLength: 100 },
    password: { type: 'string', minLength: 8, maxLength: 100 },
  },
  required: ['user_name', 'password', 'email'],
  additionalProperties: false,
})
const passwordSchema = {
  type: 'object',
  properties: {
    password: {
      type: 'string',
      minLength: 8,
      pattern: '^(?=.*d)[a-zA-Z0-9]{8}$',
    },
  },
  required: ['password'],
  additionalProperties: false,
}

const validatePasswordFormat = ajv.compile(passwordSchema)

export const createUser = async (req, res) => {
  try {
    if (!validate(req.body)) {
      return res.status(400).send({
        message: 'invalid payload',
        errors: validate.errors,
      })
    }

    const formData = req.body
    const user_name = formData.user_name
    const email = formData.email
    const password = formData.password

    const checkEmail = await prisma.user.findUnique({
      where: {
        email,
      },
    })

    if (!!checkEmail == true) {
      return res.status(500).json({
        msg: 'Email already registered.',
      })
    }

    const checkUserName = await prisma.user.findUnique({
      where: {
        user_name,
      },
    })

    if (!!checkUserName == true) {
      return res.status(500).json({
        msg: 'User name already in use.',
      })
    }

    // const isValid = validatePasswordFormat({ password: userData.password })
    // if (!isValid) {
    //   return res.status(500).json({
    //     msg: 'Wrong password format.',
    //   })
    // }

    const hashedPassword = await argon2.hash(password)

    const newUser = await prisma.user.create({
      data: {
        email,
        user_name,
        password: hashedPassword,
      },
    })

    return res.status(201).json({
      msg: `User created`,
      data: formatUser(newUser),
    })
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      msg: 'Error',
    })
  }
}

export const onSuccess = (req, res) => {
  res.status(200).send(req.user)
}

export const onError = (_err, _req, res, _next) => {
  console.error('Error de autenticación:', _err)
  console.log('Datos del request:', _req.body)
  res.status(400).send({
    message: 'invalid credentials',
    error: _err.message,
  })
}

export const logout = async (req, res, next) => {
  const sessionId = req.session.id

  req.logout((err) => {
    if (err) {
      return next(err)
    }

    io.in(`${sessionId}`).disconnectSockets()

    res.status(204).end()
  })
}
