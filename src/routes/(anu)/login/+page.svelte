<script>
    import { AlertTriangleIcon, HomeIcon } from 'svelte-feather-icons';
    import "@fontsource/cinzel/700.css";
</script>

<svelte:head>
    <title>Under Maintenance - Narwastu</title>
</svelte:head>

<div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
    
    <div class="bg-red-50 p-6 rounded-full mb-6 animate-pulse">
        <AlertTriangleIcon size="64" class="text-[#C4161C]" />
    </div>

    <h1 class="text-3xl md:text-4xl text-gray-800 mb-4 font-cinzel font-bold">
        Sedang Dalam Perbaikan
    </h1>

    <p class="text-gray-500 max-w-md mb-8 leading-relaxed">
        Halaman Login sedang dinonaktifkan sementara untuk pemeliharaan sistem keamanan. 
        Silakan kembali lagi nanti atau hubungi admin jika ada keperluan mendesak.
    </p>

    <a href="/" class="flex items-center gap-2 px-6 py-3 bg-[#C4161C] text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg hover:shadow-red-200 active:scale-95">
        <HomeIcon size="18" />
        <span>Kembali ke Beranda</span>
    </a>

    <div class="mt-12 text-xs text-gray-400">
        &copy; 2025 Narwastu System
    </div>

</div>