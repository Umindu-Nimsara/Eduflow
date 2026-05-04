const axios = require('axios');

async function testCloudinaryConnection() {
  console.log('🧪 Testing Cloudinary Connection...\n');

  try {
    // Test 1: Check if Cloudinary API is reachable
    console.log('1️⃣ Testing Cloudinary API connectivity...');
    
    const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dm2tqyley/auto/upload';
    
    // Create a simple test upload (this will fail but should give us connection info)
    const formData = new FormData();
    formData.append('upload_preset', 'EDUFLOW');
    formData.append('file', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

    try {
      const response = await axios.post(cloudinaryUrl, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000
      });
      
      console.log('✅ Cloudinary connection successful');
      console.log('   Response status:', response.status);
      
    } catch (uploadError) {
      if (uploadError.response) {
        console.log('✅ Cloudinary API reachable (got response)');
        console.log('   Status:', uploadError.response.status);
        console.log('   Error:', uploadError.response.data?.error?.message || 'Unknown error');
      } else if (uploadError.code === 'ENOTFOUND' || uploadError.code === 'ECONNREFUSED') {
        console.log('❌ Network connectivity issue');
        console.log('   Error:', uploadError.message);
      } else {
        console.log('⚠️  Upload failed but connection seems OK');
        console.log('   Error:', uploadError.message);
      }
    }

    // Test 2: Check backend Cloudinary config endpoint
    console.log('\n2️⃣ Testing backend Cloudinary config...');
    
    try {
      const configResponse = await axios.get('http://localhost:5000/api/files/cloudinary-config');
      console.log('✅ Backend config endpoint working');
      console.log('   Config:', configResponse.data.data);
    } catch (configError) {
      console.log('❌ Backend config endpoint failed');
      console.log('   Error:', configError.message);
      console.log('   Using fallback config');
    }

    console.log('\n📋 Troubleshooting Tips:');
    console.log('   1. Check internet connection');
    console.log('   2. Verify Cloudinary credentials');
    console.log('   3. Check if upload preset "EDUFLOW" exists');
    console.log('   4. Try with smaller image file');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCloudinaryConnection();