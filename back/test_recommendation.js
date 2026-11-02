require('dotenv').config({ path: './.env' });
const { recommend } = require('./src/controllers/recommendController');

// Mock Express req, res, next
const req = {
  body: {
    prompt: "150만원 이하로 배틀그라운드 풀옵션 가능한 게이밍 컴퓨터 맞춰줘",
    usage: "Gaming"
  },
  session: {}
};

const res = {
  json: (output) => {
    console.log("=== TEST RESULT ===");
    console.log(JSON.stringify(output, null, 2));
  }
};

const next = (err) => {
  console.error("=== TEST FAILED ===");
  console.error(err);
};

console.log("Starting Recommendation Test with 1.5M budget...");
recommend(req, res, next);
