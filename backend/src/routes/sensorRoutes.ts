import { Router } from 'express';
import { 
  receiveSensorData, 
  getRelayCommand, 
  getSensorData, 
  turnRelayOn, 
  turnRelayOff 
} from '../controllers/sensorController';

const router = Router();

// ESP8266 Routes
router.post('/sensor-data', receiveSensorData);
router.get('/relay-command', getRelayCommand);

// React Frontend Routes
router.get('/data', getSensorData);
router.get('/relay/on', turnRelayOn);
router.get('/relay/off', turnRelayOff);

export default router;