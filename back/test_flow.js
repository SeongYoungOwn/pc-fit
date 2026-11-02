const axios = require('axios');

async function testFlow() {
  const username = 'final_test_user';
  const password = 'password123';
  const nickname = '최종테스터';

  try {
    // 1. Signup
    console.log('Testing Signup...');
    try {
      const signupRes = await axios.post('http://localhost:3000/api/v1/auth/signup', {
        username, password, nickname
      });
      console.log('Signup Result:', signupRes.data);
    } catch (err) {
      if (err.response && err.response.status === 409) {
        console.log('User already exists, proceeding to login.');
      } else {
        throw err;
      }
    }

    // 2. Login
    console.log('Testing Login...');
    const loginRes = await axios.post('http://localhost:3000/api/v1/auth/login', {
      username, password
    });
    console.log('Login Result:', loginRes.data);
    
    if (loginRes.data.success) {
      console.log('✅ Auth Flow is working perfectly!');
    }
  } catch (err) {
    console.error('Flow Failed:', err.response ? err.response.data : err.message);
  }
}

testFlow();
