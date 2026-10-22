import { buatAccessToken } from "../../src/utils/jwt";

export const tokenPeserta = (id = 1): string =>
  buatAccessToken({ id, email: `peserta${id}@mail.com`, role: "peserta" });

export const tokenMentor = (id = 99): string =>
  buatAccessToken({ id, email: "mentor@mail.com", role: "mentor" });

export const bearer = (token: string): string => `Bearer ${token}`;