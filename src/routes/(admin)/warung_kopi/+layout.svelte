<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { fly, fade } from 'svelte/transition';
    
    // Import Icons
    import { 
        HomeIcon, BoxIcon, ImageIcon, MapPinIcon, 
        UsersIcon, LogOutIcon, BellIcon, HelpCircleIcon,
        MenuIcon, XIcon, TagIcon 
    } from 'svelte-feather-icons';

    // Svelte 5 Props
    let { children } = $props();
    
    let userRole = $state('');
    let fullName = $state('');
    let token = $state('');
    let isSidebarOpen = $state(false); 

    onMount(() => {
        token = localStorage.getItem('token');
        userRole = localStorage.getItem('role') || 'Admin';
        fullName = localStorage.getItem('full_name') || 'Admin';

        if (!token) {
            goto('/login');
        }
    });

    function logout() {
        if(confirm("Apakah Anda yakin ingin keluar?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('full_name');
            goto('/login');
        }
    }

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }

    function isActive(path) {
        return $page.url.pathname.startsWith(path) 
            ? 'bg-blue-50 text-blue-600 font-bold' 
            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium';
    }

    $effect(() => {
        if ($page.url.pathname) {
            isSidebarOpen = false;
        }
    });
</script>

<svelte:head>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
</svelte:head>

<div class="flex h-screen bg-[#F8F9FC] overflow-hidden relative text-gray-800">
    
    {#if isSidebarOpen}
        <div 
            onclick={toggleSidebar}
            transition:fade={{duration: 200}}
            class="fixed inset-0 bg-black/20 z-30 lg:hidden backdrop-blur-sm"
        ></div>
    {/if}

    <aside class="
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-white border-r border-gray-100 flex flex-col flex-shrink-0 
        transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
        {isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    ">
        <div class="h-16 lg:h-20 flex items-center justify-between px-6">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-md shadow-blue-200">
                    <span class="font-bold text-sm" style="font-family: ui-sans-serif, system-ui, sans-serif;">NS</span>
                </div>
                <span class="text-lg font-bold tracking-tight text-gray-800" style="font-family: ui-sans-serif, system-ui, sans-serif;">
                    Narwastu
                </span>
            </div>
            <button onclick={toggleSidebar} class="lg:hidden text-gray-400 hover:text-gray-600">
                <XIcon size="20" />
            </button>
        </div>

        <nav class="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            
            <a href="/warung_kopi" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm {isActive('/warung_kopi') && $page.url.pathname === '/warung_kopi' ? 'bg-blue-50 text-blue-600 font-bold' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}">
                <HomeIcon size="18" />
                <span>Dashboard</span>
            </a>

            <div class="mt-8 mb-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Manajemen
            </div>

            <a href="/warung_kopi/cabang" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm {isActive('/warung_kopi/cabang')}">
                <MapPinIcon size="18" />
                <span>Cabang Toko</span>
            </a>

            <a href="/warung_kopi/produk" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm {isActive('/warung_kopi/produk')}">
                <BoxIcon size="18" />
                <span>Produk</span>
            </a>

            <!-- <a href="/warung_kopi/diskon" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm {isActive('/warung_kopi/diskon')}">
                <TagIcon size="18" />
                <span>Kelola Diskon</span>
            </a> -->

            <a href="/warung_kopi/banner" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm {isActive('/warung_kopi/banner')}">
                <ImageIcon size="18" />
                <span>Banner & Promo</span>
            </a>
            
            {#if userRole === 'super_admin'}
            <div class="mt-8 mb-3 px-3 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                System
            </div>
            <a href="/warung_kopi/users" class="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 text-sm {isActive('/warung_kopi/users')}">
                <UsersIcon size="18" />
                <span>Pengguna</span>
            </a>
            {/if}
        </nav>

        <div class="p-4 border-t border-gray-50">
             <button onclick={logout} class="w-full flex items-center gap-3 px-3 py-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors font-medium text-sm group">
                <LogOutIcon size="18" class="group-hover:text-red-600"/>
                <span>Keluar</span>
            </button>
        </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        
        <header class="h-16 lg:h-20 bg-white/80 backdrop-blur-sm border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 sticky top-0 z-20">
            
            <div class="flex items-center gap-3 lg:gap-0">
                <button onclick={toggleSidebar} class="lg:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-50 rounded-lg">
                    <MenuIcon size="24" />
                </button>

                <div class="flex flex-col">
                    <h1 class="text-sm lg:text-base font-bold text-gray-800">
                        Halo, {fullName}
                    </h1>
                    <span class="text-xs text-gray-400 font-medium">Administrator</span>
                </div>
            </div>

            <div class="flex items-center gap-4">
                <div class="hidden sm:flex items-center gap-1">
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition">
                        <HelpCircleIcon size="18" />
                    </button>
                    <button class="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition relative">
                        <BellIcon size="18" />
                        <span class="absolute top-2 right-2.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-white"></span>
                    </button>
                </div>

                <div class="h-8 w-px bg-gray-100 mx-2 hidden sm:block"></div>

                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 lg:w-9 lg:h-9 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs ring-2 ring-white shadow-sm cursor-pointer hover:ring-blue-50 transition">
                        {fullName.charAt(0)}
                    </div>
                </div>
            </div>
        </header>

        <div class="flex-1 overflow-x-hidden overflow-y-auto bg-[#F8F9FC] p-4 lg:p-8 custom-scrollbar">
            <div class="max-w-7xl mx-auto">
                {@render children()}
            </div>
        </div>
    </main>
</div>

<style>
    /* [BARU] Apply Poppins Secara Global */
    :global(body) {
        font-family: 'Poppins', sans-serif;
    }

    .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
        height: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #E2E8F0; 
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #CBD5E1;
    }
</style>