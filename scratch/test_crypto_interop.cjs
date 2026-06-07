const crypto = require('crypto');

const SECRET_STRING = 'sms_secure_payload_encryption_key_2026';
const ALGORITHM = 'aes-256-cbc';
const SECRET_KEY = crypto.createHash('sha256').update(SECRET_STRING).digest();

// Browser bytesToHex / hexToBytes implementations
function bytesToHex(bytes) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBytes(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

// Server side decrypt
function decryptPayload(encryptedText) {
  const parts = encryptedText.split(':');
  if (parts.length !== 2) throw new Error('Invalid encrypted payload format');
  const iv = Buffer.from(parts[0], 'hex');
  const encrypted = parts[1];
  const decipher = crypto.createDecipheriv(ALGORITHM, SECRET_KEY, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Node.js side encrypt (simulating Web Crypto AES-CBC)
function encryptPayloadNode(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, SECRET_KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Web Crypto API encrypt (simulating the client)
async function encryptPayloadWeb(text) {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // Use Node's Web Crypto implementation
  const webcrypto = crypto.webcrypto;
  const keyData = encoder.encode(SECRET_STRING);
  const hash = await webcrypto.subtle.digest('SHA-256', keyData);
  
  const key = await webcrypto.subtle.importKey(
    'raw',
    hash,
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt']
  );
  
  const iv = webcrypto.getRandomValues(new Uint8Array(16));
  const encrypted = await webcrypto.subtle.encrypt(
    { name: 'AES-CBC', iv },
    key,
    data
  );
  
  const encryptedBytes = new Uint8Array(encrypted);
  return bytesToHex(iv) + ':' + bytesToHex(encryptedBytes);
}

async function test() {
  const rawText = JSON.stringify({ email: 'admin@smsreseller.com', password: 'adminpassword123' });
  console.log('Original Text:', rawText);
  
  try {
    // 1. Test Node -> Node
    const encryptedNode = encryptPayloadNode(rawText);
    console.log('Encrypted (Node):', encryptedNode);
    const decryptedNode = decryptPayload(encryptedNode);
    console.log('Decrypted (Node -> Node):', decryptedNode);
    
    // 2. Test Web Crypto -> Node
    const encryptedWeb = await encryptPayloadWeb(rawText);
    console.log('Encrypted (Web):', encryptedWeb);
    const decryptedWeb = decryptPayload(encryptedWeb);
    console.log('Decrypted (Web -> Node):', decryptedWeb);
    
    console.log('SUCCESS! Encrypted Web matches Node AES-CBC format perfectly!');
  } catch (err) {
    console.error('ERROR during crypto test:', err);
  }
}

test();
