<script>
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

{@render children()}