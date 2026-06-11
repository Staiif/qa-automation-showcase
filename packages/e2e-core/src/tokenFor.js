/** Mirrors the API's token scheme so tests can seed a session without a UI login. */
export function tokenFor(email) {
  return `tok_${Buffer.from(email).toString('base64')}`;
}
