const SECRET_STRING = 'sms_secure_payload_encryption_key_2026';

function rc4(keyBytes: Uint8Array, inputBytes: Uint8Array): Uint8Array {
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

/**
 * Mã hóa dữ liệu dạng text sang chuỗi hex sử dụng RC4.
 * Giữ nguyên kiểu trả về Promise để tương thích với cấu trúc hiện tại.
 */
export async function encryptPayload(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyBytes = encoder.encode(SECRET_STRING);
  const inputBytes = encoder.encode(text);
  const encryptedBytes = rc4(keyBytes, inputBytes);
  
  return Array.from(encryptedBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Giải mã chuỗi hex sang text sử dụng RC4.
 * Giữ nguyên kiểu trả về Promise để tương thích với cấu trúc hiện tại.
 */
export async function decryptPayload(encryptedText: string): Promise<string> {
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
