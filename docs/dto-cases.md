# Tiga lapis validasi: DTO, service, database

Pembagian tempat untuk setiap aturan, beserta alasannya.

| # | Aturan | Tempat | Alasan |
|---|---|---|---|
| a | Format email valid | DTO | Cukup melihat string-nya sendiri. Stateless, murah, tanpa database. |
| b | Email belum dipakai akun lain | Database (UNIQUE) | Perlu data yang ada. Pengecekan di DTO bisa kena race condition: dua request bersamaan sama-sama melihat "email belum ada" lalu keduanya menyimpan. Hanya UNIQUE constraint yang menjamin. Error 23505 diterjemahkan menjadi 409 (Minggu 13). |
| c | Nama minimal 3 karakter | DTO | Aturan bentuk, hanya bergantung pada nilai field itu sendiri. |
| d | Peserta hanya boleh mengedit jurnal miliknya | Service | Perlu tahu siapa yang login (`req.user`) dan siapa pemilik jurnal (data dari database). Ini aturan bisnis/kepemilikan, bukan bentuk data. |
| e | Fase bernilai 1 sampai 5 | DTO | Aturan rentang pada satu nilai, tidak perlu data lain. |
| f | Password minimal 8 karakter | DTO | Aturan bentuk pada satu field, dicek sebelum request menyentuh service. |
| g | `pesertaId` pada jurnal menunjuk peserta yang ada | Database (FOREIGN KEY) | Perlu mengecek isi tabel lain. Foreign key menjamin tanpa celah race (peserta bisa terhapus di antara pengecekan dan penyimpanan). Error 23503 diterjemahkan menjadi pesan yang ramah. |
| h | Jurnal yang sudah direview tidak boleh diedit lagi | Service | Bergantung pada status jurnal saat ini di database (state aplikasi), bukan pada isi request. |

## Cara memutuskan
1. Cukup dengan melihat request itu sendiri? **DTO** (lapis 1, murah, ditolak paling awal dengan 422).
2. Perlu tahu siapa penggunanya atau status data saat ini? **Service** (lapis 2, aturan bisnis, 403/409/422 sesuai kasus).
3. Harus benar walau ada dua request bersamaan, atau walau ada kode lain yang menulis ke tabel? **Database** (lapis 3, penjaga terakhir).

Beberapa aturan sengaja dijaga di lebih dari satu lapis (misalnya email unik: service boleh mengecek lebih dulu untuk pesan yang ramah, tapi UNIQUE tetap penjaga yang menentukan).