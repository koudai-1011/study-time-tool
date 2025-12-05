import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koudai.studytool',
  appName: '勉強時間割振ツール',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: 'YOUR_WEB_CLIENT_ID_HERE.apps.googleusercontent.com', // Firebase Consoleの「Authentication」→「Sign-in method」→「Google」で確認できる「Web SDK configuration」のWeb client ID
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
