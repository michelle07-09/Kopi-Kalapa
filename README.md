# Kopi Kalapa

Selamat datang di website Kopi Kalapa, tempat untuk menjelajahi dunia kopi yang hangat, nyaman, dan penuh cerita. Website ini menampilkan berbagai pilihan produk kopi, kisah brand, info lokasi, serta pengalaman berbelanja yang lebih mudah dan personal.

## Tentang Website

Website ini dirancang untuk membantu pelanggan:

- melihat koleksi produk kopi dengan detail rasa, asal, dan proses roasting
- mengenal lebih dekat cerita dan nilai dari Kopi Kalapa
- menemukan informasi toko dan opsi langganan yang praktis
- mengajukan pertanyaan, pemesanan wholesale, atau kebutuhan lainnya dengan lebih mudah

## Menjalankan Website

Untuk melihat website ini secara lokal, cukup jalankan perintah berikut di terminal:

```bash
npm start
```

Setelah itu, buka alamat lokal yang muncul di browser untuk mulai menikmati pengalaman website.

## Struktur Proyek

- `server.js` - server backend untuk menangani halaman dan data aplikasi
- `public/` - file frontend seperti halaman, styling, dan interaksi browser
- `data/catalog.json` - data produk, lokasi, dan paket langganan
- `data/store.json` - data sementara untuk keranjang, pesanan, pertanyaan, dan langganan

## Fitur Utama

- halaman produk dan katalog kopi
- informasi tentang toko dan cerita brand
- formulir inquiry dan wholesale
- sistem langganan sederhana
- pengalaman belanja yang lebih interaktif

## API Utama

Beberapa endpoint yang tersedia antara lain:

- `GET /api/products`
- `GET /api/products/:slug`
- `GET /api/site`
- `GET /api/cart`
- `POST /api/cart`
- `DELETE /api/cart`
- `POST /api/orders`
- `POST /api/inquiries`
- `POST /api/subscriptions`
