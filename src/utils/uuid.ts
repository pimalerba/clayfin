import * as Crypto from 'expo-crypto';

export function generateId(): string {
  try {
    return Crypto.randomUUID();
  } catch {
    // Fallback RFC4122 v4 para ambientes de teste
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
