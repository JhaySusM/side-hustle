export const ADMIN_EMAIL = "admin@gmail.com";
export const ADMIN_PASSWORD = "admin1234";

export function isAdminRequest(request) {
  return (
    request.headers.get("x-admin-email") === ADMIN_EMAIL &&
    request.headers.get("x-admin-password") === ADMIN_PASSWORD
  );
}
