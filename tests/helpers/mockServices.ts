// Tiruan untuk src/services (barrel). Dipakai lewat jest.mock di test HTTP:
//   jest.mock("../../src/services", () => require("../helpers/mockServices").buatMockServices());
// Nama method HARUS sama dengan method di class service asli.
export function buatMockServices() {
  return {
    pesertaService: {
      daftarPeserta: jest.fn(),
      getPesertaById: jest.fn(),
      buatPeserta: jest.fn(),
      ubahProfil: jest.fn(),
      hapusPeserta: jest.fn(),
    },
    jurnalService: {
      daftarJurnal: jest.fn(),
      getJurnalById: jest.fn(),
      getJurnalByPeserta: jest.fn(),
      getJurnalSaya: jest.fn(),
      buatJurnal: jest.fn(),
      updateJurnal: jest.fn(),
      updateStatusReview: jest.fn(),
      hapusJurnal: jest.fn(),
    },
    authService: {
      register: jest.fn(),
      login: jest.fn(),
      refresh: jest.fn(),
      logout: jest.fn(),
    },
    statsService: {},
  };
}

// clearMocks (jest.config) hanya menghapus catatan pemanggilan, BUKAN jawaban yang sudah diatur.
// Panggil ini di beforeEach supaya jawaban dari satu test tidak bocor ke test berikutnya.
export function resetMockServices(services: Record<string, unknown>): void {
  for (const grup of Object.values(services)) {
    for (const fungsi of Object.values(grup as Record<string, unknown>)) {
      if (jest.isMockFunction(fungsi)) fungsi.mockReset();
    }
  }
}