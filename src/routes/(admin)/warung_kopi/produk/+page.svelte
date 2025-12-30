<script>
    import { 
        SearchIcon, PlusIcon, FilterIcon, Edit2Icon, Trash2Icon, 
        GridIcon, ListIcon, ChevronLeftIcon, ChevronRightIcon, 
        FileTextIcon, LoaderIcon, BookIcon, BoxIcon 
    } from 'svelte-feather-icons';
    import { invalidateAll } from '$app/navigation'; 
    import { PUBLIC_API_URL } from '$env/static/public';
    
    // --- IMPORT KOMPONEN MODAL (Pastikan file ini sudah dibuat) ---
    import ProductModal from '$lib/components/ProductModal.svelte';

    // --- 1. DATA DARI SERVER ---
    let { data } = $props(); 
    let products = $derived(data.products || []); 

    // Dropdown Subkategori (Untuk pass ke modal & filter)
    let uniqueSubcategories = $derived([...new Set(products.map(p => {
        const cat = p.subcategory || '';
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    }).filter(Boolean))].sort());

    // --- 2. STATE HALAMAN ---
    let searchQuery = $state('');
    let activeCategory = $state('all'); 
    let viewMode = $state('grid'); 
    let currentPage = $state(1);
    let itemsPerPage = 10; 
    let isImporting = $state(false);
    let excelInput;

    // --- STATE MODAL ---
    let showModal = $state(false);
    let editingData = $state(null); // Data produk yang sedang diedit

    // 3. Gunakan Variable Global
    const API_BASE = PUBLIC_API_URL;

    // --- 3. LOGIC FILTER & PAGINATION ---
    let filteredProducts = $derived(products.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                              (p.subcategory && p.subcategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (p.sku && p.sku.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = activeCategory === 'all' ? true : p.category === activeCategory;
        return matchesSearch && matchesCategory;
    }));

    let paginatedProducts = $derived(filteredProducts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    ));

    let totalPages = $derived(Math.ceil(filteredProducts.length / itemsPerPage));

    // --- 4. HELPER FUNCTIONS ---
    function formatRupiah(num) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    }
    
    function getStockColor(stock) {
        if (stock === 0) return 'text-red-600 bg-red-100';
        if (stock < 5) return 'text-orange-600 bg-orange-100';
        return 'text-green-600 bg-green-100';
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) currentPage = newPage;
    }

    // --- 5. MODAL ACTIONS ---
    function openAddModal() {
        editingData = null; // Mode Tambah
        showModal = true;
    }

    function openEditModal(product) {
        editingData = product; // Mode Edit
        showModal = true;
    }

    function handleModalClose() {
        showModal = false;
        editingData = null;
    }

    async function handleModalSuccess() {
        showModal = false;
        editingData = null;
        await invalidateAll(); // Refresh data
    }

    // --- 6. PAGE ACTIONS (DELETE & IMPORT) ---
    async function handleDelete(id, name) {
        if (!confirm(`Yakin hapus "${name}"?`)) return;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/products/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) { await invalidateAll(); } else { alert("Gagal hapus."); }
        } catch (error) { alert("Error koneksi."); }
    }

    async function handleExcelUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        isImporting = true;
        const token = localStorage.getItem("token");
        const dataExcel = new FormData();
        dataExcel.append('file', file); 

        try {
            const res = await fetch(`${API_BASE}/products/import`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: dataExcel
            });
            const result = await res.json();

            if (res.ok) {
                let msg = `✅ ${result.sukses || "Import Selesai"}\n\n`;
                if (result.error_log && result.error_log.length > 0) msg += "⚠️ Error:\n" + result.error_log.join("\n");
                alert(msg);
                await invalidateAll(); 
            } else {
                alert("Gagal Import: " + (result.detail || result.error || "Terjadi kesalahan"));
            }
        } catch (error) {
            console.error(error); alert("Error koneksi upload Excel.");
        } finally {
            isImporting = false;
            if (excelInput) excelInput.value = ''; 
        }
    }
</script>

<div class="space-y-6 relative min-h-screen pb-20">
    
    <div class="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
                <h2 class="text-2xl font-bold text-gray-800 pl-2">Katalog Produk</h2>
                <p class="text-xs text-gray-500 pl-2">Kelola {products.length} produk</p>
            </div>
            
            <div class="flex items-center gap-3 w-full md:w-auto">
                <div class="relative flex-1 md:w-64">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon size="18" /></span>
                    <input type="text" bind:value={searchQuery} placeholder="Cari..." 
                        class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition" />
                </div>
                
                <input type="file" bind:this={excelInput} onchange={handleExcelUpload} accept=".xlsx, .xls" hidden />
                <button onclick={() => excelInput.click()} disabled={isImporting} 
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-green-200 disabled:opacity-50">
                    {#if isImporting} <LoaderIcon size="18" class="animate-spin"/> {:else} <FileTextIcon size="18" /> <span class="hidden md:inline">Import</span> {/if}
                </button>

                <button onclick={openAddModal} class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-blue-200">
                    <PlusIcon size="18" /> <span class="hidden md:inline">Baru</span>
                </button>
            </div>
        </div>

        <div class="flex flex-col md:flex-row justify-between items-center gap-4 pt-2 border-t border-gray-50">
            <div class="flex p-1 bg-gray-100 rounded-xl">
                <button onclick={() => {activeCategory = 'all'; currentPage = 1;}} class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all {activeCategory === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Semua</button>
                <button onclick={() => {activeCategory = 'book'; currentPage = 1;}} class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 {activeCategory === 'book' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"><BookIcon size="14"/> Buku</button>
                <button onclick={() => {activeCategory = 'nonbook'; currentPage = 1;}} class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 {activeCategory === 'nonbook' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"><BoxIcon size="14"/> Non-Buku</button>
            </div>
            <div class="flex gap-2">
                <button onclick={() => viewMode = 'grid'} class="p-2 rounded-lg transition {viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}"><GridIcon size="18"/></button>
                <button onclick={() => viewMode = 'list'} class="p-2 rounded-lg transition {viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}"><ListIcon size="18"/></button>
            </div>
        </div>
    </div>

    {#if viewMode === 'grid'}
        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {#each paginatedProducts as product}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition duration-300 flex flex-col">
                <div class="relative aspect-square bg-gray-100 overflow-hidden">
                    <img src={product.image_1_url || 'https://placehold.co/300?text=No+Img'} alt={product.name} class="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                    {#if product.category === 'book'}
                        <span class="absolute top-2 left-2 bg-blue-500/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">BUKU</span>
                    {/if}
                    <div class="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                        <button onclick={() => openEditModal(product)} class="bg-white text-blue-600 p-2 rounded-full hover:scale-110 transition"><Edit2Icon size="16"/></button>
                        <button onclick={() => handleDelete(product.id, product.name)} class="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition"><Trash2Icon size="16"/></button>
                    </div>
                </div>
                <div class="p-4 flex-1 flex flex-col">
                    <div class="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{product.subcategory || 'Umum'}</div>
                    <h3 class="text-sm font-bold text-gray-800 line-clamp-2 leading-snug mb-2 flex-1" title={product.name}>{product.name}</h3>
                    <div class="flex justify-between items-end">
                        <div>
                            {#if product.strike_price > 0}
                                <div class="text-[10px] text-gray-400 line-through">{formatRupiah(product.strike_price)}</div>
                            {/if}
                            <div class="text-sm font-bold text-gray-900">{formatRupiah(product.price)}</div>
                        </div>
                        <div class="text-[10px] font-bold px-2 py-1 rounded {getStockColor(product.stock)}">Stok: {product.stock}</div>
                    </div>
                </div>
            </div>
            {/each}
        </div>
    
    {:else}
        <div class="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                            <th class="p-4 font-semibold">Produk</th>
                            <th class="p-4 font-semibold">Kategori</th>
                            <th class="p-4 font-semibold">Harga</th>
                            <th class="p-4 font-semibold text-center">Stok</th>
                            <th class="p-4 font-semibold text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-100">
                        {#each paginatedProducts as product}
                        <tr class="group hover:bg-blue-50/30 transition">
                            <td class="p-4 flex items-center gap-3">
                                <img src={product.image_1_url || 'https://placehold.co/100?text=No+Img'} alt="img" class="w-10 h-10 rounded-lg object-cover bg-gray-200" />
                                <div>
                                    <div class="font-bold text-gray-800 text-sm line-clamp-1">{product.name}</div>
                                    <div class="text-xs text-gray-400">{product.sku || '-'}</div>
                                </div>
                            </td>
                            <td class="p-4 text-xs text-gray-600">{product.subcategory || '-'}</td>
                            <td class="p-4 text-sm font-bold text-gray-700">{formatRupiah(product.price)}</td>
                            <td class="p-4 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold {getStockColor(product.stock)}">{product.stock}</span></td>
                            <td class="p-4 text-right">
                                <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                    <button onclick={() => openEditModal(product)} class="text-blue-600 hover:bg-blue-100 p-1 rounded"><Edit2Icon size="14"/></button>
                                    <button onclick={() => handleDelete(product.id, product.name)} class="text-red-500 hover:bg-red-100 p-1 rounded"><Trash2Icon size="14"/></button>
                                </div>
                            </td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        </div>
    {/if}

    {#if paginatedProducts.length === 0}
        <div class="flex flex-col items-center justify-center py-20 text-gray-400"><FilterIcon size="48" class="mb-4 text-gray-200"/><p>Tidak ada produk.</p></div>
    {/if}

    {#if totalPages > 1}
    <div class="flex justify-center items-center gap-4 mt-8">
        <button onclick={() => changePage(currentPage - 1)} disabled={currentPage === 1} class="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30"><ChevronLeftIcon size="20"/></button>
        <span class="text-sm font-bold text-gray-600">Hal {currentPage} / {totalPages}</span>
        <button onclick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} class="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30"><ChevronRightIcon size="20"/></button>
    </div>
    {/if}

    <ProductModal 
        show={showModal} 
        editData={editingData} 
        subcategories={uniqueSubcategories}
        onClose={handleModalClose} 
        onSuccess={handleModalSuccess} 
    />

</div>