const http = require('http');

const PORT = process.env.PORT || 5000;
const options = {
  hostname: 'localhost',
  port: PORT,
  path: '/api/orders',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log(`Status: ${res.statusCode}`);
    try {
      const parsed = JSON.parse(data);
      console.log('Received orders count:', Array.isArray(parsed) ? parsed.length : 'non-array');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      console.log('Raw response:', data);
    }
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.end();
