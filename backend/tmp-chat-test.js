const loginRes = await fetch('http://localhost:5000/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'admin@servicegpt.io', password: 'admin123' }),
});
const login = await loginRes.json();
const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${login.token}` };

const resp1 = await fetch('http://localhost:5000/api/chat', {
  method: 'POST', headers, body: JSON.stringify({ text: 'create incident email not sending' }),
});
const bot1 = await resp1.json();
console.log('FIRST REPLY:', bot1.bot?.text || JSON.stringify(bot1));

const resp2 = await fetch('http://localhost:5000/api/chat', {
  method: 'POST', headers, body: JSON.stringify({ text: '2' }),
});
const bot2 = await resp2.json();
console.log('SECOND REPLY:', bot2.bot?.text || JSON.stringify(bot2));
