async function test() {
  try {
    console.log('Đang gọi API services...');
    const res = await fetch('http://localhost:5000/api/services');
    console.log('Status services:', res.status);
    const data = await res.json();
    console.log('Data services count:', data.length);
    console.log('Services list:', data.map(s => `${s.name} (${s.price}đ)`));
  } catch (err) {
    console.error('Lỗi services:', err.message);
  }

  try {
    console.log('\nĐang gọi API tạo hóa đơn nạp 50k...');
    const res = await fetch('http://localhost:5000/api/payment/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount: 50000 })
    });
    console.log('Status create payment:', res.status);
    const data = await res.json();
    console.log('Payment Link Data:', data);
  } catch (err) {
    console.error('Lỗi create payment:', err.message);
  }
}

test();
