import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.abrarjamil.tasklist',
  appName: 'কাজের তালিকা ও রিমাইন্ডার',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
