import supertest from 'supertest';
import express, { Router } from 'express';
import bodyParser from 'body-parser';
import TestController from './fixture';
import { mount, controller, prettyPath } from '../src';

const app = express();
const router = Router();
mount(router, [TestController]);
app.use(bodyParser.json());
app.use(router);
const server = supertest(app);

describe('utils', () => {
  test('prettyPath', () => {
    expect(prettyPath('/')).toEqual('/');
    expect(prettyPath('//dubz//')).toEqual('/dubz');
    expect(prettyPath('/trailz/')).toEqual('/trailz');
    expect(() => prettyPath('noleadingslash')).toThrowErrorMatchingSnapshot();
  });
});

describe('decorators', () => {
  test('mount', () => {
    const router = Router();
    mount(router, [TestController]);

    // hacky
    expect(router.stack[0].handle.stack.length).toEqual(8);
  });

  test('mount invalid controller', () => {
    class Invalid {}

    const router = Router();

    expect(() => mount(router, [Invalid])).toThrowErrorMatchingSnapshot();
  });

  test('@controller', () => {
    // @ts-ignore
    expect(TestController.__router).toBeDefined();
  });

  test('@controller without routes', () => {
    @controller('/')
    class NoRoutes {}

    // @ts-ignore
    expect(NoRoutes.__router).toBeDefined();
  });

  test('@controller without basepath', () => {
    expect(() => {
      // @ts-ignore
      @controller()
      class NoBasePath {}
    }).toThrowErrorMatchingSnapshot();
  });
});

describe('requests', () => {
  test('@param', async () => {
    const param = 'jambalaya';
    const res = await server.get(`/route-parameter/${param}`);

    expect(res.body.param).toEqual(param);
  });

  test('@route', async () => {
    await server.get(`/route`).expect(200);
  });

  test('@get', async () => {
    await server.get('/').expect(200);
  });

  test('@post', async () => {
    const res = await server
      .post('/post')
      .set('Content-Type', 'application/json')
      .send({
        name: 'Johnny Tsunami',
      })
      .expect(200);

    expect(res.body).toMatchSnapshot();
  });

  test('@validate post', async () => {
    await server
      .post('/validate-post')
      .send({})
      .expect(400);

    await server
      .post('/validate-post')
      .send({
        name: 'Hiyo',
      })
      .expect(200);
  });

  test('@validate get', async () => {
    const resFailure = await server.get('/validate-get').expect(400);

    const resSuccess = await server
      .get('/validate-get?include=[1,2,3]')
      .send({
        name: 'Hiyo',
      })
      .expect(200);
  });

  test('@contentType', async () => {
    await server
      .post('/post')
      .set('Content-Type', 'text/plain')
      .expect(400);

    await server
      .post('/post')
      .send({
        name: 'Hiyo',
      })
      .set('Content-Type', 'application/json')
      .expect(200);
  });

  test('middlewares', async () => {
    const controllerMwRes = await server.get('/controller-middleware');

    expect(controllerMwRes.body.inControllerMiddleware).toBeTruthy();
    expect(controllerMwRes.body.inRouteMiddleware).toBeFalsy();

    const routeMwRes = await server.get('/route-middleware');

    expect(routeMwRes.body.inControllerMiddleware).toBeTruthy();
    expect(routeMwRes.body.inRouteMiddleware).toBeTruthy();
  });
});
