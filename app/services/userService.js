const prisma = require('../config/prisma')

const USER_SELECT = {
  id: true,
  email: true,
  name: true,
  phone: true,
  createdAt: true,
  updatedAt: true,
}

class UserService {
  async getProfile(userId) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: USER_SELECT,
    })

    if (!user) {
      const error = new Error('User not found')
      error.statusCode = 404
      throw error
    }

    return user
  }

  async updateProfile(userId, data) {
    const { name, phone } = data

    if (phone) {
      const existing = await prisma.user.findUnique({ where: { phone } })
      if (existing && existing.id !== userId) {
        const error = new Error('Phone number already in use')
        error.statusCode = 409
        throw error
      }
    }

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (phone !== undefined) updateData.phone = phone

    if (Object.keys(updateData).length === 0) {
      const error = new Error('No valid fields to update')
      error.statusCode = 400
      throw error
    }

    return prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: USER_SELECT,
    })
  }
}

module.exports = new UserService()
