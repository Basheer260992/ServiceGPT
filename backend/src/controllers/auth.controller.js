import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { db, persist } from '../config/storage.js';

function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

function publicUser(u) {
  const { password, ...rest } = u;
  return rest;
}

export async function login(req, res) {
  const { email, password } = req.body || {};
  if (!email || !password) return res.status(400).json({ message: 'Email and password are required' });
  const user = db.data.users.find((u) => u.email.toLowerCase() === String(email).toLowerCase());
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, user.password);
  if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
  const token = signToken(user);
  res.json({ token, user: publicUser(user) });
}

export async function register(req, res) {
  const { name, email, password, role = 'employee', department } = req.body || {};
  if (!name || !email || !password) return res.status(400).json({ message: 'Missing fields' });
  if (db.data.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: 'Email already exists' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: nanoid(),
    name,
    email,
    password: hashed,
    role,
    department: department || 'General',
    avatar: name
      .split(' ')
      .map((s) => s[0])
      .slice(0, 2)
      .join('')
      .toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  db.data.users.push(user);
  await persist();
  const token = signToken(user);
  res.status(201).json({ token, user: publicUser(user) });
}

export async function guest(req, res) {
  let guestUser = db.data.users.find((u) => u.role === 'guest');
  if (!guestUser) {
    const hashed = await bcrypt.hash('guest', 10);
    guestUser = {
      id: 'guest-user',
      name: 'Guest User',
      email: 'guest@servicegpt.io',
      password: hashed,
      role: 'guest',
      department: 'General',
      avatar: 'GU',
      createdAt: new Date().toISOString(),
    };
    db.data.users.push(guestUser);
    await persist();
  }
  const token = signToken(guestUser);
  res.json({ token, user: publicUser(guestUser) });
}

export async function me(req, res) {
  const user = db.data.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'Not found' });
  res.json(publicUser(user));
}
