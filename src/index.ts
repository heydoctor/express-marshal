import * as Joi from 'joi';
import { Router, Request, Response, NextFunction } from 'express';

interface Route {
  method:
    | 'all'
    | 'get'
    | 'post'
    | 'put'
    | 'delete'
    | 'patch'
    | 'options'
    | 'head';
  path: string;
  key: string;
  middleware: any[];
}

interface Param {
  id: string;
  handler: (...args: any[]) => any;
}

export const prettyPath = (path: string) => {
  if (path[0] !== '/') {
    throw new Error(`Path \`${path}\` must begin with a slash.`);
  }

  if (path === '/') {
    return path;
  }

  return path.replace(/\/*/, '/').replace(/\/*$/, '');
};

export const mount = (router: Router, controllers: any[]) => {
  controllers.forEach(ctrl => {
    if (!ctrl.__router) {
      throw new Error(
        `${ctrl.name} requires a router property. Make sure you decorated your class with @controller(basepath)`
      );
    }

    router.use(ctrl.__router);
  });
};

export const controller = (basepath: string, middleware: any[] = []) => {
  return (target: any) => {
    if (!basepath) {
      throw new Error(
        `@controller declaration for \`${target.name}\` is missing a basepath.`
      );
    }

    const router = Router();

    if (target.__params) {
      target.__params.forEach(({ id, handler }: Param) => {
        router.param(id, (req, res, next, ...rest) => {
          Promise.resolve(handler.call(target, req, res, next, ...rest)).catch(
            next
          );
        });
      });
    }

    if (target.__routes) {
      target.__routes.forEach((route: Route) => {
        const handler = target.prototype[route.key];

        router[route.method](
          prettyPath(basepath + route.path),
          ...middleware,
          ...route.middleware,
          (req: Request, res: Response, next: NextFunction) => {
            Promise.resolve(handler.call(target, req, res, next)).catch(next);
          }
        );
      });
    }

    target.__router = router;
  };
};

export const contentType = (contentType: string) => {
  return (target: any, _: string, descriptor: PropertyDescriptor) => {
    let fn = descriptor.value;

    descriptor.value = (req: Request, res: Response, ...rest: any[]) => {
      if (!req.is(contentType)) {
        res
          .status(400)
          .json({ message: `Route requires Content-Type: ${contentType}` });
        return;
      }

      return fn.apply(target, [req, res, ...rest]);
    };
  };
};

export const validate = (schema: Joi.JoiObject | Joi.SchemaMap) => {
  return (target: any, _: string, descriptor: PropertyDescriptor) => {
    let fn = descriptor.value;

    descriptor.value = (req: Request, res: Response, ...rest: any[]) => {
      const payload = req.method === 'GET' ? req.query : req.body;

      try {
        Joi.assert(
          payload,
          schema.isJoi ? schema : Joi.object(schema as Joi.SchemaMap)
        );

        return fn.apply(target, [req, res, ...rest]);
      } catch (err) {
        res.status(400).json(err.details);
      }
    };
  };
};

export const param = (id: string) => {
  return (target: any, _: string, descriptor: PropertyDescriptor) => {
    const params = target.constructor.__params || [];

    target.constructor.__params = [
      ...params,
      {
        id,
        handler: descriptor.value,
      },
    ];
  };
};

export const route = (method: string, path: string, middleware: any[] = []) => {
  return (target: any, key: string) => {
    const routes = target.constructor.__routes || [];

    target.constructor.__routes = [
      ...routes,
      {
        method,
        path: prettyPath(path),
        middleware: middleware,
        key,
      },
    ];
  };
};

const routeFactory = (method: string) => (path: string, middleware?: any[]) =>
  route(method, path, middleware);

export const get = routeFactory('get');
export const post = routeFactory('post');
export const put = routeFactory('put');
export const patch = routeFactory('patch');
export const head = routeFactory('head');
export const del = routeFactory('delete');
