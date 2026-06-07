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

function encrypt(text) {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(SECRET_STRING);
  const inputBytes = encoder.encode(text);
  const encryptedBytes = rc4(keyBytes, inputBytes);
  
  // Convert to hex
  return Array.from(encryptedBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function decrypt(hex) {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(SECRET_STRING);
  
  // Convert hex to bytes
  const encryptedBytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < encryptedBytes.length; i++) {
    encryptedBytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  
  const decryptedBytes = rc4(keyBytes, encryptedBytes);
  const decoder = new TextDecoder();
  return decoder.decode(decryptedBytes);
}

// Test function
function test() {
  const original = JSON.stringify({
    message: "Đăng nhập thành công! Tiền nạp: 100.000đ",
    status: 200
  });
  console.log("Original:", original);
  const encrypted = encrypt(original);
  console.log("Encrypted (Hex):", encrypted);
  const decrypted = decrypt(encrypted);
  console.log("Decrypted:", decrypted);
  if (original === decrypted) {
    console.log("SUCCESS!");
  } else {
    console.log("FAIL!");
  }
}

test();
