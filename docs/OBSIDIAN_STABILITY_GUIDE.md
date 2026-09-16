# 🛡️ OmniAnima: Panduan Kestabilan & Arsitektur (Obsidian Note)

Dokumen ini adalah pedoman permanen untuk mencegah regresi bug, crash, lag canvas, dan masalah otentikasi di OmniAnima.

---

## 1. 🔑 Aturan Emas JWT Token & Header Size (Penyebab Utama HTTP 494)

### ❌ Kesalahan yang Pernah Terjadi:
- Objek `avatar_url` yang berisi base64 gambar resolusi penuh (~837 KB) dimasukkan ke dalam payload `jwt.sign(user, ...)`.
- Akibatnya, ukuran JWT token membengkak menjadi **838 Kilobyte**!
- Ketika browser mengirim request dengan header `Authorization: Bearer <838KB>`, edge proxy Vercel/Nginx langsung menolak dengan status **`HTTP 494 Request Header Or Cookie Too Large`** (atau `Unexpected token '%'` karena Vercel mengembalikan halaman error HTML).

### ✅ Standar yang Harus Selalu Dipatuhi:
1. **JWT Payload HANYA Boleh Memuat Identitas Minimal**:
   ```javascript
   // BENAR:
   const tokenPayload = { id: user.id, username: user.username, email: user.email };
   const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, { expiresIn: '7d' });
   ```
2. **JANGAN PERNAH** memasukkan `avatar_url`, gambar base64, token lain, atau data array ke dalam JWT payload.
3. Ukuran token JWT harus selalu **di bawah 500 karakter**.
4. Data avatar cukup disimpan di kolom database `users` dan dikirimkan lewat response body JSON biasa (`res.json({ data: { user } })`), bukan di dalam token.

---

## 2. 🍪 Aturan Kuki & Fetch Credentials (`credentials: 'omit'`)

1. OmniAnima adalah aplikasi berbasis **Bearer Token (JWT)**, bukan cookie-based session.
2. Pada pemanggilan API di client (`public/js/auth.js`), selalu gunakan:
   ```javascript
   const fetchOptions = {
     credentials: options.credentials || 'omit',
     ...options,
     headers
   };
   ```
3. Opsi `credentials: 'omit'` memastikan browser tidak menempelkan tumpukan kuki yang mungkin terakumulasi di domain induk (seperti kuki Vercel toolbar/preview di `.vercel.app`), sehingga ukuran request header selalu ultra-ringan (~100–300 byte).
4. Pada pemanggilan data publik (seperti `GET /api/published`), **jangan kirimkan header `Authorization`** jika tidak diperlukan.

---

## 3. 👤 Aturan Validasi Sesi & Auto-Redirect (Mencegah Terlempar ke Login)

### ❌ Kesalahan yang Pernah Terjadi:
- Fungsi `isUuid` menggunakan regex RFC 4122 Variant 1 yang terlalu ketat (`[89ab]`).
- Fungsi `apiFetch` melakukan redirect paksa `window.location.href = '/login'` ketika token terdeteksi panjang atau format id berbeda, menyebabkan pengguna yang baru saja login langsung terlempar kembali ke login page.

### ✅ Standar yang Harus Selalu Dipatuhi:
1. **Validasi User ID Fleksibel**:
   ```javascript
   function isUuid(value) {
     if (!value) return false;
     if (typeof value === 'number') return true;
     if (typeof value === 'string') return value.trim().length > 0;
     return false;
   }
   ```
2. **Jangan Redirect Paksa di Tengah Utility Function**:
   - Redirect ke login hanya boleh terjadi jika:
     a) Pengguna memang tidak memiliki token di `localStorage` saat membuka halaman terproteksi (`/app`).
     b) Server secara eksplisit mengembalikan status `HTTP 401 Unauthorized`.

---

## 4. 🎨 Aturan Performa Canvas & Studio Editor (Zero Lag Standard)

1. **Goresan Drawing $O(1)$ Inkremental**:
   - `PencilTool`, `BrushTool`, dan `EraserTool` harus selalu menggunakan segmen inkremental per event:
     ```javascript
     this.ctx.beginPath();
     this.ctx.moveTo(this.lastPoint.x, this.lastPoint.y);
     this.ctx.lineTo(p.x, p.y);
     this.ctx.stroke();
     this.lastPoint = p;
     ```
   - DILARANG membiarkan path terakumulasi tanpa `beginPath()` karena browser akan menggambar ulang seluruh titik dari awal stroke ($O(N^2)$ lag).
2. **Akselerasi GPU untuk Preview Shape**:
   - Gunakan offscreen canvas snapshot dan `ctx.drawImage` untuk preview kotak, garis, dan lingkaran.
   - DILARANG menggunakan `getImageData` + `putImageData` (2MB per event) saat kursor mouse bergerak.
3. **Debounced Commit PNG (`save(false)`)**:
   - `drawCanvas.toDataURL('image/png')` hanya di-commit saat jeda menggambar (350ms debounce) atau saat berpindah frame (`save(true)`).
4. **Playback Tanpa DOM Rebuild**:
   - Selama pemutaran animasi (Playback), hanya pindahkan class `.active` pada frame button. DILARANG memanggil `box.innerHTML = ''` di setiap tick playback.

---

## 5. 📋 Checklist Verifikasi Setiap Rilis Baru

Sebelum melakukan deployment rilis baru:
- [ ] Validasi syntax semua file JS (`node --check`).
- [ ] Pastikan ukuran JWT token di endpoint `/login` dan `/register` < 500 byte.
- [ ] Pastikan Explore Community dapat dimuat tanpa token (`public: true`).
- [ ] Pastikan stroke drawing 150+ titik di canvas tetap mulus 60 FPS.
- [ ] Pastikan kuota publikasi 5 video per akun berfungsi di backend dan frontend.