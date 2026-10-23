import jwt from "jsonwebtoken";
import {
  buatAccessToken,
  buatRefreshToken,
  buatToken,
  verifikasiRefreshToken,
  verifikasiToken,
  JwtPayload,
} from "../../../src/utils/jwt";

const payload: JwtPayload = { id: 7, email: "budi@mail.com", role: "peserta" };

describe("jwt", () => {
  describe("access token", () => {
    it("buatAccessToken lalu verifikasiToken mengembalikan payload yang sama", () => {
      const token = buatAccessToken(payload);

      expect(verifikasiToken(token)).toMatchObject(payload);
    });

    it("buatToken menghasilkan token yang valid untuk verifikasiToken", () => {
      expect(verifikasiToken(buatToken(payload))).toMatchObject(payload);
    });

    it("token memuat waktu kedaluwarsa (exp)", () => {
      const { exp, iat } = verifikasiToken(buatAccessToken(payload)) as JwtPayload & { exp: number; iat: number };

      expect(exp).toBeGreaterThan(iat);
    });

    it("menolak token yang ditandatangani dengan secret lain (JsonWebTokenError)", () => {
      const palsu = jwt.sign(payload, "secret-penyerang");

      expect(() => verifikasiToken(palsu)).toThrow(jwt.JsonWebTokenError);
    });

    it("menolak token yang sudah kedaluwarsa (TokenExpiredError)", () => {
      const kedaluwarsa = jwt.sign(
        { ...payload, exp: Math.floor(Date.now() / 1000) - 60 },
        process.env.JWT_SECRET as string
      );

      expect(() => verifikasiToken(kedaluwarsa)).toThrow(jwt.TokenExpiredError);
    });

    it("menolak teks yang bukan token", () => {
      expect(() => verifikasiToken("bukan-token")).toThrow(jwt.JsonWebTokenError);
    });
  });

  describe("refresh token", () => {
    it("buatRefreshToken lalu verifikasiRefreshToken mengembalikan payload yang sama", () => {
      const token = buatRefreshToken(payload);

      expect(verifikasiRefreshToken(token)).toMatchObject(payload);
    });

    it("refresh token TIDAK diterima sebagai access token (secret berbeda)", () => {
      expect(() => verifikasiToken(buatRefreshToken(payload))).toThrow(jwt.JsonWebTokenError);
    });

    it("access token TIDAK diterima sebagai refresh token (secret berbeda)", () => {
      expect(() => verifikasiRefreshToken(buatAccessToken(payload))).toThrow(jwt.JsonWebTokenError);
    });
  });
});