const memberService = require('../services/memberService')

class MemberController {
  async findAll(req, res, next) {
    try {
      const members = await memberService.findAll(req.params.id)
      res.status(200).json(members)
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const member = await memberService.update(
        req.params.id,
        req.params.memberId,
        req.user.id,
        req.body
      )
      res.status(200).json(member)
    } catch (error) {
      next(error)
    }
  }

  async remove(req, res, next) {
    try {
      await memberService.remove(req.params.id, req.params.memberId, req.user.id)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new MemberController()
