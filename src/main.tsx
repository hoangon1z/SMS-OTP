import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import './index.css';

import { encryptPayload, decryptPayload } from './utils/crypto.ts';

// Global Fetch Interceptor to attach Authorization Token for Local API Calls and secure payloads
const originalFetch = window.fetch;
window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const token = localStorage.getItem('token');
  const newInit = init ? { ...init } : {};

  const urlString = typeof input === 'string'
    ? input
    : (input instanceof URL ? input.href : (input as Request).url || '');

  const isLocalApi = urlString.startsWith('/api/') ||
                     urlString.startsWith('api/') ||
                     urlString.includes(window.location.origin + '/api/');

  if (token && isLocalApi) {
    const headers = new Headers(newInit.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    newInit.headers = headers;
  }

  // 1. Mã hóa Payload gửi đi (Request Body) nếu có
  if (isLocalApi && newInit.body && typeof newInit.body === 'string') {
    try {
      const encryptedStr = await encryptPayload(newInit.body);
      newInit.body = JSON.stringify({ encrypted: encryptedStr });
      
      const headers = new Headers(newInit.headers || {});
      headers.set('Content-Type', 'application/json');
      newInit.headers = headers;
    } catch (err) {
      console.error('Lỗi mã hóa dữ liệu request:', err);
    }
  }

  const response = await originalFetch(input, newInit);

  if ((response.status === 401 || response.status === 403) && isLocalApi) {
    window.dispatchEvent(new Event('auth-unauthorized'));
  }

  // 2. Giải mã Payload nhận về (Response Body) nếu có chứa chuỗi mã hóa
  if (isLocalApi) {
    const responseClone = response.clone();
    let hasEncryptedPayload = false;
    try {
      const json = await responseClone.json();
      if (json && json.encrypted) {
        hasEncryptedPayload = true;
        const decryptedStr = await decryptPayload(json.encrypted);
        const decryptedData = JSON.parse(decryptedStr);
        
        // Tạo một Headers mới và lọc bỏ các header nhạy cảm/gây lỗi Mismatch/Forbidden ở trình duyệt
        const newHeaders = new Headers();
        response.headers.forEach((value, key) => {
          const k = key.toLowerCase();
          if (
            k !== 'content-length' &&
            k !== 'content-encoding' &&
            k !== 'transfer-encoding' &&
            k !== 'connection' &&
            k !== 'keep-alive'
          ) {
            newHeaders.set(key, value);
          }
        });

        // Đảm bảo Content-Type là application/json cho dữ liệu đã giải mã
        newHeaders.set('Content-Type', 'application/json');

        return new Response(JSON.stringify(decryptedData), {
          status: response.status,
          statusText: response.statusText,
          headers: newHeaders
        });
      }
    } catch (err) {
      if (hasEncryptedPayload) {
        console.error('Lỗi khi giải mã hoặc dựng lại Response:', err);
      }
    }
  }

  return response;
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
