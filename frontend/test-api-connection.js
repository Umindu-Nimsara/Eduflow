// Test API connection from frontend perspective
// Run this with: node test-api-connection.js

const axios = require('axios');

const API_URL = 'http://10.224.22.69:5000/api';

async function testConnection() {
  console.log('=== TESTING API CONNECTION ===\n');
  console.log(`API URL: ${API_URL}\n`);
  
  // Test 1: Basic connectivity
  console.log('Test 1: Basic connectivity...');
  try {
    const response = await axios.get(`${API_URL}/courses`, {
      timeout: 5000
    });
    console.log('✅ Connection successful');
    console.log(`   Status: ${response.status}`);
    console.log(`   Courses found: ${response.data.data?.length || 0}`);
  } catch (error) {
    console.log('❌ Connection failed');
    console.log(`   Error: ${error.message}`);
    console.log(`   Code: ${error.code}`);
    if (error.response) {
      console.log(`   Status: ${error.response.status}`);
    }
    return;
  }
  
  // Test 2: Authentication
  console.log('\nTest 2: Authentication...');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'john@elearning.com',
      password: 'password123'
    }, {
      timeout: 5000
    });
    console.log('✅ Authentication successful');
    console.log(`   User: ${response.data.data.user.name}`);
    console.log(`   Role: ${response.data.data.user.role}`);
    
    const token = response.data.data.accessToken;
    
    // Test 3: Upload endpoint (without actual file)
    console.log('\nTest 3: Upload endpoint accessibility...');
    try {
      await axios.post(`${API_URL}/courses/upload`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 5000
      });
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('upload')) {
        console.log('✅ Upload endpoint is accessible');
        console.log('   (400 error expected without file)');
      } else {
        console.log('❌ Upload endpoint error');
        console.log(`   Status: ${error.response?.status}`);
        console.log(`   Message: ${error.response?.data?.message}`);
      }
    }
    
  } catch (error) {
    console.log('❌ Authentication failed');
    console.log(`   Error: ${error.message}`);
  }
  
  console.log('\n=== TEST COMPLETE ===');
}

testConnection();
