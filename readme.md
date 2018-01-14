# express-marshal

[![npm version](https://badge.fury.io/js/express-marshal.svg)](http://badge.fury.io/js/express-marshal)
[![Build Status](https://travis-ci.org/kylealwyn/express-marshal.svg?branch=master)](https://travis-ci.org/kylealwyn/express-marshal)
[![Coverage Status](https://coveralls.io/repos/kylealwyn/express-marshal/badge.svg?branch=master&service=github)](https://coveralls.io/github/kylealwyn/express-marshal?branch=master)

A suite of decorators built to wire up [express](https://github.com/expressjs/express) controllers


## Install

```
$ npm install express express-marshal
```

Make sure you have decorators enabled through [babel](https://github.com/babel/babel):

```
$ npm install --save-dev babel-plugin-transform-decorators-legacy
```

Add the plugin to your .babelrc:
```
{
  "plugins": ["transform-decorators-legacy"]
}
```

## Example

```js

import express, { Router } from 'express'
import { mount, controller, param, validate, get, post } from 'express-marshal';
import Joi from 'joi';

@controller('/users')
class UserController {

  // Add route parameters
  @param('id')
  preloadUser(req, res, next, id) {
    const user = UserService.find({ id });

    if (!user) {
      res.sendStatus(404);
      return;
    }

    req.user = user;
    next();
  }

  // Add route-specific middleware
  @get('/', [authenticator])
  getUsers(req, res) {
    res.json({ users: [] });
  }

  // Use the previously specified param
  @get('/:id')
  getUser(req, res) {
    res.json({
      user: req.user
    });
  }

  // Validate user paylaods with Joi
  @validate({
    email: Joi.string().required(),
    password: Joi.string().required()
  })
  @post('/')
  createUser(req, res) {
    res.json({ users: [] });
  }
}

const app = express()
const router = new Router();
mount(router, [UserController]);
app.use(router);
app.listen(process.env.PORT || 3000);
```

## API

### `mount(router, [controllers])`

* #### `router: Express#Router`

  An Express router

* #### `controllers: Array`

  Array of decorated controllers

```js
import express, { Router } from 'express';
import { mount } from 'express-marshal';

const app = express()
const router = new Router();
mount(router, [UserController]);
app.use(router);
app.listen(3000);
```

---

### `@controller(basepath, middleware)`

* ##### `basepath: String`

  The basepath will be prepended to all controller routes

* ##### `middleware: Array` *optional*

  Middleware to be run for every route on the controller

```js
import { controller, get } from 'express-marshal';

@controller('/example')
export default class ExampleController {
  ...
}
```
---

### `@route(method, path, middleware)`

* ##### `method: String`

  The desired HTTP method (get, post, etc.)

* ##### `path: String`

  The endpoint to be appended to the parent controller's basepath

* ##### `middleware: Array` *optional*

  Array of middleware only to be run for this route

##### Route Aliases

* `@get(path, middleware)`
* `@post(path, middleware)`
* `@put(path, middleware)`
* `@patch(path, middleware)`
* `@delete(path, middleware)`

These are less verbose aliases for `@route(method, path)` so you can use `@get('/revoke')` instead of `@route('get', '/revoke')`.

```js
import { controller, get } from 'express-marshal';

@controller('/docs')
export default class DocsController {
  @get('/')
  index() {
    ...
  }
}
```
---

### `@validate(schema)`

* ##### `schema: Object|Joi`

  A generic object containing Joi properties or a preconfigured [Joi](https://github.com/hapijs/joi) schema to validate an incoming payload against. A generic object will be converted to a Joi schema upon validation. A `GET` request will validate the `req.query` object while a `POST` request will validate the `req.query` object. Returns a 400 along with the Joi error if payload is invalid.

```js
import { controller, validate, post } from 'express-marshal';
import Joi from 'joi';

@controller('/users')
export default class UsersController {
  @validate({
    username: Joi.string().required()
  })
  @post('/')
  createUser() {
    ...
  }
}
```

## Inspiration

* https://github.com/stewartml/express-decorators
* https://github.com/knownasilya/hapi-decorators
* https://github.com/serhiisol/node-decorators/tree/master/express

## License

MIT © [Kyle Alwyn](https://kylealwyn.com)
