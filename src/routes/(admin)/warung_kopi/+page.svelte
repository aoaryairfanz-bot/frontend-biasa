<script>
    // Import Icon
    import { 
        DollarSignIcon, ShoppingCartIcon, TrendingUpIcon, 
        AlertCircleIcon, MoreHorizontalIcon, ArrowUpRightIcon, PackageIcon
    } from 'svelte-feather-icons';

    // --- DUMMY DATA (Nanti diganti pakai data API load function) ---
    // Simulasi data ringkasan
    let stats = [
        { title: 'Omset Hari Ini', value: 'Rp 1.250.000', trend: '+12%', bg: 'bg-[#FEF3C7]', text: 'text-[#D97706]', icon: DollarSignIcon },
        { title: 'Pesanan Baru', value: '24', trend: '+4', bg: 'bg-[#DBEAFE]', text: 'text-[#2563EB]', icon: ShoppingCartIcon },
        { title: 'Total Produk', value: '142', trend: 'Stok Aman', bg: 'bg-[#F3E8FF]', text: 'text-[#9333EA]', icon: PackageIcon }
    ];

    // Simulasi data stok menipis (tabel bawah)
    let lowStockItems = [
        { id: 1, name: 'Lilin Doa 5cm', category: 'Perlengkapan', stock: 2, status: 'Kritis' },
        { id: 2, name: 'Salib Dinding Kayu Jati', category: 'Dekorasi', stock: 4, status: 'Warning' },
        { id: 3, name: 'Alkitab Ukuran Besar', category: 'Buku', stock: 5, status: 'Warning' },
        { id: 4, name: 'Rosario Kayu Wangi', category: 'Aksesoris', stock: 1, status: 'Kritis' },
    ];
</script>

<div class="space-y-8">
    
    <div class="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
            <h2 class="text-xl font-bold text-gray-800">Overview Toko</h2>
            <p class="text-sm text-gray-500">Update terakhir: Barusan</p>
        </div>
        <button class="bg-gray-900 text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition shadow-lg shadow-gray-200 flex items-center gap-2">
            <ArrowUpRightIcon size="16" />
            <span>Unduh Laporan</span>
        </button>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        {#each stats as stat}
        <div class="p-6 rounded-3xl {stat.bg} transition hover:-translate-y-1 hover:shadow-md duration-300">
            <div class="flex justify-between items-start mb-8">
                <div class="p-3 bg-white/60 rounded-xl backdrop-blur-sm {stat.text}">
                    <svelte:component this={stat.icon} size="24" />
                </div>
                <button class="text-gray-600 hover:bg-white/50 p-1 rounded-full transition">
                    <MoreHorizontalIcon size="20" />
                </button>
            </div>
            <div>
                <p class="text-sm font-semibold text-gray-600 mb-1">{stat.title}</p>
                <div class="flex items-end gap-3">
                    <h3 class="text-3xl font-bold text-gray-900">{stat.value}</h3>
                    <span class="text-xs font-bold bg-white/60 px-2 py-1 rounded-lg {stat.text} flex items-center gap-1 mb-1">
                        <TrendingUpIcon size="12" /> {stat.trend}
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
                    Peringatan Stok Menipis
                </h3>
                <a href="/warung_kopi/produk" class="text-sm text-blue-600 font-bold hover:underline">Lihat Semua</a>
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
                        {#each lowStockItems as item}
                        <tr class="group hover:bg-gray-50 transition">
                            <td class="py-4 pl-2">
                                <div class="font-bold text-gray-800 group-hover:text-blue-600 transition">{item.name}</div>
                            </td>
                            <td class="py-4 text-sm text-gray-500">{item.category}</td>
                            <td class="py-4 text-center font-mono font-bold text-gray-800">{item.stock}</td>
                            <td class="py-4 text-right">
                                <span class="px-3 py-1 rounded-full text-xs font-bold 
                                    {item.status === 'Kritis' ? 'bg-red-100 text-red-600' : 'bg-orange-100 text-orange-600'}">
                                    {item.status}
                                </span>
                            </td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="bg-gray-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-500 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
            
            <div class="relative z-10">
                <h3 class="text-lg font-bold mb-6">Aktivitas Toko</h3>

                <div class="space-y-6">
                    <div class="flex gap-4">
                        <div class="flex flex-col items-center">
                            <div class="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <div class="w-0.5 h-full bg-gray-700 my-1"></div>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-200">Pesanan Baru #INV-001</p>
                            <p class="text-xs text-gray-400 mt-1">2 Menit yang lalu</p>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <div class="flex flex-col items-center">
                            <div class="w-2 h-2 bg-green-400 rounded-full"></div>
                            <div class="w-0.5 h-full bg-gray-700 my-1"></div>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-200">Stok "Lilin" Diupdate</p>
                            <p class="text-xs text-gray-400 mt-1">1 Jam yang lalu oleh Admin</p>
                        </div>
                    </div>

                    <div class="flex gap-4">
                        <div class="flex flex-col items-center">
                            <div class="w-2 h-2 bg-purple-400 rounded-full"></div>
                        </div>
                        <div>
                            <p class="text-sm font-bold text-gray-200">Cabang "Jogja" Buka</p>
                            <p class="text-xs text-gray-400 mt-1">08:00 WIB</p>
                        </div>
                    </div>
                </div>

                <div class="mt-8 pt-6 border-t border-gray-700">
                    <button class="w-full bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-bold text-sm transition">
                        Lihat Semua Log
                    </button>
                </div>
            </div>
        </div>

    </div>
</div>