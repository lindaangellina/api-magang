import { hashPassword, cekPassword, tanpaPassword } from "./utils/password";

async function testHash() {
  const hash1 = await hashPassword("rahasia123");
  const hash2 = await hashPassword("passwordLain");
  const hash3 = await hashPassword("rahasia123"); // password sama dengan hash1

  console.log("Hash 1:", hash1);
  console.log("Hash 2:", hash2);
  console.log("Hash 3 (password sama dengan hash1):", hash3);
  console.log("Hash1 === Hash3?", hash1 === hash3); // harus false walau password sama

  const cocok = await cekPassword("rahasia123", hash1);
  console.log("Cek password benar:", cocok); // true

  const salah = await cekPassword("salahdong", hash1);
  console.log("Cek password salah:", salah); // false

  const contoh = { id: 1, nama: "Budi", password: hash1, role: "peserta" };
  console.log("Sebelum tanpaPassword:", contoh);
  console.log("Setelah tanpaPassword:", tanpaPassword(contoh));
}

testHash();