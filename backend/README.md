# IntelliFridge Backend

A scalable, production-ready Node.js backend for real-time refrigeration monitoring, scientific spoilage calculations, and intelligent cooling control.

## Architecture

```
ESP32 Sensors
    ↓ (Socket.IO / REST)
Node.js Express Backend
    ↓
MongoDB Database
    ↓
Scientific Processing (Arrhenius, PID)
    ↓
ML Predictions (Python Service)
    ↓
ESP32 Relay Control
```

## Features

✓ **Real-time Sensor Ingestion** — Socket.IO & REST endpoints for live data
✓ **Scientific Spoilage Engine** — Arrhenius kinetics + humidity/category adjustments
✓ **PID Cooling Control** — Automated temperature management
✓ **ML Integration** — Axios bridge to Python prediction service
✓ **Alert System** — Automatic severity-based alert generation
✓ **Historical Analytics** — MongoDB time-series storage & querying
✓ **JWT Authentication** — Role-based access control
✓ **Background Jobs** — node-cron scheduled processors

## Project Structure

```
backend/
├── src/
│   ├── config/
│   │   └── db.ts              # MongoDB connection
│   ├── controllers/           # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── sensors.controller.ts
│   │   ├── food.controller.ts
│   │   └── ...
│   ├── middleware/            # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── validation.middleware.ts
│   ├── models/                # Mongoose schemas
│   │   ├── sensorReading.ts
│   │   ├── foodItem.ts
│   │   ├── alert.ts
│   │   └── ...
│   ├── routes/                # Express routers
│   │   ├── api.router.ts
│   │   ├── sensors.router.ts
│   │   └── ...
│   ├── services/              # Business logic
│   │   ├── sensor.service.ts  # Sensor pipeline
│   │   ├── spoilage.service.ts # Arrhenius calculations
│   │   ├── pid.service.ts     # PID control
│   │   ├── alert.service.ts
│   │   ├── ml.service.ts      # Python bridge
│   │   ├── cron.service.ts    # Scheduled jobs
│   │   └── ...
│   ├── socket/                # Socket.IO handlers
│   │   ├── socket.ts
│   │   └── socket.shared.ts
│   └── index.ts               # Entry point
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Installation

1. **Prerequisites**
   - Node.js 18+
   - MongoDB (local or cloud)
   - Python ML service (optional)

2. **Setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   ```

3. **Configure .env**
   ```env
   PORT=4000
   MONGODB_URI=mongodb://localhost:27017/intellifridge
   JWT_SECRET=your-secret-key
   ML_SERVICE_URL=http://localhost:5000
   TARGET_TEMPERATURE=4
   ```

4. **Run**
   ```bash
   npm run dev      # Development with watch
   npm run build    # TypeScript compilation
   npm start        # Production
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` — Create user account
- `POST /api/auth/login` — Get JWT token

### Sensors
- `POST /api/sensors/ingest` — Ingest ESP32 sensor data
- `GET /api/sensors/live` — Latest readings
- `GET /api/sensors/history` — Historical data (query: startDate, endDate, zoneId)

### Food Items
- `GET /api/food` — List all items
- `POST /api/food` — Create food item
- `PUT /api/food/:id` — Update item
- `DELETE /api/food/:id` — Remove item

### Spoilage
- `GET /api/spoilage/live` — Live spoilage metrics
- `GET /api/spoilage/history` — Spoilage trends
- `GET /api/spoilage/:id` — Item-specific details

### Predictions
- `GET /api/predictions` — ML predictions
- `GET /api/predictions/:id` — Specific prediction

### Alerts
- `GET /api/alerts` — Active alerts
- `PUT /api/alerts/:id/resolve` — Resolve alert

### Control
- `POST /api/control/cooling` — Manual cooling command
- `POST /api/control/pid` — Update PID parameters
- `GET /api/control/logs` — Control history

### Analytics
- `GET /api/analytics/energy` — Energy consumption
- `GET /api/analytics/spoilage` — Spoilage metrics
- `GET /api/analytics/performance` — System efficiency

## Socket.IO Events

**ESP32 → Backend:**
- `sensor-data` — Live sensor payload
- `device-status` — Device health
- `heartbeat` — Keep-alive ping

**Backend → ESP32:**
- `cooling-command` — Relay control
- `relay-control` — Specific relay state
- `emergency-stop` — Safety halt

**Internal Events:**
- `sensor-update` — New reading available
- `spoilage-update` — Spoilage recalculated
- `alert-update` — New alerts generated
- `prediction-update` — ML prediction result
- `recommendation-update` — AI recommendation
- `control-update` — Control decision made

## Scientific Engine

### Arrhenius Spoilage Kinetics

$$k = A \cdot e^{-\frac{E_a}{RT}}$$

- **k**: spoilage rate constant
- **Eₐ**: activation energy (kJ/mol)
- **R**: gas constant (8.314 J/mol·K)
- **T**: temperature (Kelvin)

Adjusted for:
- **Humidity**: ×(1 + max(0, RH - 60)%) 
- **Category**: fruit ×1.2, vegetable ×1.1, dairy ×1.4

### PID Control

$$u(t) = K_p \cdot e(t) + K_i \int e(t)dt + K_d \frac{de(t)}{dt}$$

- **e(t)**: temperature error (current - target)
- **Kₚ**: proportional gain (2.0)
- **Kᵢ**: integral gain (0.15)
- **Kᵈ**: derivative gain (0.4)

## Background Jobs

Every 5 minutes:
- Process latest sensor reading
- Recalculate spoilage for all food items
- Evaluate alert conditions
- Broadcast updates via Socket.IO

## ML Service Integration

POST to Python service:
```json
{
  "sensorReading": { "temperature": 5.2, "humidity": 70, ... },
  "foodItems": [ { "category": "fruit", "spoilagePercentage": 25 }, ... ]
}
```

Expected response:
```json
{
  "spoilageProbability": 0.15,
  "predictedSpoilageTime": "2026-05-08T12:30:00Z",
  "confidenceScore": 0.87
}
```

Fallback if ML service unavailable — returns dummy prediction.

## Security

- JWT authentication on all protected endpoints
- Role-based authorization (admin, operator, viewer)
- Request validation via express-validator
- CORS configured for frontend
- Mongoose schema validation

## Development

```bash
# Watch & rebuild
npm run dev

# Lint (configured via package.json)
npm run lint

# Format
npm run format
```

## Production Deployment

```bash
npm run build
npm start
```

Use PM2 or Docker for process management.

## Troubleshooting

**MongoDB connection fails:**
- Verify MONGODB_URI is correct
- Ensure MongoDB is running

**ML service timeout:**
- Check ML_SERVICE_URL is reachable
- Backend falls back to mock predictions

**Socket.IO not connecting:**
- Verify frontend CORS origin matches
- Check firewall allows WebSocket connections

## License

Proprietary — IntelliFridge AI
