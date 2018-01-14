import Joi from 'joi';
import * as marshal from '../lib';

const allRoutesMiddleware = (req, res, next) => {
  req.inControllerMiddleware = true;
  next();
};

const routeSpecificMiddleware = (req, res, next) => {
  req.inRouteMiddleware = true;
  next();
};

@marshal.controller('', [allRoutesMiddleware])
export default class TestController {
  @marshal.param('param')
  preload(req, res, next, param) {
    req.param = param;
    next();
  }

  @marshal.get('/')
  index(req, res) {
    res.sendStatus(200);
  }

  @marshal.contentType('application/json')
  @marshal.post('/post')
  post(req, res) {
    res.json(req.body);
  }

  @marshal.route('get', '/route')
  route(req, res) {
    res.sendStatus(200);
  }

  @marshal.get('/route-parameter/:param')
  param(req, res) {
    res.json({
      param: req.param,
    });
  }

  @marshal.validate({
    name: Joi.string().required(),
  })
  @marshal.post('/validate-post')
  validate(req, res) {
    res.sendStatus(200);
  }

  @marshal.validate(
    Joi.object({
      include: Joi.array().required(),
    })
  )
  @marshal.get('/validate-get')
  validateGet(req, res) {
    res.sendStatus(200);
  }

  @marshal.get('/controller-middleware')
  controllerMiddlware(req, res) {
    res.json({
      inControllerMiddleware: req.inControllerMiddleware || false,
      inRouteMiddleware: req.inRouteMiddleware || false,
    });
  }

  @marshal.get('/route-middleware', [routeSpecificMiddleware])
  controllerMiddlware(req, res) {
    res.json({
      inControllerMiddleware: req.inControllerMiddleware || false,
      inRouteMiddleware: req.inRouteMiddleware || false,
    });
  }
}
