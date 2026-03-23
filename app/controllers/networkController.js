const networkService = require('../services/networkService')

class NetworkController {
  async create(req, res, next) {
    try {
      const network = await networkService.create(req.user.id, req.body)
      res.status(201).json(network)
    } catch (error) {
      next(error)
    }
  }

  async findAll(req, res, next) {
    try {
      const networks = await networkService.findAllByUser(req.user.id)
      res.status(200).json(networks)
    } catch (error) {
      next(error)
    }
  }

  async findOne(req, res, next) {
    try {
      const network = await networkService.findById(req.params.id, req.user.id)
      res.status(200).json(network)
    } catch (error) {
      next(error)
    }
  }

  async update(req, res, next) {
    try {
      const network = await networkService.update(req.params.id, req.user.id, req.body)
      res.status(200).json(network)
    } catch (error) {
      next(error)
    }
  }

  async remove(req, res, next) {
    try {
      await networkService.remove(req.params.id, req.user.id)
      res.status(204).end()
    } catch (error) {
      next(error)
    }
  }
}

module.exports = new NetworkController()
