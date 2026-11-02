const axios = require('axios');

async function testSignup() {
  try {
    const res = await axios.post('http://localhost:3000/api/v1/auth/signup', {
      username: 'testuser' + Date.now(),
      password: 'password123',
      nickname: '테스터'
    });
    console.log('Signup Success:', res.data);
  } catch (err) {
    console.error('Signup Failed:', err.response ? err.response.data : err.message);
  }
}

testSignup();
