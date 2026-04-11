const invitationService = require('../services/invitationService')

class InvitationController {
  async findAll(req, res, next) {
    try {
      const { email } = req.user
      const invitations = await invitationService.findAllByUserEmail(email)
      res.status(200).json(invitations)
    } catch (error) {
      next(error)
    }
  }

  async create(req, res, next) {
    try {
      const invitation = await invitationService.create(req.params.id, req.user.id, req.body)
      res.status(201).json(invitation)
    } catch (error) {
      next(error)
    }
  }

  async findByToken(req, res, next) {
    try {
      const invitation = await invitationService.findByToken(req.params.token)
      res.status(200).json(invitation)
    } catch (error) {
      next(error)
    }
  }

  async accept(req, res, next) {
    try {
      const member = await invitationService.accept(req.params.token, req.user.id)
      res.status(201).json(member)
    } catch (error) {
      next(error)
    }
  }

  async reject(req, res, next) {
    try {
      await invitationService.reject(req.params.token)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }

  async cancel(req, res, next) {
    try {
      await invitationService.cancel(req.params.id, req.user.id)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new InvitationController()
