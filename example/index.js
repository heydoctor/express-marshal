import express, { Router } from 'express';
import { mount, controller, param, validate, get, post } from '../lib';
import Joi from 'joi';

@controller('/artists')
class ArtistsController {
  @get('/')
  async getUsers(req, res) {
    throw new Error('catch this')
    res.json({
      data: [
        {
          name: 'Metallica'
        },
        {
          name: 'Black Sabbath'
        }
      ]
    });
  }
}

const app = express()
const router = new Router();
const port = process.env.PORT || 9999

mount(router, [ArtistsController]);

app.use(router);
app.listen(port, (err) => {
  if (err) {
    throw err;
  }

  console.log(`\n\tServer is running at http://localhost:${port}`)
});
