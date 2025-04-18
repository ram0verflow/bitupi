import crypto from 'crypto';

/**
 * Generate a random security key
 * @returns A random security key
 */
export function generateSecurityKey(): string {
  return crypto.randomBytes(16).toString('hex');
}

/**
 * Generate a set of security keys for multi-signature authentication
 * @returns Security keys for an order
 */
export function generateSecurityKeys() {
  return {
    buyerKey: generateSecurityKey(),
    systemKey: generateSecurityKey(),
    sharedSecret: generateSecurityKey(),
  };
}

/**
 * Create a refund key for processing refunds
 * @returns A random refund key
 */
export function generateRefundKey(): string {
  return crypto.randomBytes(12).toString('hex');
}

/**
 * Generate a SHA-256 hash of combined keys for verification
 * @param buyerKey - The buyer's key
 * @param earnerKey - The earner's key
 * @param systemKey - The system key
 * @returns A hash of the combined keys
 */
export function generateMultiSigHash(buyerKey: string, earnerKey: string, systemKey: string): string {
  return crypto
    .createHash('sha256')
    .update(`${buyerKey}:${earnerKey}:${systemKey}`)
    .digest('hex');
}

/**
 * Verify a multi-signature authentication
 * @param buyerKey - The buyer's key
 * @param earnerKey - The earner's key
 * @param systemKey - The system key
 * @param sharedSecret - The shared secret to verify against
 * @returns Boolean indicating whether verification passed
 */
export function verifyMultiSigKeys(
  buyerKey: string,
  earnerKey: string,
  systemKey: string,
  sharedSecret: string
): boolean {
  const hash = generateMultiSigHash(buyerKey, earnerKey, systemKey);
  return crypto.timingSafeEqual(
    Buffer.from(hash),
    Buffer.from(sharedSecret)
  );
}

/**
 * Generate a tracking token for browser storage
 * @param orderId - The order ID
 * @param userType - The type of user (buyer or earner)
 * @param userKey - The user's security key
 * @returns A tracking token
 */
export function generateTrackingToken(orderId: string, userType: 'buyer' | 'earner', userKey: string): string {
  return Buffer.from(JSON.stringify({
    id: orderId,
    type: userType,
    key: userKey,
    created: Date.now()
  })).toString('base64');
}

/**
 * Parse a tracking token
 * @param token - The tracking token to parse
 * @returns The parsed token data or null if invalid
 */
export function parseTrackingToken(token: string): { id: string; type: 'buyer' | 'earner'; key: string; created: number } | null {
  try {
    const data = JSON.parse(Buffer.from(token, 'base64').toString());
    if (!data.id || !data.type || !data.key || !data.created) {
      return null;
    }
    return data;
  } catch (error) {
    return null;
  }
}