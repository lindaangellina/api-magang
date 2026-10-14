// src/scripts/coba-dto.ts
import "reflect-metadata";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RegisterDto } from "../dto/auth.dto";

// Lima payload sesuai Soal 4 (a-e)
const kasus: Array<{ label: string; payload: Record<string, unknown> }> = [
  {
    label: "a. valid sempurna",
    payload: {
      nama: "Budi Santoso",
      sekolah: "SMK Negeri 1 Malang",
      email: "budi@example.com",
      password: "rahasia123",
    },
  },
  {
    label: "b. nama terlalu pendek",
    payload: {
      nama: "Bu",
      sekolah: "SMK Negeri 1 Malang",
      email: "budi@example.com",
      password: "rahasia123",
    },
  },
  {
    label: "c. email salah format",
    payload: {
      nama: "Budi Santoso",
      sekolah: "SMK Negeri 1 Malang",
      email: "bukan-email",
      password: "rahasia123",
    },
  },
  {
    label: "d. password tanpa angka",
    payload: {
      nama: "Budi Santoso",
      sekolah: "SMK Negeri 1 Malang",
      email: "budi@example.com",
      password: "passwordsaja",
    },
  },
  {
    label: "e. ada properti tambahan { role: 'mentor' }",
    payload: {
      nama: "Budi Santoso",
      sekolah: "SMK Negeri 1 Malang",
      email: "budi@example.com",
      password: "rahasia123",
      role: "mentor",
    },
  },
];

async function main(): Promise<void> {
  for (const { label, payload } of kasus) {
    // plainToInstance: ubah objek biasa (hasil JSON) menjadi instance RegisterDto
    const instance = plainToInstance(RegisterDto, payload);
    const errors = await validate(instance);

    console.log(`\n=== ${label} ===`);
    console.log(`jumlah error : ${errors.length}  ${errors.length === 0 ? "(array kosong = lolos)" : ""}`);
    for (const e of errors) {
      console.log(`  - ${e.property}: ${JSON.stringify(e.constraints)}`);
    }
    // Pertanyaan inti Soal 4: apakah "role" ditolak, atau ikut terbawa?
    console.log(`properti 'role' masih ada di instance? ${"role" in instance}`);
  }

  // Bonus: lihat struktur MENTAH ValidationError (payload b).
  // Perhatikan "target" dan "value" ikut terkirim -> berbahaya kalau berisi password.
  const mentah = await validate(plainToInstance(RegisterDto, kasus[1].payload));
  console.log("\n=== struktur mentah ValidationError (payload b) ===");
  console.log(JSON.stringify(mentah, null, 2));
}

main();