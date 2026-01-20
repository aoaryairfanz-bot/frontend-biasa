<!-- <script>
    import "../app.css"; 
    import logoUrl from '$lib/assets/favicon.png'; 
    import NProgress from 'nprogress';
    import 'nprogress/nprogress.css'; 
    import "@fontsource/cinzel/400.css";
    import "@fontsource/cinzel/700.css";
    import { navigating } from '$app/stores'; 

    // --- Svelte 5 Props ---
    let { children } = $props(); 

    NProgress.configure({ showSpinner: false, speed: 500 });

    $effect(() => {
        if ($navigating) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    });
</script>

<svelte:head>
    <title>Narwastu System</title>
    <link rel="icon" href={logoUrl} />
    <style>
        #nprogress .bar { background: #C4161C !important; height: 3px !important; }
        #nprogress .peg { box-shadow: 0 0 10px #C4161C, 0 0 5px #C4161C !important; }
    </style>
</svelte:head>

{@render children()} -->

<script>
    import "../app.css"; 
    import logoUrl from '$lib/assets/favicon.png'; 
    import NProgress from 'nprogress';
    import 'nprogress/nprogress.css'; 
    
    // Import Cinzel (Biarkan jika ingin dipakai khusus untuk Logo)
    import "@fontsource/cinzel/400.css";
    import "@fontsource/cinzel/700.css";
    
    import { navigating } from '$app/stores'; 

    // --- Svelte 5 Props ---
    let { children } = $props(); 

    NProgress.configure({ showSpinner: false, speed: 500 });

    $effect(() => {
        if ($navigating) {
            NProgress.start();
        } else {
            NProgress.done();
        }
    });
</script>

<svelte:head>
    <title>Narwastu System</title>
    <link rel="icon" href={logoUrl} />

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        /* Progress Bar Warna Merah Narwastu */
        #nprogress .bar { background: #C4161C !important; height: 3px !important; }
        #nprogress .peg { box-shadow: 0 0 10px #C4161C, 0 0 5px #C4161C !important; }

        /* [UTAMA] Set Poppins untuk Seluruh Web */
        :global(body) {
            font-family: 'Poppins', sans-serif;
            -webkit-font-smoothing: antialiased;
        }

        /* [PENGECUALIAN] Class khusus untuk Logo Narwastu */
        /* Gunakan class="font-logo" pada elemen teks Narwastu */
        :global(.font-logo) {
            font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif !important;
            /* Jika Baginda ingin logo pakai Cinzel, ganti baris atas dengan: */
            /* font-family: 'Cinzel', serif !important; */
        }
    </style>
</svelte:head>

{@render children()}