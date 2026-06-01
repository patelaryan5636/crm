const https = require('https');

const data = JSON.stringify({
  event: 'payment.captured',
  payload: { payment: { entity: { id: 'test_payment_1', status: 'captured' } } }
});

const options = {
  method: 'POST',
  hostname: 'urban-mule-mortify.ngrok-free.dev',
  path: '/api/payments/webhook/razorpay',
  headers: {
    'Content-Type': 'application/json',
    'x-razorpay-signature': '93d0b28c2d71fad1a53fa035ca2024d1c5de93d249f7c701bdd8ab1813a7019b',
    'Content-Length': Buffer.byteLength(data)
  }
};

const req = https.request(options, (res) => {
  console.log('Status', res.statusCode);
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('Body:', body);
  });
});

req.on('error', (err) => {
  console.error('Request error:', err.message);
});

req.write(data);
req.end();
