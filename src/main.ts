// Node Core Modules
import path from 'path';
import fs from 'fs';
// Third Party Packages
import express from 'express';
import bodyParser from 'body-parser';
import morgan from 'morgan';
// app types
import { CustomError } from './types';
// app modules
import systemdRoutes from './routes/systemd';

const SERVER_PORT = process.env.SERVER_PORT || 3000;

const app = express();

const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flags: 'a' }
);

app.use(morgan('combined', { stream: accessLogStream }));

app.use(bodyParser.json());

app.use((_req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, PATCH, DELETE, OPTIONS'
  );
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  // res.setHeader('Access-Control-Allow-Private-Network', '*');
  next();
});

app.use('/api/systemd', systemdRoutes);

app.use(express.static(path.join(__dirname, 'frontend', 'build')));
app.use('*', (_req, res, _next) => {
  res.sendFile(path.join(__dirname, 'frontend', 'build', 'index.html'));
});


app.use(
  (
    error: CustomError,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    console.log(`[${error.stacktracePath}]: `, error);
    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;

    res.status(status).json({
      errors: [
        {
          message,
          data,
          status,
        },
      ],
    });
  }
);


console.log("Process running with id: ", process.getuid());
console.log("Process running with uid: ", process.geteuid());
process.setuid(0);
process.seteuid(0);

app.listen(SERVER_PORT);
console.log(
  'Server running and listening on port: http://localhost:' + SERVER_PORT
);
