<script>
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { 
        PackageIcon, UsersIcon, MapPinIcon, 
        AlertCircleIcon, MoreHorizontalIcon, ArrowUpRightIcon 
    } from 'svelte-feather-icons';

    // --- STATE ---
    let totalProducts = $state(0);
    let totalUsers = $state(0);
    let totalBranches = $state(0);
    let lowStockItems = $state([]);
    let isLoading = $state(true);

    // --- FETCH DATA ---
    onMount(async () => {
        try {
            await Promise.all([
                fetchProducts(),
                fetchUsers(),
                fetchBranches()
            ]);
        } catch (e) {
            console.error("Gagal load dashboard:", e);
        } finally {
            isLoading = false;
        }
    });

    async function fetchProducts() {
        const res = await fetch(`${PUBLIC_API_URL}/products/`);
        if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.products || []);
            
            totalProducts = list.length;
            
            // Filter stok menipis (misal stok < 5)
            lowStockItems = list
                .filter(p => (p.stock || 0) < 5)
                .sort((a, b) => a.stock - b.stock)
                .slice(0, 5); // Ambil 5 teratas
        }
    }

    async function fetchUsers() {
        // Asumsi API user ada, dan butuh token (biasanya)
        const token = localStorage.getItem('token');
        if(!token) return;

        const res = await fetch(`${PUBLIC_API_URL}/users`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.users || []);
            totalUsers = list.length;
        }
    }

    async function fetchBranches() {
        const res = await fetch(`${PUBLIC_API_URL}/branches`);
        if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.data || []);
            totalBranches = list.length;
        }
    }

    // --- DERIVED STATS ---
    // Menggunakan $derived agar reaktif jika data berubah
    const stats = $derived([
        { 
            title: 'Total Produk', 
            value: isLoading ? '...' : totalProducts, 
            desc: 'Item terdaftar', 
            bg: 'bg-[#FEF3C7]', 
            text: 'text-[#D97706]', 
            icon: PackageIcon 
        },
        { 
            title: 'Total Pengguna', 
            value: isLoading ? '...' : totalUsers, 
            desc: 'Admin & Staff', 
            bg: 'bg-[#DBEAFE]', 
            text: 'text-[#2563EB]', 
            icon: UsersIcon 
        },
        { 
            title: 'Total Cabang', 
            value: isLoading ? '...' : totalBranches, 
            desc: 'Lokasi Aktif', 
            bg: 'bg-[#F3E8FF]', 
            text: 'text-[#9333EA]', 
            icon: MapPinIcon 
        }
    ]);
</script>

<div class="space-y-8">
    
    <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
            <h2 class="text-xl font-bold text-gray-800">Overview Toko</h2>
            <p class="text-sm text-gray-500">Ringkasan data Narwastu Store.</p>
        </div>
        <button onclick={() => window.location.reload()} class="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-200 flex items-center gap-2 active:scale-95">
            <ArrowUpRightIcon size="16" />
            <span>Refresh Data</span>
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each stats as stat}
        <div class="p-6 rounded-3xl {stat.bg} transition hover:-translate-y-1 hover:shadow-md duration-300">
            <div class="flex justify-between items-start mb-8">
                <div class="p-3 bg-white/60 rounded-xl backdrop-blur-sm {stat.text}">
                    <svelte:component this={stat.icon} size="24" />
                </div>
            </div>
            <div>
                <p class="text-sm font-semibold text-gray-600 mb-1">{stat.title}</p>
                <div class="flex items-end gap-3">
                    <h3 class="text-3xl font-bold text-gray-900">{stat.value}</h3>
                    <span class="text-xs font-medium text-gray-500 mb-1.5">
                        {stat.desc}
                    </span>
                </div>
            </div>
        </div>
        {/each}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <div class="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <AlertCircleIcon size="18" class="text-red-500" />
                    Stok Menipis (Di Bawah 5)
                </h3>
                <a href="/warung_kopi/produk" class="text-sm text-blue-600 font-bold hover:underline">Kelola Stok</a>
            </div>

            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="text-gray-400 text-xs uppercase tracking-wider border-b border-gray-50">
                            <th class="pb-3 pl-2">Nama Produk</th>
                            <th class="pb-3">Kategori</th>
                            <th class="pb-3 text-center">Sisa Stok</th>
                            <th class="pb-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50">
                        {#if isLoading}
                            <tr><td colspan="4" class="py-4 text-center text-gray-400">Memuat data...</td></tr>
                        {:else if lowStockItems.length === 0}
                            <tr><td colspan="4" class="py-4 text-center text-green-500 font-medium">Semua stok aman! 🎉</td></tr>
                        {:else}
                            {#each lowStockItems as item}
                            <tr class="group hover:bg-gray-50 transition">
                                <td class="py-4 pl-2">
                                    <div class="font-bold text-gray-800 group-hover:text-blue-600 transition truncate max-w-[200px]">{item.name}</div>
                                </td>
                                <td class="py-4 text-sm text-gray-500">{item.category || '-'}</td>
                                <td class="py-4 text-center font-mono font-bold text-red-600">{item.stock}</td>
                                <td class="py-4 text-right">
                                    <span class="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-600">
                                        Segera Restock
                                    </span>
                                </td>
                            </tr>
                            {/each}
                        {/if}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="bg-gray-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col">
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            
            <div class="relative z-10 flex-1">
                <h3 class="text-lg font-bold mb-6">Info Sistem</h3>

                <div class="space-y-6">
                    <div class="flex gap-4">
                        <div class="flex flex-col items-center">
                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                            <div class="w-0.5 h-full bg-gray-700 my-1"></div>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-200">Sistem Berjalan Normal</p>
                            <p class="text-xs text-gray-400 mt-1">API Connected</p>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <div class="flex flex-col items-center">
                            <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <div class="w-0.5 h-full bg-gray-700 my-1"></div>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-200">Data Produk Terupdate</p>
                            <p class="text-xs text-gray-400 mt-1">Total {totalProducts} items</p>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <div class="flex flex-col items-center">
                            <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-200">User Aktif</p>
                            <p class="text-xs text-gray-400 mt-1">{totalUsers} akun terdaftar</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mt-auto pt-6 text-center text-xs text-gray-500 border-t border-gray-800">
                &copy; 2025 Narwastu Admin System
            </div>
        </div>

    </div>

</div>