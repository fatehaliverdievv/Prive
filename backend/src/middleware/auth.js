import jwt from 'jsonwebtoken';
import { Admin } from '../models/index.js';

const secret = () => process.env.JWT_SECRET || 'dev-secret';
export const signToken = (id) => jwt.sign({ id }, secret(), { expiresIn: '7d' });

/** Verifies the token AND that the admin still exists (deleted admins lose access immediately) */
export async function requireAuth(req, res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const { id } = jwt.verify(token, secret());
    if (!(await Admin.exists({ _id: id }))) return res.status(401).json({ message: 'Unauthorized' });
    req.admin = { id };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
}
