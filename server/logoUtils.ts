// Hàm gán logo cục bộ hoặc icon cho các dịch vụ phổ biến dùng các link CDN của Icons8 và Wikimedia ổn định (không bị chặn hotlink)
export function getLogoForService(name: string): string {
  // Chuẩn hóa tên: xóa khoảng trắng, gạch nối, dấu chấm và đưa về chữ thường
  const normalized = name.toLowerCase().replace(/[\s\-_.]/g, '');
  
  const logoMap: { [key: string]: string } = {
    'telegram': 'https://img.icons8.com/color/120/telegram-app.png',
    'facebook': 'https://img.icons8.com/color/120/facebook-new.png',
    'fb': 'https://img.icons8.com/color/120/facebook-new.png',
    'gmail': 'https://img.icons8.com/color/120/gmail-new.png',
    'google': 'https://img.icons8.com/color/120/google-logo.png',
    'youtube': 'https://img.icons8.com/color/120/youtube-play.png',
    'zalo': 'https://img.icons8.com/color/120/zalo.png',
    'tiktok': 'https://img.icons8.com/color/120/tiktok.png',
    'whatsapp': 'https://img.icons8.com/color/120/whatsapp.png',
    'shopee': 'https://img.icons8.com/color/120/shopee.png',
    'lazada': 'https://img.icons8.com/color/120/lazada.png',
    'microsoft': 'https://img.icons8.com/color/120/microsoft.png',
    'outlook': 'https://img.icons8.com/color/120/microsoft.png',
    'hotmail': 'https://img.icons8.com/color/120/microsoft.png',
    'chatgpt': 'https://img.icons8.com/color/120/openai.png',
    'openai': 'https://img.icons8.com/color/120/openai.png',
    'wechat': 'https://img.icons8.com/color/120/weixing.png',
    'viber': 'https://img.icons8.com/color/120/viber.png',
    'discord': 'https://img.icons8.com/color/120/discord-new-logo.png',
    'twitter': 'https://img.icons8.com/color/120/x.png',
    'netflix': 'https://img.icons8.com/color/120/netflix.png',
    'apple': 'https://img.icons8.com/color/120/apple-logo.png',
    'amazon': 'https://img.icons8.com/color/120/amazon.png',
    'line': 'https://img.icons8.com/color/120/line-me.png',
    'kakaotalk': 'https://img.icons8.com/color/120/kakaotalk.png',
    'grab': 'https://img.icons8.com/color/120/grab-app.png',
    'gojek': 'https://img.icons8.com/color/120/gojek.png',
    'gofood': 'https://img.icons8.com/color/120/food-delivery.png',
    'instagram': 'https://img.icons8.com/color/120/instagram-new.png',
    'linkedin': 'https://img.icons8.com/color/120/linkedin.png',
    'github': 'https://img.icons8.com/color/120/github.png',
    'steam': 'https://img.icons8.com/color/120/steam.png',
    'riot': 'https://img.icons8.com/color/120/riot-games.png',
    'valorant': 'https://img.icons8.com/color/120/valorant.png',
    'zoom': 'https://img.icons8.com/color/120/zoom.png',
    'spotify': 'https://img.icons8.com/color/120/spotify.png',
    'reddit': 'https://img.icons8.com/color/120/reddit.png',
    'ebay': 'https://img.icons8.com/color/120/ebay.png',
    'paypal': 'https://img.icons8.com/color/120/paypal.png',
    'stripe': 'https://img.icons8.com/color/120/stripe.png',
    'tiki': 'https://img.icons8.com/color/120/tiki.png',
    'sendo': 'https://img.icons8.com/color/120/sendo.png',
    'momo': 'https://img.icons8.com/color/120/momo.png',
    'snapchat': 'https://img.icons8.com/color/120/snapchat.png',
    'pinterest': 'https://img.icons8.com/color/120/pinterest.png',
    'tumblr': 'https://img.icons8.com/color/120/tumblr.png',
    'skype': 'https://img.icons8.com/color/120/skype.png',
    'winmart': 'https://img.icons8.com/color/120/supermarket.png',
    'nike': 'https://img.icons8.com/color/120/nike.png',
    'naver': 'https://img.icons8.com/color/120/naver.png',
    'payoneer': 'https://img.icons8.com/color/120/payoneer.png',
    'yamaha': 'https://img.icons8.com/color/120/motorcycle.png',
    'taptap': 'https://img.icons8.com/color/120/joystick.png',
    'concung': 'https://img.icons8.com/color/120/baby-bottle.png',
    'unilever': 'https://img.icons8.com/color/120/unilever.png',
    'bigo': 'https://img.icons8.com/color/120/video-call.png',
    'amway': 'https://img.icons8.com/color/120/skincare.png',
    'vinamilk': 'https://img.icons8.com/color/120/milk.png',
    'bexe': 'https://img.icons8.com/color/120/taxi.png',
    'be': 'https://img.icons8.com/color/120/taxi.png',
    'milo': 'https://img.icons8.com/color/120/chocolate-bar.png',
    'nestle': 'https://img.icons8.com/color/120/nestle.png',
    'skyjoy': 'https://img.icons8.com/color/120/airplane.png',
    'tinder': 'https://img.icons8.com/color/120/tinder.png',
    'acecook': 'https://img.icons8.com/color/120/noodles.png',
    'xanhsm': 'https://img.icons8.com/color/120/electric-vehicle.png',
    'baemin': 'https://img.icons8.com/color/120/baemin.png',
    'aeon': 'https://img.icons8.com/color/120/department-store.png',
    'bachhoaxanh': 'https://img.icons8.com/color/120/ingredients.png',
    'heineken': 'https://img.icons8.com/color/120/beer.png',
    'ahamove': 'https://img.icons8.com/color/120/delivery.png',
    'dosi': 'https://img.icons8.com/color/120/diamonds.png',
    'pingpong': 'https://img.icons8.com/color/120/ping-pong.png',
    'passcode': 'https://img.icons8.com/color/120/key.png',
    'taskal': 'https://img.icons8.com/color/120/task.png',
    'qqpk': 'https://img.icons8.com/color/120/crown.png'
  };

  for (const key in logoMap) {
    if (normalized.includes(key)) {
      return logoMap[key];
    }
  }
  
  // Default logo fallback
  return 'https://img.icons8.com/color/120/sms.png';
}
