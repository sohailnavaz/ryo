import type { Config } from 'tailwindcss';
import preset from '@bnb/config/tailwind';

const config: Config = {
  presets: [preset as Config],
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    '../../packages/ui/src/**/*.{ts,tsx}',
    '../../packages/features/src/**/*.{ts,tsx}',
  ],
  plugins: [],
};

export default config;
