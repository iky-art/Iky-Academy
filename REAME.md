# Iky Academy — Setup

## 1. Database
Jalankan schema-nya dulu di project Supabase kamu (`rlbmwtaqixektxzsvftj`) — kalau belum, pakai file-file di folder `parts/` yang sudah dikirim sebelumnya (part1 s/d part7, urut).

## 2. Aktifkan Login Google
1. Supabase Dashboard → **Authentication → Providers → Google** → aktifkan, isi Client ID & Secret dari Google Cloud Console.
2. Di **Authentication → URL Configuration**, tambahkan URL situs kamu (dan `http://localhost` kalau develop lokal) ke **Redirect URLs**.

## 3. Jadikan diri kamu admin pertama
Nggak ada allowlist email admin di project ini (beda dari Apollo Academy) — jadi admin pertama harus di-set manual:
1. Login dulu sekali ke situsnya pakai akun Google kamu (biar baris profil ke-buat).
2. Buka Supabase Dashboard → **Table Editor → profiles**, cari baris kamu, ubah kolom `role` dari `student` jadi `admin`.
3. Refresh `admin.html` — sekarang bisa masuk, dan dari situ kamu bisa jadiin user lain admin juga lewat tab **User**.

## 4. Struktur file
```
index.html        → Beranda: chapter, XP/level/streak, preview leaderboard
login.html         → Masuk pakai Google (satu-satunya cara login)
chapter.html        → Baca 1 chapter, tandai selesai
leaderboard.html     → Leaderboard lengkap, real-time
profile.html          → Profil sendiri/orang lain, follow, badge, link Discord
rooms.html             → Daftar voice room (UI siap, audio nunggu LiveKit)
admin.html              → Kelola chapter/pengumuman/badge/user
css/style.css             → Desain sistem (manga neubrutalism, dark/light mode)
js/supabase-client.js      → Koneksi Supabase + helper auth/profile/tema
js/main.js                  → Wiring navbar bersama (notifikasi, tema, menu mobile)
```

## 5. Yang masih placeholder (butuh setup layanan luar)

### 🎙️ Voice Room — LiveKit
UI room list & "gabung room" sudah nyimpen data ke Supabase (`voice_rooms`, `voice_room_participants`) secara real-time. Yang belum: audio beneran.
**Langkah lanjut:** bikin **edge function** di Supabase yang manggil LiveKit Server SDK buat generate access token, lalu di `rooms.html` fungsi `joinRoom()` disambung ke LiveKit Client SDK pakai token itu.

### 📺 Skip Chapter pakai Iklan — AdMob
Tombol "Skip pakai Iklan" di `index.html` (fungsi `skipWithAd()`) baru nampilin toast placeholder.
**Langkah lanjut:** integrasikan AdMob rewarded ad SDK, lalu di callback `onUserEarnedReward`, panggil insert ke `skip_chapter_ads` + update `reading_progress` (contoh kode sudah ada komentarnya di `index.html`). **Validasi ini harus di server-side** (edge function), jangan cuma di client.

### 🔔 Push Notification — OneSignal
Notifikasi in-app (buat user yang online) sudah jalan lewat Supabase Realtime. Yang belum: push ke HP user yang app-nya lagi ketutup.
**Langkah lanjut:**
1. Pasang OneSignal Web SDK, simpan `player_id` user ke `profiles.onesignal_player_id` pas mereka kasih izin notifikasi.
2. Bikin edge function yang dipanggil tiap ada `announcement` baru (lihat komentar `TODO` di `admin.html`), yang manggil OneSignal REST API buat kirim push ke semua `onesignal_player_id` yang ada.

### 🔗 Link Discord
Tombol "Join Discord" di `profile.html` masih `href="#"` — ganti ke link undangan asli Discord Iky Academy & Iky Store.

## Catatan pengetesan
Semua halaman sudah dicek strukturnya (HTML seimbang, JS lolos syntax check) dan dites di browser asli (Playwright headless) — tapi sandbox saya nggak punya akses internet, jadi saya **belum bisa tes interaksi Supabase beneran** (login Google, insert data, dll). Tolong dites manual di browser sungguhan sebelum dipakai publik, terutama alur login Google dan RLS policy-nya.

