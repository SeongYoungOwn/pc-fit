const express = require('express');
const { body, validationResult } = require('express-validator');

const app = express();
app.use(express.json());

app.post('/test',
  body('budget').isNumeric(),
  body('usage').isString(),
  (req, res) => {
    const e = validationResult(req);
    res.json(e.array());
  }
);

app.listen(5001, async () => {
  const http = require('http');
  const data = JSON.stringify({ budget: 1500000, usage: 'gaming' });
  const req = http.request({ port: 5001, path: '/test', method: 'POST', headers: {'Content-Type':'application/json'} }, (res) => {
    res.on('data', d => console.log(d.toString()));
    process.exit(0);
  });
  req.write(data);
  req.end();
});
