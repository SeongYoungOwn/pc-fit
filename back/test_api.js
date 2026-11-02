const http = require('http');

const data = JSON.stringify({
  budget: 1500000,
  usage: 'gaming',
  brand: 'AMD',
  model: 'gemini'
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/v1/recommend',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  let chunks = [];
  res.on('data', (d) => chunks.push(d));
  res.on('end', () => console.log(Buffer.concat(chunks).toString()));
});

req.on('error', (e) => console.error(e));
req.write(data);
req.end();
