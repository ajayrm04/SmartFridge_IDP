import { body, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const validators: Record<string, any[]> = {
  login: [
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 }),
  ],
  register: [
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 }),
    body('role').optional().isIn(['admin', 'operator', 'viewer']),
  ],
  sensorIngest: [
    body('temperature').isNumeric(),
    body('humidity').isNumeric(),
    body('ammonia').isNumeric(),
    body('co2').isNumeric(),
    body('ethylene').isNumeric(),
    body('energyConsumption').isNumeric(),
    body('zoneId').isString(),
  ],
  foodCreate: [
    body('itemName').isString(),
    body('category').isString(),
    body('storageZone').isString(),
    body('expectedShelfLife').isNumeric(),
    body('activationEnergy').isNumeric(),
  ],
  foodUpdate: [
    body('itemName').optional().isString(),
    body('category').optional().isString(),
    body('storageZone').optional().isString(),
    body('expectedShelfLife').optional().isNumeric(),
    body('activationEnergy').optional().isNumeric(),
    body('spoilagePercentage').optional().isNumeric(),
  ],
  controlCooling: [body('relayState').isString(), body('targetTemperature').isNumeric()],
  pidUpdate: [body('kp').isNumeric(), body('ki').isNumeric(), body('kd').isNumeric()],
};

export const validateRequest = (schema: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const chain = validators[schema] || [];
    await Promise.all(chain.map((validator: any) => validator.run(req)));
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  };
};
