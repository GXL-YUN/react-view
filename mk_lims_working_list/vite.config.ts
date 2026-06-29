import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/ekp_mkpass/mk_lims_working_list/',  //排班
  // base: '/ekp_mkpass/mk_lims_working_list_date/',     //考勤
  // base: '/ekp_mkpass/mk_lims_working_list_scheduling/',     //班组
  plugins: [react()],
  server: {
    port: 5000,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
