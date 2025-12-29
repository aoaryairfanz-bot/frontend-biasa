<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    
    // Import Icons
    import { 
        HomeIcon, BoxIcon, ImageIcon, MapPinIcon, 
        UsersIcon, LogOutIcon, ChevronDownIcon, BellIcon, HelpCircleIcon
    } from 'svelte-feather-icons';

    // Svelte 5 Props
    let { children } = $props();
    
    let userRole = '';
    let token = '';

    onMount(() => {
        token = localStorage.getItem('token');
        userRole = localStorage.getItem('role') || 'Admin';

        if (!token) {
            goto('/login');
        }
    });

    function logout() {
        if(confirm("Apakah Anda yakin ingin keluar?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            goto('/login');
        }
    }

    // Helper untuk menandai menu aktif
    function isActive(path) {
        return $page.url.pathname.startsWith(path) 
            ? 'bg-gray-800 text-white' 
            : 'text-gray-400 hover:bg-gray-800 hover:text-white';
    }
</script>

<div class="flex h-screen bg-[#F5F6FA] font-sans overflow-hidden">
    <aside class="w-64 bg-[#1E1E2D] text-white flex flex-col flex-shrink-0 transition-all duration-300 relative z-20">
        <div class="h-20 flex items-center px-6">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <span class="text-xl font-bold">NK</span>
                </div>
                <span class="text-lg font-bold tracking-wide">Narwastu</span>
            </div>
        </div>

        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            <div class="mb-4 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Main Menu
            </div>

            <a href="/warung_kopi" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium {isActive('/warung_kopi') && $page.url.pathname === '/warung_kopi' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}">
                <HomeIcon size="20" />
                <span>Dashboard</span>
            </a>

            <div class="mt-6 mb-4 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Manajemen Data
            </div>

            <a href="/warung_kopi/cabang" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium {isActive('/warung_kopi/cabang')}">
                <MapPinIcon size="20" />
                <span>Cabang Toko</span>
            </a>

            <a href="/warung_kopi/produk" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium {isActive('/warung_kopi/produk')}">
                <BoxIcon size="20" />
                <span>Produk</span>
            </a>

            <a href="/warung_kopi/banner" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium {isActive('/warung_kopi/banner')}">
                <ImageIcon size="20" />
                <span>Banner & Promo</span>
            </a>
            
            {#if userRole === 'super_admin'}
            <div class="mt-6 mb-4 px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Super Admin
            </div>
            <a href="/warung_kopi/users" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-medium {isActive('/warung_kopi/users')}">
                <UsersIcon size="20" />
                <span>Kelola Pengguna</span>
            </a>
            {/if}
        </nav>

        <div class="p-4 mt-auto">
            <button on:click={logout} class="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors font-medium">
                <LogOutIcon size="20" />
                <span>Keluar</span>
            </button>
        </div>
    </aside>


    <main class="flex-1 flex flex-col overflow-hidden relative z-10">
        
        <header class="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-8 flex-shrink-0">
            <div>
                <h1 class="text-2xl font-bold text-gray-800">
                    Selamat Datang, <span class="text-blue-600">{userRole}</span>!
                </h1>
                <p class="text-sm text-gray-500 mt-1">Berikut ringkasan aktivitas toko Anda hari ini.</p>
            </div>

            <div class="flex items-center gap-6">
                <div class="flex items-center gap-2">
                    <button class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition">
                        <HelpCircleIcon size="20" />
                    </button>
                    <button class="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 transition relative">
                        <BellIcon size="20" />
                        <span class="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
                    </button>
                </div>

                <div class="flex items-center gap-3 pl-6 border-l border-gray-100">
                    <div class="text-right">
                        <div class="text-sm font-bold text-gray-800 capitalize">{userRole}</div>
                        <div class="text-xs text-green-500 font-medium flex items-center justify-end gap-1">
                            <span class="w-2 h-2 bg-green-500 rounded-full"></span>
                            Online
                        </div>
                    </div>
                    <div class="w-12 h-12 rounded-full bg-gray-200 border-2 border-blue-100 overflow-hidden">
                        <img src="https://ui-avatars.com/api/?name={userRole}&background=0D8ABC&color=fff" alt="Profile" class="w-full h-full object-cover" />
                    </div>
                    <button class="text-gray-400 hover:text-gray-600">
                        <ChevronDownIcon size="16" />
                    </button>
                </div>
            </div>
        </header>

        <div class="flex-1 overflow-x-hidden overflow-y-auto bg-[#F5F6FA] p-8 custom-scrollbar">
            {@render children()}
        </div>
    </main>
</div>

<style>
    /* Custom Scrollbar yang lebih halus */
    .custom-scrollbar::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #e2e8f0;
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #cbd5e1;
    }
    /* Untuk Firefox */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #e2e8f0 transparent;
    }
</style>