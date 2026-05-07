import { Request, Response } from 'express';

// Store latest sensor values in memory
let sensorData = {
  temperature: 0,
  humidity: 0,
  gas_level: 0,
  relay_state: 0,
  timestamp: new Date().toISOString() // Added so React knows when it updated
};

// Relay state memory
let relayCommand = "OFF";

// ─── Receive Sensor Data from ESP ─────────────────────
export const receiveSensorData = (req: Request, res: Response) => {
  sensorData = {
    temperature: Number(req.body.temperature) || 0,
    humidity: Number(req.body.humidity) || 0,
    gas_level: Number(req.body.gas_level) || 0,
    relay_state: Number(req.body.relay_state) || 0,
    timestamp: new Date().toISOString()
  };

  console.log("Received Sensor Data:");
  console.log(sensorData);

  res.send("Data Received");
};

// ─── Send Relay Command To ESP ───────────────
export const getRelayCommand = (req: Request, res: Response) => {
  res.send(relayCommand);
};

// ─── Frontend API (React fetches this) ────────────────
export const getSensorData = (req: Request, res: Response) => {
  res.json(sensorData);
};

// ─── Manual Relay Control ────────────────────
export const turnRelayOn = (req: Request, res: Response) => {
  relayCommand = "ON";
  console.log("Relay turned ON");
  res.send("Relay ON");
};

export const turnRelayOff = (req: Request, res: Response) => {
  relayCommand = "OFF";
  console.log("Relay turned OFF");
  res.send("Relay OFF");
};