const OpenAI = require('openai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY,
    baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  });
}
module.exports = openai;