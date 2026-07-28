import bcrypt from "bcryptjs";

const BCRYPT_PREFIX = /^\$2[aby]?\$/;

export function isHashed(password) {
  return typeof password === "string" && BCRYPT_PREFIX.test(password);
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Accepts both bcrypt hashes and legacy plaintext passwords already stored
// in the database, so existing accounts keep working while new/updated
// passwords are always hashed going forward.
export async function verifyPassword(plainPassword, storedPassword) {
  if (isHashed(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword);
  }
  return plainPassword === storedPassword;
}
