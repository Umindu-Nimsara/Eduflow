const axios = require('axios');

async function testCloudinarySimple() {
  console.log('🧪 Testing Cloudinary Connectivity...\n');

  try {
    // Test 1: Check if Cloudinary API is reachable
    console.log('1️⃣ Testing Cloudinary API endpoint...');
    
    const cloudinaryUrl = 'https://api.cloudinary.com/v1_1/dm2tqyley/auto/upload';
    
    // Simple connectivity test
    try {
      const response = await axios.get('https://api.cloudinary.com', { timeout: 5000 });
      console.log('✅ Cloudinary domain is reachable');
    } catch (error) {
      if (error.code === 'ENOTFOUND') {
        console.log('❌ Cannot reach Cloudinary - DNS/Network issue');
        return;
      } else {
        console.log('✅ Cloudinary domain is reachable (got response)');
      }
    }

    // Test 2: Test upload with minimal data
    console.log('\n2️⃣ Testing minimal upload...');
    
    const formData = new FormData();
    formData.append('upload_preset', 'EDUFLOW');
    formData.append('file', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');

    try {
      const uploadResponse = await axios.post(cloudinaryUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 10000
      });
      
      console.log('✅ Upload successful!');
      console.log('   Public ID:', uploadResponse.data.public_id);
      console.log('   URL:', uploadResponse.data.secure_url);
      
    } catch (uploadError) {
      console.log('❌ Upload failed');
      console.log('   Status:', uploadError.response?.status);
      console.log('   Error:', uploadError.response?.data?.error?.message || uploadError.message);
      
      if (uploadError.response?.status === 400) {
        const errorMsg = uploadError.response.data?.error?.message;
        if (errorMsg?.includes('Invalid upload preset')) {
          console.log('   ⚠️  Upload preset "EDUFLOW" may not exist or is not configured for unsigned uploads');
        }
      }
    }

    console.log('\n📋 Troubleshooting:');
    console.log('   1. Check internet connection');
    console.log('   2. Verify upload preset "EDUFLOW" exists in Cloudinary dashboard');
    console.log('   3. Ensure upload preset is configured for unsigned uploads');
    console.log('   4. Check Cloudinary account limits');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCloudinarySimple();