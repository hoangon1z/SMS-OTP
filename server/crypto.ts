const SECRET_STRING = 'sms_secure_payload_encryption_key_2026';

function rc4(keyBytes: Buffer, inputBytes: Buffer): Buffer {
  const s = Buffer.alloc(256);
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
  
  const output = Buffer.alloc(inputBytes.length);
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
 * Mã hóa chuỗi văn bản (plaintext) bằng thuật toán RC4
 * @param text Văn bản cần mã hóa
 * @returns Chuỗi kết quả định dạng hex
 */
export function encryptPayload(text: string): string {
  const keyBytes = Buffer.from(SECRET_STRING, 'utf8');
  const inputBytes = Buffer.from(text, 'utf8');
  const encryptedBytes = rc4(keyBytes, inputBytes);
  return encryptedBytes.toString('hex');
}

/**
 * Giải mã chuỗi đã mã hóa hex bằng thuật toán RC4
 * @param encryptedText Chuỗi dữ liệu mã hóa đầu vào (hex)
 * @returns Văn bản giải mã gốc (plaintext)
 */
export function decryptPayload(encryptedText: string): string {
  const keyBytes = Buffer.from(SECRET_STRING, 'utf8');
  const inputBytes = Buffer.from(encryptedText, 'hex');
  const decryptedBytes = rc4(keyBytes, inputBytes);
  return decryptedBytes.toString('utf8');
}
