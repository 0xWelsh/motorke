import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.welshmotorhub.app',
  appName: 'Welsh Motorhub',
  webDir: '.next',
  server: {
    url: process.env.CAP_SERVER_URL || 'http://10.0.2.2:3000',
    cleartext: true,
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
    },
  },
  ios: {
    scheme: 'Welsh Motorhub',
  },
};

export default config;
