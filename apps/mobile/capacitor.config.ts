import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.momentum.app',
  appName: 'Momentum',
  webDir: 'dist/apps/mobile',
  server: {
    // En dev, pointer vers le backend local
    // androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0D1B4B',
      androidScaleType: 'CENTER_CROP',
    }
  }
};

export default config;
