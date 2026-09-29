import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function cekPassword(input: string, hash: string): Promise<boolean> {
  return bcrypt.compare(input, hash);
}

export function tanpaPassword<T extends { password?: unknown }>(data: T): Omit<T, "password"> {
  const { password, ...aman } = data;
  return aman;
}