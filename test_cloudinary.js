const fs = require('fs');
const https = require('https');

fs.writeFileSync('test.txt', 'test content');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const postData = `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="test.txt"\r\nContent-Type: text/plain\r\n\r\ntest content\r\n--${boundary}\r\nContent-Disposition: form-data; name="upload_preset"\r\n\r\nchatapp_uploads\r\n--${boundary}--`;

const options = {
  hostname: 'api.cloudinary.com',
  path: '/v1_1/del9ul8xk/raw/upload',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response:', body));
});

req.on('error', (e) => console.error(e));
req.write(postData);
req.end();
