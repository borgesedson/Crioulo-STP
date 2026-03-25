import { createClient } from '@insforge/sdk';

const baseUrl = import.meta.env.VITE_INSFORGE_BASE_URL;
const anonKey = import.meta.env.VITE_INSFORGE_ANON_KEY;

if (!baseUrl || !anonKey) {
  throw new Error('InsForge variables are missing. Please check your .env file.');
}

export const insforge = createClient({
  baseUrl,
  anonKey,
});
