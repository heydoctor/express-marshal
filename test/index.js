import test from 'ava';
import supertest from 'supertest';
import express, { Router } from 'express';
import bodyParser from 'body-parser';
import TestController from './fixture';
import { mount, controller } from '../lib';
import { prettyPath } from '../lib/utils';

test.beforeEach(t => {
  const app = express();
  const router = new Router();
  mount(router, [TestController]);
  app.use(bodyParser.json());
  app.use(router);
  t.context.server = supertest(app);
});

test('prettyPath', t => {
  t.is(prettyPath('/'), '/');
  t.is(prettyPath('//dubz//'), '/dubz');
  t.is(prettyPath('/trailz/'), '/trailz');
  const error = t.throws(() => {
    prettyPath('noleadingslash');
  });
  t.snapshot(error.message);
});

test('mount', t => {
  const router = new Router();
  mount(router, [TestController]);

  // hacky
  t.is(router.stack[0].handle.stack.length, 8);
});

test('mount invalid controller', t => {
  class Invalid {}

  const router = new Router();
  const error = t.throws(() => {
    mount(router, [Invalid]);
  });
  t.snapshot(error.message);
});

test('@controller', t => {
  t.truthy(TestController.__router);
});

test('@controller without routes', t => {
  @controller('/')
  class NoRoutes {}

  t.truthy(NoRoutes.__router);
});

test('@controller without basepath', t => {
  const error = t.throws(() => {
    @controller()
    class NoBasePath {}
  });
  t.snapshot(error.message);
});

test('@param', async t => {
  const param = 'jambalaya';
  const res = await t.context.server.get(`/route-parameter/${param}`);

  t.is(res.body.param, param);
});

test('@route', async t => {
  const res = await t.context.server.get(`/route`).expect(200);
  t.pass();
});

test('@get', async t => {
  const res = await t.context.server.get('/').expect(200);
  t.pass();
});

test('@post', async t => {
  const res = await t.context.server
    .post('/post')
    .set('Content-Type', 'application/json')
    .send({
      name: 'Johnny Tsunami',
    })
    .expect(200);

  t.snapshot(res.body);
});

test('@validate post', async t => {
  const resFailure = await t.context.server
    .post('/validate-post')
    .send({})
    .expect(400);

  t.is(resFailure.status, 400);

  const resSuccess = await t.context.server
    .post('/validate-post')
    .send({
      name: 'Hiyo',
    })
    .expect(200);

  t.is(resSuccess.status, 200);
});

test('@validate get', async t => {
  const resFailure = await t.context.server.get('/validate-get');

  t.is(resFailure.status, 400);

  const resSuccess = await t.context.server
    .get('/validate-get?include=[1,2,3]')
    .send({
      name: 'Hiyo',
    });

  t.is(resSuccess.status, 200);
});

test('@contentType', async t => {
  const resWrongContentType = await t.context.server
    .post('/post')
    .set('Content-Type', 'text/plain')
    .expect(400);

  t.is(resWrongContentType.status, 400);

  const resWithContentType = await t.context.server
    .post('/post')
    .send({
      name: 'Hiyo',
    })
    .set('Content-Type', 'application/json')
    .expect(200);

  t.is(resWithContentType.status, 200);
});

test('middlewares', async t => {
  const controllerMwRes = await t.context.server.get('/controller-middleware');

  t.truthy(controllerMwRes.body.inControllerMiddleware);
  t.falsy(controllerMwRes.body.inRouteMiddleware);

  const routeMwRes = await t.context.server.get('/route-middleware');

  t.truthy(routeMwRes.body.inControllerMiddleware);
  t.truthy(routeMwRes.body.inRouteMiddleware);
});
