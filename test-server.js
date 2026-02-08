// Simple test to verify the server is working
const http = require('http');

// Test if server is running
function testServer() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/',
        method: 'GET'
    };

    const req = http.request(options, (res) => {
        console.log('✅ Server is running');
        console.log(`Status: ${res.statusCode}`);
        
        // Test API endpoint
        testShortenAPI();
    });

    req.on('error', (err) => {
        console.log('❌ Server not running:', err.message);
        console.log('💡 Run: node server.js');
    });

    req.end();
}

// Test shorten API
function testShortenAPI() {
    const postData = JSON.stringify({
        url: 'https://google.com'
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/shorten',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
        }
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.success) {
                    console.log('✅ API is working');
                    console.log('Short URL:', response.data.short_url);
                } else {
                    console.log('❌ API error:', response.message);
                }
            } catch (e) {
                console.log('❌ Invalid JSON response');
            }
        });
    });

    req.on('error', (err) => {
        console.log('❌ API test failed:', err.message);
    });

    req.write(postData);
    req.end();
}

console.log('🧪 Testing LinkShort server...');
testServer();