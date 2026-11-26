import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRouter from './routes/api.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

app.use('/api', apiRouter);

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Boarding House Management API Server',
    timestamp: new Date()
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🏠 Server Quản Lý Nhà Trọ đang chạy tại http://localhost:${PORT}`);
  console.log(`📡 API Endpoints sẵn sàng tại http://localhost:${PORT}/api`);
  console.log(`=======================================================`);
});
