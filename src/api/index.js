import express from 'express';
import ev from 'express-validation';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import authApp from './auth';
import matchApp from './match';
import accountApp from './account';
import logError from '../lib/logError';
import { RequestError } from '../lib/errors';

let app = express();

if (process.env.NODE_ENV === 'development') {
  app.use(cors());
}

app.use(morgan('dev'));
app.use(bodyParser.json());

app.use('/auth', authApp);
app.use('/match', matchApp);
app.use('/account', accountApp);

app.use(function (err, req, res, next) {
  if (err instanceof ev.ValidationError) {
    let message = err.errors.map(e => e.messages.join("\n")).join("\n");
    let error = new RequestError(message)
    next(error);
  } else {
    next(err);
  }
});

app.use(function (err, req, res, next) {
  logError(err);
  res.status(err.status || 500).send(err.message || 'Something bad happened');
});

export default app;
