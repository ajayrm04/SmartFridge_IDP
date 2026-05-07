// src/services/espFetcher.ts
import { getIo } from './socketService';

// ⚠️ Replace with the actual IP address of your ESP32 on your Wi-Fi
const ESP32_IP = '192.168.1.XXX'; 
const ESP32_PORT = 80; // Default HTTP port, change if your ESP is using a different one

export const startEspPolling = () => {
  console.log(`⏱️ Starting polling service for ESP32 at http://${ESP32_IP}:${ESP32_PORT}/data`);

  // Poll the ESP32 every 5 seconds (5000 milliseconds)
  setInterval(async () => {
    try {
      // 1. Fetch data from the ESP32
      const response = await fetch(`http://${ESP32_IP}:${ESP32_PORT}/data`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // 2. Parse the JSON sent by the ESP32
      const rawData = await response.json();

      // 3. Package it with a timestamp for the React frontend
      const sensorData = {
        temperature: Number(rawData.temperature),
        humidity: Number(rawData.humidity),
        mq3Value: Number(rawData.mq3Value),
        timestamp: new Date().toISOString()
      };

      console.log('🔄 Fetched live data from ESP32:', sensorData);

      // 4. Broadcast the data to the React dashboard instantly
      getIo().emit('sensorDataUpdate', sensorData);

    } catch (error) {
      console.error('❌ Failed to fetch from ESP32:', (error as Error).message);
    }
  }, 5000); 
};