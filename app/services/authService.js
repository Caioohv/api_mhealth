const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { OAuth2Client } = require('google-auth-library')
const prisma = require('../config/prisma')

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

class AuthService {
  async register(userData) {
    const { email, password, name, phone } = userData

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      const error = new Error('User already exists')
      error.statusCode = 409
      throw error
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        phone,
      },
    })

    return this.generateTokens(user)
  }

  async login(email, password) {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      const error = new Error('Invalid credentials')
      error.statusCode = 401
      throw error
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials')
      error.statusCode = 401
      throw error
    }

    return this.generateTokens(user)
  }

  async googleLogin(idToken) {
    const validAudiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID,
      process.env.GOOGLE_IOS_CLIENT_ID,
    ].filter(Boolean)

    const ticket = await client.verifyIdToken({
      idToken,
      audience: validAudiences.length === 1 ? validAudiences[0] : validAudiences,
    })
    const payload = ticket.getPayload()
    const { sub: googleId, email, name } = payload

    let user = await prisma.user.findUnique({ where: { googleId } })

    if (!user) {
      user = await prisma.user.findUnique({ where: { email } })
      if (user) {
        user = await prisma.user.update({
          where: { email },
          data: { googleId },
        })
      } else {
        user = await prisma.user.create({
          data: {
            email,
            googleId,
            name,
          },
        })
      }
    }

    return this.generateTokens(user)
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    )
    const refreshToken = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    )

    return { accessToken, refreshToken, user: { id: user.id, email: user.email, name: user.name } }
  }

  async verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET)
  }
}

module.exports = new AuthService()
