// Membungkam log aplikasi supaya output Jest bersih.
// Untuk melihat log saat debugging (cmd): set LOG_TEST=1 lalu npm test
beforeAll(() => {
  if (process.env.LOG_TEST === "1") return;
  jest.spyOn(console, "log").mockImplementation(() => undefined);
  jest.spyOn(console, "warn").mockImplementation(() => undefined);
  jest.spyOn(console, "error").mockImplementation(() => undefined);
});