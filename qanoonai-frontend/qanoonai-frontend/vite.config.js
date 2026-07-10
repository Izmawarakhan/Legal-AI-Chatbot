// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vite.dev/config/
// export default defineConfig({
//   plugins: [react()],
// })

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // or '0.0.0.0'
    allowedHosts: [
      'fyp.creoation.com',
      '.creoation.com',
      '.ngrok-free.dev',
      'localhost'
    ],
    
    // Optional: If you want to allow ALL hosts (not recommended for production)
    // allowedHosts: 'all'
  }
})