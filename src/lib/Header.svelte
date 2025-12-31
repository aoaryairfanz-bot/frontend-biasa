<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation'; 
    import { HomeIcon, ShoppingBagIcon, MapPinIcon, HelpCircleIcon, SearchIcon } from 'svelte-feather-icons';

    let searchQuery = $state(""); 

    function handleSearch() {
        if (searchQuery.trim() !== "") {
            goto(`/katalog?search=${encodeURIComponent(searchQuery)}`);
        }
    }

    function handleKeyDown(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    }

    const mobileMenus = [
        { label: 'Home', link: '/', icon: HomeIcon },
        { label: 'Produk', link: '/katalog', icon: ShoppingBagIcon },
        { label: 'Cabang', link: '/cabang', icon: MapPinIcon },
        { label: 'Bantuan', link: '/bantuan', icon: HelpCircleIcon }
    ];

    // Optimasi Logo Narwastu (Kecil & Ringan)
    // h_60 = Tinggi 60px (Cukup untuk retina display)
    // q_auto:eco = Kompresi agresif
    // f_auto = Format WebP otomatis
    const logoUrl = "https://res.cloudinary.com/dqyztrelw/image/upload/h_60,q_auto:eco,f_auto/v1766051198/favicon_jgz09p.png";
</script>

<header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 font-sans">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between gap-2 md:gap-4">
        
        <a href="/" class="flex items-center gap-2 flex-shrink-0 group">
            <div class="relative">
                <img 
                    src={logoUrl} 
                    alt="Narwastu Logo" 
                    width="32" height="32"
                    class="h-5 w-auto md:h-7 transition-transform duration-500 group-hover:scale-105" 
                />
            </div>
            
            <span 
                class="text-lg md:text-xl tracking-tight hidden lg:block bg-gradient-to-r from-[#8B0000] via-[#FFD700] to-[#C4161C] bg-clip-text text-transparent drop-shadow-sm animate-gradient italic"
                style="font-family: 'Cinzel', serif; font-weight: 700; background-size: 200% auto; text-transform: lowercase;"
            >
                narwastu
            </span>
        </a>

        <div class="flex-grow max-w-xl md:mx-4">
            <div class="relative">
                <input 
                    type="text" 
                    bind:value={searchQuery}
                    onkeydown={handleKeyDown}
                    placeholder="Cari..." 
                    class="w-full bg-gray-50 text-gray-700 text-xs md:text-sm py-2 px-4 pl-4 pr-9 border border-transparent focus:outline-none focus:ring-1 focus:ring-[#C4161C]/20 focus:border-[#C4161C] focus:bg-white transition-all duration-300 rounded-lg"
                />
                <button 
                    onclick={handleSearch}
                    aria-label="Cari"
                    class="absolute right-1 top-1/2 transform -translate-y-1/2 p-1.5 bg-[#C4161C] text-white hover:bg-[#a51318] transition shadow-sm active:scale-90 rounded-md"
                >
                    <SearchIcon size="14" />
                </button>
            </div>
        </div>

        <nav class="hidden md:flex items-center flex-shrink-0 gap-6">
            <div class="flex gap-6 text-sm">
                <a href="/katalog" 
                   class="transition-all duration-300 capitalize {$page.url.pathname.startsWith('/katalog') ? 'text-[#C4161C] font-bold' : 'text-gray-500 hover:text-[#C4161C]'}">
                    Katalog
                </a>
                <a href="/cabang" 
                   class="transition-all duration-300 capitalize {$page.url.pathname.startsWith('/cabang') ? 'text-[#C4161C] font-bold' : 'text-gray-500 hover:text-[#C4161C]'}">
                    Cabang
                </a>
                <a href="/bantuan" 
                   class="transition-all duration-300 {$page.url.pathname.startsWith('/bantuan') ? 'text-[#C4161C] font-bold' : 'text-gray-500 hover:text-[#C4161C]'}">
                    Cara Pesan
                </a>
            </div>

            <div class="h-5 w-px bg-gray-200"></div>

            <a href="/katalog" class="text-xs font-bold text-white bg-[#C4161C] hover:bg-[#a51318] px-5 py-2 rounded-lg transition-all shadow-md active:scale-95">
                Belanja
            </a>
        </nav>
    </div>
</header>

<div class="md:hidden fixed bottom-4 left-4 right-4 bg-white/90 backdrop-blur-lg border border-gray-100 px-6 py-3 z-50 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
    <div class="flex justify-between items-center">
        {#each mobileMenus as menu}
            <a href={menu.link} class="flex flex-col items-center gap-1 group transition-all duration-300">
                <div class="p-1 transition-transform duration-300 group-active:scale-75 {($page.url.pathname === menu.link || ($page.url.pathname.startsWith(menu.link) && menu.link !== '/')) ? 'text-[#C4161C]' : 'text-gray-400'}">
                    <menu.icon size="20" />
                </div>
                <span class="text-[10px] font-medium transition-colors {($page.url.pathname === menu.link || ($page.url.pathname.startsWith(menu.link) && menu.link !== '/')) ? 'text-[#C4161C] font-bold' : 'text-gray-400'}">
                    {menu.label}
                </span>
            </a>
        {/each}
    </div>
</div>

<style>
    @keyframes gradient {
        0% { background-position: 0% center; }
        50% { background-position: 100% center; }
        100% { background-position: 0% center; }
    }
    .animate-gradient {
        animation: gradient 4s ease infinite;
    }
    
    :global(body) {
        padding-bottom: 90px;
        background-color: #ffffff;
    }
    @media (min-width: 768px) {
        :global(body) {
            padding-bottom: 0;
        }
    }
</style>