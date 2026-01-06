<script>
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/stores';
    import { fly, fade } from 'svelte/transition';
    
    // Import Icons
    import { 
        HomeIcon, BoxIcon, ImageIcon, MapPinIcon, 
        UsersIcon, LogOutIcon, ChevronDownIcon, BellIcon, HelpCircleIcon,
        MenuIcon, XIcon
    } from 'svelte-feather-icons';

    // Svelte 5 Props
    let { children } = $props();
    
    let userRole = $state('');
    let fullName = $state(''); // Variabel untuk Nama Lengkap
    let token = $state('');
    let isSidebarOpen = $state(false); // State untuk Sidebar Mobile

    onMount(() => {
        token = localStorage.getItem('token');
        userRole = localStorage.getItem('role') || 'Admin';
        
        // AMBIL DATA FULL NAME DARI LOCALSTORAGE
        // Jika tidak ada, fallback ke 'Admin'
        fullName = localStorage.getItem('full_name') || 'Admin';

        if (!token) {
            goto('/login');
        }
    });

    function logout() {
        if(confirm("Apakah Anda yakin ingin keluar?")) {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('full_name'); // Hapus full_name juga saat logout
            goto('/login');
        }
    }

    function toggleSidebar() {
        isSidebarOpen = !isSidebarOpen;
    }

    // Helper untuk menandai menu aktif
    function isActive(path) {
        return $page.url.pathname.startsWith(path) 
            ? 'bg-gray-800 text-white' 
            : 'text-gray-400 hover:bg-gray-800 hover:text-white';
    }

    // Tutup sidebar otomatis saat pindah halaman (di mobile)
    $effect(() => {
        if ($page.url.pathname) {
            isSidebarOpen = false;
        }
    });
</script>

<div class="flex h-screen bg-[#F5F6FA] font-sans overflow-hidden relative">
    
    {#if isSidebarOpen}
        <div 
            onclick={toggleSidebar}
            transition:fade={{duration: 200}}
            class="fixed inset-0 bg-black/50 z-30 lg:hidden glass-effect"
        ></div>
    {/if}

    <aside class="
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-[#1E1E2D] text-white flex flex-col flex-shrink-0 
        transition-transform duration-300 ease-in-out
        {isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    ">
        <div class="h-16 lg:h-20 flex items-center justify-between px-6 border-b border-gray-800 lg:border-none">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 lg:w-10 lg:h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                    <span class="text-lg lg:text-xl font-bold text-white">NK</span>
                </div>
                <span class="text-base lg:text-lg font-bold tracking-wide text-gray-100">Narwastu</span>
            </div>
            <button onclick={toggleSidebar} class="lg:hidden text-gray-400 hover:text-white">
                <XIcon size="20" />
            </button>
        </div>

        <nav class="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            <div class="mb-4 px-2 text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider">
                Main Menu
            </div>

            <a href="/warung_kopi" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm {isActive('/warung_kopi') && $page.url.pathname === '/warung_kopi' ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20' : 'text-gray-400 hover:bg-gray-800 hover:text-white'}">
                <HomeIcon size="18" />
                <span>Dashboard</span>
            </a>

            <div class="mt-6 mb-4 px-2 text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider">
                Manajemen Data
            </div>

            <a href="/warung_kopi/cabang" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm {isActive('/warung_kopi/cabang')}">
                <MapPinIcon size="18" />
                <span>Cabang Toko</span>
            </a>

            <a href="/warung_kopi/produk" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm {isActive('/warung_kopi/produk')}">
                <BoxIcon size="18" />
                <span>Produk</span>
            </a>

            <a href="/warung_kopi/banner" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm {isActive('/warung_kopi/banner')}">
                <ImageIcon size="18" />
                <span>Banner & Promo</span>
            </a>
            
            {#if userRole === 'super_admin'}
            <div class="mt-6 mb-4 px-2 text-[10px] lg:text-xs font-bold text-gray-500 uppercase tracking-wider">
                Super Admin
            </div>
            <a href="/warung_kopi/users" class="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium text-sm {isActive('/warung_kopi/users')}">
                <UsersIcon size="18" />
                <span>Kelola Pengguna</span>
            </a>
            {/if}
        </nav>

        <div class="p-4 mt-auto border-t border-gray-800">
             <button onclick={logout} class="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-500 rounded-xl transition-colors font-medium text-sm">
                <LogOutIcon size="18" />
                <span>Keluar</span>
            </button>
        </div>
    </aside>

    <main class="flex-1 flex flex-col overflow-hidden relative z-10 w-full">
        
        <header class="h-16 lg:h-20 bg-white border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 flex-shrink-0 shadow-sm lg:shadow-none">
            
            <div class="flex items-center gap-3 lg:gap-0">
                <button onclick={toggleSidebar} class="lg:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg">
                    <MenuIcon size="24" />
                </button>

                <div>
                    <h1 class="text-lg lg:text-2xl font-bold text-gray-800 truncate max-w-[200px] lg:max-w-none">
                        Halo, <span class="text-blue-600">{fullName}</span>! 👋
                    </h1>
                    <p class="hidden lg:block text-sm text-gray-500 mt-1">Berikut ringkasan aktivitas toko Anda hari ini.</p>
                </div>
            </div>

            <div class="flex items-center gap-3 lg:gap-6">
                <div class="hidden sm:flex items-center gap-2">
                    <button class="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition">
                        <HelpCircleIcon size="18" />
                    </button>
                    <button class="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-full bg-gray-50 text-gray-500 hover:bg-gray-100 transition relative">
                        <BellIcon size="18" />
                        <span class="absolute top-2 right-2.5 w-2 h-2 bg-red-500 border border-white rounded-full"></span>
                    </button>
                </div>

                <div class="flex items-center gap-3 pl-3 lg:pl-6 border-l border-gray-100">
                    <div class="hidden lg:block text-right">
                        <div class="text-sm font-bold text-gray-800 capitalize">{fullName}</div>
                        <div class="text-xs text-green-500 font-medium flex items-center justify-end gap-1">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Online
                        </div>
                    </div>
                    <div class="w-9 h-9 lg:w-11 lg:h-11 rounded-full bg-gray-200 border-2 border-blue-50 overflow-hidden cursor-pointer hover:border-blue-200 transition">
                        <img src="https://ui-avatars.com/api/?name={fullName}&background=0D8ABC&color=fff" alt="Profile" class="w-full h-full object-cover" />
                    </div>
                </div>
            </div>
        </header>

        <div class="flex-1 overflow-x-hidden overflow-y-auto bg-[#F5F6FA] p-4 lg:p-8 custom-scrollbar">
            {@render children()}
        </div>
    </main>
</div>

<style>
    /* Custom Scrollbar yang lebih halus */
    .custom-scrollbar::-webkit-scrollbar {
        width: 5px;
        height: 5px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
        background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #363649; /* Warna gelap agar match sidebar */
        border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #4B4B60;
    }
    /* Untuk Firefox */
    .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: #363649 transparent;
    }
</style>