import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import api from './routes/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: (process.env.CLIENT_URL || 'http://localhost:5173').split(',') }));
app.use(express.json({ limit: '2mb' }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/api', api);

app.use((err, _req, res, _next) => {
  if (err.code === 11000) return res.status(409).json({ message: `Bu dəyər artıq mövcuddur: ${Object.keys(err.keyValue || {}).join(', ') || 'slug'}` });
  if (err.name === 'ValidationError') return res.status(400).json({ message: Object.values(err.errors).map((e) => e.message).join('; ') });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Yanlış identifikator' });
  if (err.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ message: 'Şəkil 8 MB-dan böyük ola bilməz' });
  console.error(err);
  res.status(err.status || 500).json({ message: err.status ? err.message : 'Server xətası' });
});

if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me-please') console.warn('⚠  JWT_SECRET təyin edilməyib — .env-də uzun təsadüfi dəyər yazın.');

const PORT = process.env.PORT || 5000;
mongoose
  .connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017', { dbName: process.env.MONGO_DB || 'peaktour' })
  .then(() => app.listen(PORT, () => console.log(`Peak Tour API → http://localhost:${PORT}`)))
  .catch((e) => {
    console.error('MongoDB connection failed:', e.message);
    process.exit(1);
  });
