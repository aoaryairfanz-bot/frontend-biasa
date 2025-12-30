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
        { 
            label: 'Home', 
            link: '/', 
            // Lucide House
            icon: '<path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>' 
        },
        { 
            label: 'Produk', 
            link: '/katalog', 
            // Lucide Shopping Bag
            icon: '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>' 
        },
        { 
            label: 'Cabang', 
            link: '/cabang', 
            // Lucide Map Pin House
            icon: '<path d="M15 22a1 1 0 0 1-1-1v-4a1 1 0 0 1 .445-.832l3-2a1 1 0 0 1 1.11 0l3 2A1 1 0 0 1 22 17v4a1 1 0 0 1-1 1z"/><path d="M18 10a8 8 0 0 0-16 0c0 4.993 5.539 10.193 7.399 11.799a1 1 0 0 0 .601.2"/><path d="M18 22v-3"/><circle cx="10" cy="10" r="3"/>' 
        },
        { 
            label: 'Bantuan', 
            link: '/bantuan', 
            // Lucide Heart Handshake
            icon: '<path d="M19.414 14.414C21 12.828 22 11.5 22 9.5a5.5 5.5 0 0 0-9.591-3.676.6.6 0 0 1-.818.001A5.5 5.5 0 0 0 2 9.5c0 2.3 1.5 4 3 5.5l5.535 5.362a2 2 0 0 0 2.879.052 2.12 2.12 0 0 0-.004-3 2.124 2.124 0 1 0 3-3 2.124 2.124 0 0 0 3.004 0 2 2 0 0 0 0-2.828l-1.881-1.882a2.41 2.41 0 0 0-3.409 0l-1.71 1.71a2 2 0 0 1-2.828 0 2 2 0 0 1 0-2.828l2.823-2.762z"/>' 
        }
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
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        {@html menu.icon}
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