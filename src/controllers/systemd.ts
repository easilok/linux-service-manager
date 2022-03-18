import { RequestHandler } from 'express';
import { buildSystemUnitList, restartSystemdUnit, stopSystemdUnit } from '../api/system';

import { CustomError } from '../types';

import { validationResult } from 'express-validator';

export const getUnits: RequestHandler = (_req, res, _next) => {
  buildSystemUnitList()
    .then(units => {
      res.status(200).json({
        message: 'Fetched units',
        units: units,
      });
    })
    .catch(err => {
      console.log(err)
      // if (!error.statusCode) {
      //   error.statusCode = 500;
      // }
      // error.stacktracePath = 'controllers/media.js/getMedia';
      // next(error);
      const error: CustomError = new Error(
        err
      );
      error.statusCode = 500;
      error.stacktracePath = 'controllers/systemd.js/restartUnit';
      error.data = [];
      throw error;
    });
};

export const restartUnit: RequestHandler = (req, res, _next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error: CustomError = new Error(
      'Validation failed. Entered data is incorrect.'
    );
    error.statusCode = 422;
    error.stacktracePath = 'controllers/systemd.js/restartUnit';
    error.data = errors.array();
    throw error;
  }

  const unit = req.body.unit;

  restartSystemdUnit(unit)
    .then((result) => {
      console.log(`Restart ${unit} result: `, result);
      return res.status(200).json({
        message: `Unit ${unit} restarted`,
      });
    }).catch((err) => {
      console.log(`Restart ${unit} failed with result: `, err);
      const error: CustomError = new Error(
        err
      );
      error.statusCode = 500;
      error.stacktracePath = 'controllers/systemd.js/restartUnit';
      error.data = [];
      throw error;
    })
};

export const stopUnit: RequestHandler = (req, res, _next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const error: CustomError = new Error(
      'Validation failed. Entered data is incorrect.'
    );
    error.statusCode = 422;
    error.stacktracePath = 'controllers/systemd.js/stopUnit';
    error.data = errors.array();
    throw error;
  }

  const unit = req.body.unit;

  stopSystemdUnit(unit)
    .then((result) => {
      console.log(`Stop ${unit} result: `, result);
      return res.status(200).json({
        message: `Unit ${unit} stopped`,
      });
    }).catch((err) => {
      console.log(`Stop ${unit} failed with result: `, err);
      const error: CustomError = new Error(
        err
      );
      error.statusCode = 500;
      error.stacktracePath = 'controllers/systemd.js/stopUnit';
      error.data = errors.array();
      throw error;
    })
};
