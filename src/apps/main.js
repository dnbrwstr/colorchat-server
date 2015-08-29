import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import authApp from './auth';
import matchApp from './match';
import logError from '../lib/logError';
import { RequestError } from '../lib/errors';

let app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(cors());
}

app.use(morgan('dev'));

app.use(bodyParser.json());

app.use('/auth', authApp);
app.use('/match', matchApp)

app.use(function (err, req, res, next) {
  logError(err);
  res.status(err.status || 500).send(err.message || 'Something bad happened');
});

export default app;