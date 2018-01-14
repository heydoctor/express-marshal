const Joi = require('joi');
const { Router } = require('express');

module.exports.mount = (router, controllers) => {
	controllers.forEach((ctrl) => {
		if (!ctrl.__router) {
			throw new Error(
				`${
					ctrl.constructor.name
				} requires a router property. Ensure you have decorated your class with @controller`,
			);
		}

		router.use(ctrl.__router);
	});
};

module.exports.controller = (basepath = '', middleware) => {
	return (target, key, descriptor) => {
		const router = new Router();

		if (target.__params) {
			target.__params.forEach(({ id, handler }) => {
				router.param(id, handler);
			});
		}

		if (middleware) {
			middleware.forEach((mw) => {
				router.use(mw);
			});
		}

		if (target.__routes) {
			target.__routes.forEach((route) => {
				router[route.method](
					basepath + route.path,
					...route.middleware,
					target.prototype[route.key],
				);
			});
		}

		target.__router = router;
	};
};

module.exports.contentType = (contentType) => {
	return (target, key, descriptor) => {
		let fn = descriptor.value;

		descriptor.value = (req, res, ...rest) => {
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

module.exports.validate = (schema) => {
	return (target, key, descriptor) => {
		let fn = descriptor.value;

		descriptor.value = (req, res, ...rest) => {
			const payload = req.method === 'GET' ? req.query : req.body;

			try {
				Joi.assert(payload, schema.isJoi ? schema : Joi.object(schema));

				return fn.apply(target, [req, res, ...rest]);
			} catch (err) {
				res.status(400).json(err.details);
			}
		};
	};
};

module.exports.param = (id) => {
	return (target, key, descriptor) => {
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

const route = (method, path, middleware = []) => {
	return (target, key, descriptor) => {
		const routes = target.constructor.__routes || [];

		target.constructor.__routes = [
			...routes,
			{
				method,
				path,
				middleware,
				key,
			},
		];
	};
};
module.exports.route = route;

const routeFactory = (method) => (...args) => route(method, ...args);

module.exports.get = routeFactory('get');
module.exports.post = routeFactory('post');
module.exports.put = routeFactory('put');
module.exports.patch = routeFactory('patch');
module.exports.head = routeFactory('head');
module.exports.del = routeFactory('delete');
