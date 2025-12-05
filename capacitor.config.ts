import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.koudai.studytool',
  appName: '勉強時間割振ツール',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '713436990234-4d53kon3vjgm6m4sm7e93apn5lhb5crr.apps.googleusercontent.com', // Firebase Consoleの「Authentication」→「Sign-in method」→「Google」で確認できる「Web SDK configuration」のWeb client ID
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
