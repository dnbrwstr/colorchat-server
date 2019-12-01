import express from 'express';
import {errors} from 'celebrate';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import authApp from './auth';
import matchApp from './match';
import accountApp from './account';
import userApp from './user';
import logError from '../lib/logError';

let app = express();
app.disable('x-powered-by')

if (process.env.NODE_ENV === 'development') {
  app.use(cors());
}

app.use(morgan('dev'));
app.use(bodyParser.json());

app.use('/auth', authApp);
app.use('/match', matchApp);
app.use('/account', accountApp);
app.use('/user', userApp);
// Catch celebrate validation errors
app.use(errors());

app.use(function (err, req, res, next) {
  logError(err);
  res.status(err.status || 500).send(err.message || 'Something bad happened');
});

app.use(function (req, res, next) {
  res.status(404).send("Hi :^)<br><br>There's nothing here :^(");
});

export default app;
