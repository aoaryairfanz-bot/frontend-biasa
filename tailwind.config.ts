// import type { Config } from 'tailwindcss';

// export default {
// 	content: ['./src/**/*.{html,js,svelte,ts}'],

// 	theme: {
// 		extend: {}
// 	},

// 	plugins: []
// } as Config;

import type { Config } from 'tailwindcss';

export default {
    content: ['./src/**/*.{html,js,svelte,ts}'],

    theme: {
        extend: {
            // --- BAGIAN TAMBAHAN ---
            fontFamily: {
                // Mendaftarkan font Cinzel agar bisa dipanggil dengan class="font-cinzel"
                cinzel: ['Cinzel', 'serif'],

                // (Opsional) Memastikan font teks biasa menggunakan font sistem yang bersih
                sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
            }
            // -----------------------
        }
    },

    plugins: []
} as Config;