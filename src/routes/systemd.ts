import express from 'express';
import { body } from 'express-validator';

import * as systemdController from '../controllers/systemd';

const router = express.Router();

router.get('/units', systemdController.getUnits);

router.post(
  '/unit/restart',
  [body('unit').trim().isLength({ min: 5 })],
  systemdController.restartUnit
);

router.post(
  '/unit/stop',
  [body('unit').trim().isLength({ min: 5 })],
  systemdController.stopUnit
);

router.post(
  '/unit/start',
  [body('unit').trim().isLength({ min: 5 })],
  systemdController.startUnit
);

export default router;
