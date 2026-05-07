import { Request, Response } from 'express';
import { getIo } from '../services/socketService';

export const receiveSensorData = (req: Request, res: Response) => {
  try {
    // Extract the data sent by your ESP8266
    const { temperature, humidity, mq3Value } = req.body;

    // Basic validation to ensure no empty data crashes the server
    if (temperature === undefined || humidity === undefined || mq3Value === undefined) {
      return res.status(400).json({ error: 'Missing sensor data' });
    }

    // Package the data with a timestamp
    const sensorData = {
      temperature: Number(temperature),
      humidity: Number(humidity),
      mq3Value: Number(mq3Value),
      timestamp: new Date().toISOString()
    };

    console.log('📥 Data received from ESP:', sensorData);

    // Broadcast this data to the React frontend instantly
    getIo().emit('sensorDataUpdate', sensorData);

    // Reply to the ESP8266 so it knows the data arrived safely
    return res.status(200).json({ message: 'Data successfully processed' });

  } catch (error) {
    console.error('Error processing sensor data:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};