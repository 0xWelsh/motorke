import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bidgari.app',
  appName: 'BIDGARI',
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
    scheme: 'BIDGARI',
  },
};

export default config;
