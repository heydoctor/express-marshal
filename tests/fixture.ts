import Joi from 'joi';
import * as marshal from '../src';
import { Request, Response, NextFunction } from 'express';

const allRoutesMiddleware = (req: Request, _: Response, next: NextFunction) => {
  // @ts-ignore
  req.inControllerMiddleware = true;
  next();
};

const routeSpecificMiddleware = (req: Request, _: Response, next: NextFunction) => {
  // @ts-ignore
  req.inRouteMiddleware = true;
  next();
};

@marshal.controller('/', [allRoutesMiddleware])
export default class TestController {
  @marshal.param('param')
  preload(req: Request, res: Response, next: NextFunction, param: string) {
    // @ts-ignore
    req.marshalParam = param;
    next();
  }

  @marshal.get('/')
  index(req: Request, res: Response) {
    res.sendStatus(200);
  }

  @marshal.contentType('application/json')
  @marshal.post('/post')
  post(req: Request, res: Response) {
    res.json(req.body);
  }

  @marshal.route('get', '/route')
  route(req: Request, res: Response) {
    res.sendStatus(200);
  }

  @marshal.get('/route-parameter/:param')
  param(req: Request, res: Response) {
    res.json({
      // @ts-ignore
      param: req.marshalParam,
    });
  }

  @marshal.validate({
    name: Joi.string().required(),
  })
  @marshal.post('/validate-post')
  validate(req: Request, res: Response) {
    res.sendStatus(200);
  }

  @marshal.validate(
    Joi.object({
      include: Joi.array().required(),
    })
  )
  @marshal.get('/validate-get')
  validateGet(req: Request, res: Response) {
    res.sendStatus(200);
  }

  @marshal.get('/controller-middleware')
  controllerMiddlwareOne(req: Request, res: Response) {
    res.json({
      // @ts-ignore
      inControllerMiddleware: req.inControllerMiddleware || false,
      // @ts-ignore
      inRouteMiddleware: req.inRouteMiddleware || false,
    });
  }

  @marshal.get('/route-middleware', [routeSpecificMiddleware])
  controllerMiddlwareTwo(req: Request, res: Response) {
    res.json({
      // @ts-ignore
      inControllerMiddleware: req.inControllerMiddleware || false,
      // @ts-ignore
      inRouteMiddleware: req.inRouteMiddleware || false,
    });
  }
}
