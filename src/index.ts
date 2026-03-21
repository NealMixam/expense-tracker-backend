import express, { Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import expenseRoutes from './routes/expense.routes.js';

dotenv.config();

const app: Application = express();

// Middleware
app.use(express.json());
app.use(cors());

// Routes
app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
