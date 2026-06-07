const http = require('http');

const SECRET_STRING = 'sms_secure_payload_encryption_key_2026';

function rc4(keyBytes, inputBytes) {
  const s = new Uint8Array(256);
  for (let i = 0; i < 256; i++) {
    s[i] = i;
  }
  let j = 0;
  for (let i = 0; i < 256; i++) {
    j = (j + s[i] + keyBytes[i % keyBytes.length]) & 255;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
  }
  
  const output = new Uint8Array(inputBytes.length);
  let i = 0;
  j = 0;
  for (let k = 0; k < inputBytes.length; k++) {
    i = (i + 1) & 255;
    j = (j + s[i]) & 255;
    const temp = s[i];
    s[i] = s[j];
    s[j] = temp;
    output[k] = inputBytes[k] ^ s[(s[i] + s[j]) & 255];
  }
  return output;
}

function encryptPayload(text) {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(SECRET_STRING);
  const inputBytes = encoder.encode(text);
  const encryptedBytes = rc4(keyBytes, inputBytes);
  
  return Array.from(encryptedBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function decryptPayload(encryptedText) {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(SECRET_STRING);
  
  const encryptedBytes = new Uint8Array(encryptedText.length / 2);
  for (let i = 0; i < encryptedBytes.length; i++) {
    encryptedBytes[i] = parseInt(encryptedText.substring(i * 2, i * 2 + 2), 16);
  }
  
  const decryptedBytes = rc4(keyBytes, encryptedBytes);
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}

async function runTest() {
  const loginBody = JSON.stringify({
    email: 'admin@smsreseller.com',
    password: 'adminpassword123'
  });

  const encryptedBody = encryptPayload(loginBody);
  const postData = JSON.stringify({ encrypted: encryptedBody });

  console.log('Sending RC4 encrypted payload to /api/auth/login...');

  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
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
      console.log('Response Status:', res.statusCode);
      console.log('Raw Response Data:', data);
      
      try {
        const json = JSON.parse(data);
        if (json.encrypted) {
          const decrypted = decryptPayload(json.encrypted);
          console.log('Decrypted Response:', decrypted);
        } else {
          console.log('Response was not encrypted:', json);
        }
      } catch (err) {
        console.error('Error parsing/decrypting response:', err);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

runTest();
