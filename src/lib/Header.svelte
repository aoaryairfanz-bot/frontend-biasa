<script>
    import { page } from '$app/stores';
    import { goto } from '$app/navigation'; 

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
        { label: 'home', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', link: '/' },
        { label: 'katalog', icon: 'M4 6h16M4 12h16M4 18h16', link: '/katalog' },
        { label: 'cabang', icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z', link: '/cabang' },
        { label: 'pesan', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z', link: '/bantuan' }
    ];
</script>

<header class="sticky top-0 z-50 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100 font-sans">
    <div class="container mx-auto px-4 py-3 flex items-center justify-between gap-2 md:gap-4">
        
        <a href="/" class="flex items-center gap-2 flex-shrink-0 group">
            <div class="relative">
                <img 
                    src="https://res.cloudinary.com/dqyztrelw/image/upload/v1766051198/favicon_jgz09p.png" 
                    alt="Narwastu Logo" 
                    class="h-6 w-auto md:h-8 transition-transform duration-500 group-hover:scale-105" 
                />
            </div>
            
            <span 
                class="text-xl tracking-tight hidden lg:block bg-gradient-to-r from-[#8B0000] via-[#FFD700] to-[#C4161C] bg-clip-text text-transparent drop-shadow-sm animate-gradient italic"
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
                    class="w-full bg-gray-50 text-gray-700 text-xs md:text-sm py-2 px-5 border border-transparent focus:outline-none focus:ring-2 focus:ring-[#C4161C]/20 focus:border-[#C4161C] focus:bg-white transition-all duration-300"
                    style="border-radius: 8px;"
                />
                <button 
                    onclick={handleSearch}
                    class="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 md:p-1.5 bg-[#C4161C] text-white hover:bg-[#a51318] transition shadow-sm active:scale-90"
                    style="border-radius: 6px;">
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5 md:h-4 md:w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </div>
        </div>

        <nav class="hidden md:flex items-center flex-shrink-0 gap-6">
            <div class="flex gap-6 text-sm">
                <a href="/katalog" 
                   class="transition-all duration-300 capitalize {$page.url.pathname.startsWith('/katalog') ? 'text-[#C4161C] font-bold' : 'text-gray-500 hover:text-[#C4161C]'}">
                    katalog
                </a>
                <a href="/cabang" 
                   class="transition-all duration-300 capitalize {$page.url.pathname.startsWith('/cabang') ? 'text-[#C4161C] font-bold' : 'text-gray-500 hover:text-[#C4161C]'}">
                    cabang
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
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d={menu.icon} />
                    </svg>
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