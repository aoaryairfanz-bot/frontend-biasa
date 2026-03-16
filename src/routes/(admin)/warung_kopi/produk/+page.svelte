<script>
    import { 
        SearchIcon, PlusIcon, FilterIcon, Edit2Icon, Trash2Icon, XIcon,
        GridIcon, ListIcon, ChevronLeftIcon, ChevronRightIcon, 
        FileTextIcon, LoaderIcon, BookIcon, BoxIcon, UploadCloudIcon,
        ImageIcon, VideoIcon, CheckCircleIcon, AlertCircleIcon, PercentIcon,
        DownloadIcon, LayersIcon
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { goto } from '$app/navigation';

    // --- 1. STATE (SVELTE 5 RUNES) ---
    let products = $state([]); 
    let discounts = $state([]); 
    let isLoadingData = $state(true); 
    
    let searchQuery = $state('');
    let activeCategory = $state('all'); 
    let viewMode = $state('list'); 
    
    let currentPage = $state(1);
    let itemsPerPage = 20; 
    let totalItems = $state(0);
    let totalPages = $state(1);

    let isExporting = $state(false); 
    
    // [BARU] State untuk Modal Tindakan Massal
    let showBulkModal = $state(false);
    let isProcessingBulk = $state(false);
    let bulkActionType = $state('import_new'); 
    let bulkFile = $state(null);
    let bulkFileInput;

    const CACHE_KEY = 'admin_products_v10_svelte5'; 

    // --- 2. FETCH DATA ---
    onMount(async () => {
        if (typeof localStorage === 'undefined') return;
        const token = localStorage.getItem("token");
        if (!token) { goto('/login'); return; }

        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                products = data.data || []; 
            }
        } catch (e) { console.error("Cache Error", e); }

        await Promise.all([fetchProducts(), loadDiscounts()]);
    });

    async function fetchProducts() {
        isLoadingData = true;
        const token = localStorage.getItem("token");
        try {
            let url = `${PUBLIC_API_URL}/products/?page=${currentPage}&limit=${itemsPerPage}`;
            if (activeCategory !== 'all') url += `&category=${activeCategory}`;
            if (searchQuery) url += `&q=${searchQuery}`;
            url += `&t=${Date.now()}`;

            const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
            
            if (res.ok) {
                const result = await res.json();
                if (result.data) {
                    products = result.data;
                    totalItems = result.total;
                    totalPages = result.total_pages;
                } else {
                    products = result;
                    totalItems = result.length;
                    totalPages = 1;
                }

                if (currentPage === 1 && !searchQuery) {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
                }
            }
        } catch (e) { console.error("Fetch Error", e); } 
        finally { isLoadingData = false; }
    }

    async function loadDiscounts() {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${PUBLIC_API_URL}/discounts/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) discounts = await res.json();
        } catch (e) {}
    }

    let uniqueSubcategories = $derived(
        products ? [...new Set(products.map(p => p.subcategory || ''))].filter(Boolean).sort() : []
    );

    // --- 4. FORM STATE MANUAL ---
    let showModal = $state(false);
    let editingId = $state(null);
    let formData = $state({
        name: '', sku: '', category: 'nonbook', subcategory: '', 
        price: '', strike_price: '', stock: '', description: '', discount_id: 0,
        weight: '', length: '', width: '', height: '', diameter: '', 
        isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: '',
        foto_1_url: '', foto_2_url: '', foto_3_url: '' 
    });

    let fileStorage = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });
    let previews = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });
    let activeUploads = $state([]); 

    // --- 5. HANDLERS ---
    function changeCategory(cat) { activeCategory = cat; currentPage = 1; fetchProducts(); }
    function changePage(newPage) { if (newPage >= 1 && newPage <= totalPages) { currentPage = newPage; fetchProducts(); } }

    function handleFileChange(e, fieldName) {
        const file = e.target.files[0];
        if (file) {
            fileStorage[fieldName] = file;
            previews[fieldName] = URL.createObjectURL(file);
            formData[fieldName + '_url'] = ''; 
        }
    }

    function handlePaste(e, fieldName) {
        const clipboardData = e.clipboardData || window.clipboardData;
        if (clipboardData.files && clipboardData.files.length > 0) {
            const file = clipboardData.files[0];
            if (file.type.startsWith('image/')) {
                e.preventDefault();
                fileStorage[fieldName] = file;
                previews[fieldName] = URL.createObjectURL(file);
                formData[fieldName + '_url'] = '';
                return;
            }
        }
        const pastedText = clipboardData.getData('text');
        if (pastedText && (pastedText.startsWith('http') || pastedText.match(/\.(jpeg|jpg|gif|png|webp)/))) {
            e.preventDefault();
            previews[fieldName] = pastedText; 
            formData[fieldName + '_url'] = pastedText; 
            fileStorage[fieldName] = null; 
        }
    }

    function removeFile(fieldName) {
        fileStorage[fieldName] = null; previews[fieldName] = null; formData[fieldName + '_url'] = '';
        const input = document.getElementById(fieldName); if(input) input.value = '';
    }

    function resetForm() {
        editingId = null; 
        formData = { name: '', sku: '', category: 'nonbook', subcategory: '', price: '', strike_price: '', stock: '', description: '', discount_id: 0, weight: '', length: '', width: '', height: '', diameter: '', isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: '', foto_1_url: '', foto_2_url: '', foto_3_url: '' };
        fileStorage = { foto_1: null, foto_2: null, foto_3: null, video: null }; previews = { foto_1: null, foto_2: null, foto_3: null, video: null };
    }

    function openAddModal() { resetForm(); showModal = true; }
    
    function openEditModal(product) {
        editingId = product.id;
        formData = { ...product, name: product.name, subcategory: product.subcategory, discount_id: product.discount ? product.discount.id : 0, foto_1_url: '', foto_2_url: '', foto_3_url: '' };
        previews = { foto_1: product.image_1_url, foto_2: product.image_2_url, foto_3: product.image_3_url, video: product.video_url };
        fileStorage = { foto_1: null, foto_2: null, foto_3: null, video: null }; showModal = true;
    }

    function handleQueueUpload(e) {
        e.preventDefault();
        const currentData = JSON.parse(JSON.stringify(formData)); 
        const currentFiles = { ...fileStorage }; 
        const isEdit = editingId; 
        const uploadId = Date.now(); 
        
        showModal = false; resetForm();
        activeUploads = [...activeUploads, { id: uploadId, name: currentData.name, status: 'loading' }];
        processBackgroundUpload(uploadId, currentData, currentFiles, isEdit);
    }

    async function processBackgroundUpload(uploadId, dataPayload, filesPayload, editId) {
        const token = localStorage.getItem("token");
        try {
            const dataToSend = new FormData();
            for (const field of ['foto_1', 'foto_2', 'foto_3']) {
                if (filesPayload[field] instanceof File) dataToSend.append(field, filesPayload[field]); 
                else if (dataPayload[field + '_url']) dataToSend.append(field + '_url', dataPayload[field + '_url']);
            }
            if (filesPayload.video instanceof File) dataToSend.append('video', filesPayload.video);

            dataToSend.append('name', dataPayload.name); 
            dataToSend.append('subcategory', dataPayload.subcategory || '');

            const keys = ['sku', 'category', 'price', 'stock', 'description', 'strike_price', 'weight', 'length', 'width', 'height', 'diameter', 'isbn', 'publisher', 'author', 'publish_year', 'pages', 'book_version'];
            keys.forEach(k => dataToSend.append(k, String(dataPayload[k] || '')));

            let url = editId ? `${PUBLIC_API_URL}/products/${editId}` : `${PUBLIC_API_URL}/products/`;
            const res = await fetch(url, { method: editId ? "PUT" : "POST", headers: { "Authorization": `Bearer ${token}` }, body: dataToSend });

            if (res.ok) {
                const savedProduct = await res.json();
                const prodId = editId || savedProduct.id;
                const discData = new FormData(); discData.append('discount_id', dataPayload.discount_id || 0);
                await fetch(`${PUBLIC_API_URL}/products/${prodId}/assign-discount`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` }, body: discData });

                updateUploadStatus(uploadId, 'success'); fetchProducts(); 
            } else {
                const err = await res.json(); updateUploadStatus(uploadId, 'error', err.detail || 'Gagal');
            }
        } catch (error) { updateUploadStatus(uploadId, 'error', 'Koneksi Error'); }
    }

    function updateUploadStatus(id, status, msg = '') {
        activeUploads = activeUploads.map(u => u.id === id ? { ...u, status, msg } : u);
        if (status === 'success') setTimeout(() => activeUploads = activeUploads.filter(u => u.id !== id), 4000);
    }

    // --- [BARU] FUNGSI TINDAKAN MASSAL (EXCEL) ---
    async function submitBulkAction(e) {
        e.preventDefault();
        if (!bulkFile) { alert("Pilih file Excel terlebih dahulu!"); return; }
        
        isProcessingBulk = true;
        const token = localStorage.getItem("token");
        const bulkData = new FormData();
        bulkData.append('file', bulkFile);
        
        try {
            let endpoint = `${PUBLIC_API_URL}/products/import`; // Default buat baru
            
            // Jika pilihannya update, arahkan ke rute baru kita
            if (bulkActionType !== 'import_new') {
                endpoint = `${PUBLIC_API_URL}/products/bulk-update`;
                bulkData.append('action_type', bulkActionType);
            }

            const res = await fetch(endpoint, { 
                method: "POST", 
                headers: { "Authorization": `Bearer ${token}` }, 
                body: bulkData 
            });
            
            const result = await res.json();
            if (res.ok) { 
                alert(`✅ Sukses!\n${result.message || 'Selesai'}\n${result.errors?.length ? `Peringatan: Ada ${result.errors.length} baris gagal (Cek SKU).` : ''}`); 
                showBulkModal = false;
                bulkFile = null;
                currentPage = 1; 
                fetchProducts();
            } else { 
                alert("Gagal: " + (result.detail || result.message)); 
            }
        } catch { 
            alert("Error koneksi saat memproses file."); 
        } finally { 
            isProcessingBulk = false; 
            if (bulkFileInput) bulkFileInput.value = ''; 
        }
    }

    // --- LAINNYA ---
    async function handleExportExcel() {
        isExporting = true;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/export`, { method: "GET", headers: { "Authorization": `Bearer ${token}` }});
            if (res.ok) {
                const blob = await res.blob(); const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a'); a.href = url;
                let filename = `Export_Produk_${new Date().toISOString().slice(0,10)}.xlsx`;
                const disposition = res.headers.get('Content-Disposition');
                if (disposition && disposition.includes('filename=')) filename = disposition.split('filename=')[1].replace(/"/g, '');
                a.download = filename; document.body.appendChild(a); a.click(); a.remove(); window.URL.revokeObjectURL(url);
            } else { alert("Gagal Export"); }
        } catch (e) { alert("Error koneksi"); } finally { isExporting = false; }
    }

    async function handleDelete(id, name) {
        if (!confirm(`Hapus "${name}"?`)) return;
        const token = localStorage.getItem("token");
        try { await fetch(`${PUBLIC_API_URL}/products/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); fetchProducts(); } 
        catch (e) { alert("Error koneksi"); }
    }

    // --- HELPERS ---
    function formatRupiah(num) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num); }
    function getStockColor(stock) { return stock === 0 ? 'text-red-600 bg-red-100' : stock < 5 ? 'text-orange-600 bg-orange-100' : 'text-green-600 bg-green-100'; }
</script>

<div class="space-y-4 relative min-h-screen pb-20">
    
    <div class="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 w-80">
        {#each activeUploads as upload (upload.id)}
            <div class="bg-white p-3 rounded-xl shadow-2xl border border-gray-100 flex items-center gap-3 animate-in slide-in-from-right duration-300">
                {#if upload.status === 'loading'} <LoaderIcon size="20" class="text-blue-500 animate-spin flex-shrink-0"/><div class="flex-1 min-w-0"><div class="text-xs font-bold text-gray-500">Menyimpan...</div><div class="text-sm font-bold text-gray-800 truncate">{upload.name}</div></div>
                {:else if upload.status === 'success'} <CheckCircleIcon size="20" class="text-green-500 flex-shrink-0"/><div class="flex-1 min-w-0"><div class="text-xs font-bold text-green-600">Berhasil!</div><div class="text-sm font-bold text-gray-800 truncate">{upload.name}</div></div>
                {:else} <AlertCircleIcon size="20" class="text-red-500 flex-shrink-0"/><div class="flex-1 min-w-0"><div class="text-xs font-bold text-red-600">Gagal</div><div class="text-xs text-gray-500 truncate">{upload.msg || 'Error'}</div></div><button onclick={() => activeUploads = activeUploads.filter(u => u.id !== upload.id)} class="text-gray-400 hover:text-gray-600"><XIcon size="14"/></button>{/if}
            </div>
        {/each}
    </div>

    <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
        <div class="flex flex-col md:flex-row justify-between items-center gap-3">
            <div><h2 class="text-xl font-bold text-gray-800 pl-1">Katalog Produk</h2><p class="text-[10px] text-gray-500 pl-1 uppercase tracking-wide font-bold">Total {totalItems} items</p></div>
            <div class="flex items-center gap-2 w-full md:w-auto">
                <div class="relative flex-1 md:w-64">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon size="16" /></span>
                    <input type="text" bind:value={searchQuery} onchange={() => {currentPage=1; fetchProducts()}} placeholder="Cari Nama / SKU..." class="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-200 outline-none transition" />
                </div>
                
                <button onclick={() => showBulkModal = true} class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                    <LayersIcon size="16" /> <span class="hidden md:inline">Tindakan Massal</span>
                </button>
                
                <button onclick={handleExportExcel} disabled={isExporting} class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                    {#if isExporting} <LoaderIcon size="16" class="animate-spin"/> {:else} <DownloadIcon size="16" /> <span class="hidden md:inline">Export</span> {/if}
                </button>
                
                <button onclick={openAddModal} class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                    <PlusIcon size="16" /> <span class="hidden md:inline">Baru</span>
                </button>
            </div>
        </div>
        <div class="flex flex-col md:flex-row justify-between items-center gap-3 pt-2 border-t border-gray-50">
            <div class="flex p-1 bg-gray-50 rounded-lg">
                <button onclick={() => changeCategory('all')} class="px-3 py-1.5 rounded-md text-xs font-bold transition-all {activeCategory === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Semua</button>
                <button onclick={() => changeCategory('book')} class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 {activeCategory === 'book' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"><BookIcon size="12"/> Buku</button>
                <button onclick={() => changeCategory('nonbook')} class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 {activeCategory === 'nonbook' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"><BoxIcon size="12"/> Non-Buku</button>
            </div>
            <div class="flex gap-1">
                <button onclick={() => viewMode = 'grid'} class="p-1.5 rounded transition {viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}"><GridIcon size="16"/></button>
                <button onclick={() => viewMode = 'list'} class="p-1.5 rounded transition {viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}"><ListIcon size="16"/></button>
            </div>
        </div>
    </div>

    {#if isLoadingData && products.length === 0}
        <div class="flex flex-col items-center justify-center py-20 text-gray-400"><LoaderIcon size="32" class="mb-2 text-blue-300 animate-spin"/><p class="text-xs font-bold">Sedang memuat...</p></div>
    {:else}
        {#if viewMode === 'grid'}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {#each products as product}
                <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col relative border border-gray-100">
                    {#if product.discount_label} <div class="absolute top-2 right-2 z-10 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">{product.discount_label}</div> {/if}
                    <div class="relative aspect-square bg-gray-50 overflow-hidden">
                        <img src={product.image_1_url || 'https://placehold.co/300?text=No+Img'} alt={product.name} class="w-full h-full object-cover" loading="lazy" />
                        {#if product.category === 'book'} <span class="absolute top-2 left-2 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">BUKU</span> {/if}
                        <div class="absolute inset-0 bg-black/30 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200 backdrop-blur-[1px]">
                            <button onclick={() => openEditModal(product)} class="bg-white text-blue-600 p-1.5 rounded-lg hover:scale-105 transition shadow-sm"><Edit2Icon size="16"/></button>
                            <button onclick={() => handleDelete(product.id, product.name)} class="bg-white text-red-500 p-1.5 rounded-lg hover:scale-105 transition shadow-sm"><Trash2Icon size="16"/></button>
                        </div>
                    </div>
                    <div class="p-3 flex-1 flex flex-col">
                        <div class="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5 truncate">{product.subcategory || 'Umum'}</div>
                        <h3 class="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-2 flex-1" title={product.name}>{product.name}</h3>
                        <div class="flex justify-between items-end mt-auto">
                            <div>
                                {#if product.display_strike_price > 0 && product.display_strike_price > product.final_price} <div class="text-[9px] text-gray-400 line-through">{formatRupiah(product.display_strike_price)}</div> {/if}
                                <div class="text-sm font-extrabold {product.discount_label ? 'text-red-600' : 'text-gray-900'}">{formatRupiah(product.final_price)}</div>
                            </div>
                            <div class="text-[9px] font-bold px-1.5 py-0.5 rounded {getStockColor(product.stock)}">{product.stock}</div>
                        </div>
                    </div>
                </div>
                {/each}
            </div>
        {:else}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider"><tr class="border-b border-gray-100"><th class="p-3">Produk</th><th class="p-3">Kategori</th><th class="p-3">Harga</th><th class="p-3 text-center">Stok</th><th class="p-3 text-right">Aksi</th></tr></thead>
                    <tbody class="divide-y divide-gray-50 text-sm">
                        {#each products as product}
                        <tr class="group hover:bg-gray-50 transition">
                            <td class="p-3 flex items-center gap-3">
                                <img src={product.image_1_url || 'https://placehold.co/100?text=No+Img'} alt="img" class="w-9 h-9 rounded-md object-cover bg-gray-100 border border-gray-100" />
                                <div>
                                    <div class="font-bold text-gray-800 text-xs line-clamp-1">{product.name}</div>
                                    <div class="flex items-center gap-2"><div class="text-[10px] text-gray-400 font-mono">{product.sku || '-'}</div>{#if product.discount_label}<span class="text-[8px] bg-red-100 text-red-600 px-1 rounded font-bold">{product.discount_label}</span>{/if}</div>
                                </div>
                            </td>
                            <td class="p-3 text-xs text-gray-500">{product.subcategory || '-'}</td>
                            <td class="p-3">
                                {#if product.display_strike_price > 0 && product.display_strike_price > product.final_price} <div class="text-[9px] text-gray-400 line-through">{formatRupiah(product.display_strike_price)}</div> {/if}
                                <div class="text-xs font-bold {product.discount_label ? 'text-red-600' : 'text-gray-800'}">{formatRupiah(product.final_price)}</div>
                            </td>
                            <td class="p-3 text-center"><span class="px-1.5 py-0.5 rounded text-[9px] font-bold {getStockColor(product.stock)}">{product.stock}</span></td>
                            <td class="p-3 text-right">
                                <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onclick={() => openEditModal(product)} class="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition"><Edit2Icon size="14"/></button>
                                    <button onclick={() => handleDelete(product.id, product.name)} class="text-red-500 hover:bg-red-50 p-1.5 rounded transition"><Trash2Icon size="14"/></button>
                                </div>
                            </td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
        {#if products.length === 0} <div class="flex flex-col items-center justify-center py-12 text-gray-400"><FilterIcon size="32" class="mb-2 text-gray-200"/><p class="text-sm">Data kosong.</p></div> {/if}
        
        {#if totalPages > 1}
        <div class="flex justify-center items-center gap-3 mt-6 pb-6">
            <button onclick={() => changePage(currentPage - 1)} disabled={currentPage === 1} class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"><ChevronLeftIcon size="16"/></button>
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Page {currentPage} / {totalPages}</span>
            <button onclick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"><ChevronRightIcon size="16"/></button>
        </div>
        {/if}
    {/if}
</div>

{#if showBulkModal}
<div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
    <div class="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 class="text-lg font-bold text-gray-800 flex items-center gap-2"><LayersIcon size="18" class="text-blue-600"/> Tindakan Massal</h3>
            <button onclick={() => showBulkModal = false} class="bg-white p-1 rounded-full text-gray-400 hover:text-red-500 transition shadow-sm"><XIcon size="18"/></button>
        </div>
        <form onsubmit={submitBulkAction} class="p-6 space-y-5">
            <div>
                <label class="block text-xs font-bold text-gray-600 mb-2">Pilih Jenis Tindakan <span class="text-red-500">*</span></label>
                <select bind:value={bulkActionType} class="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition text-sm font-bold text-gray-800 appearance-none">
                    <option value="import_new">✨ Buat Produk Baru (Import)</option>
                    <option value="update_all">🔄 Update Semua Atribut (By SKU)</option>
                    <option value="update_price">💰 Update Harga Saja (By SKU)</option>
                    <option value="update_stock">📦 Update Stok Saja (By SKU)</option>
                </select>
                <p class="text-[10px] text-gray-400 mt-2 italic">*Pastikan kolom SKU di file Excel sesuai dengan data di sistem.</p>
            </div>
            
            <div class="border-t border-gray-100 pt-4">
                <label class="block text-xs font-bold text-gray-600 mb-2">Upload File Excel (.xlsx / .xls) <span class="text-red-500">*</span></label>
                <div class="relative border-2 border-dashed {bulkFile ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'} rounded-xl p-6 flex flex-col items-center justify-center hover:border-blue-400 transition cursor-pointer group">
                    <input 
                        type="file" 
                        bind:this={bulkFileInput}
                        accept=".xlsx, .xls" 
                        onchange={(e) => bulkFile = e.target.files[0]}
                        class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                        required
                    />
                    {#if bulkFile}
                        <CheckCircleIcon size="24" class="text-green-500 mb-2"/>
                        <span class="text-xs font-bold text-green-700 text-center truncate w-full">{bulkFile.name}</span>
                    {:else}
                        <UploadCloudIcon size="24" class="text-gray-400 mb-2 group-hover:text-blue-500 transition"/>
                        <span class="text-xs font-bold text-gray-600">Klik atau Drag file ke sini</span>
                    {/if}
                </div>
            </div>
            
            <div class="pt-2">
                <button type="submit" disabled={isProcessingBulk || !bulkFile} class="w-full bg-blue-600 disabled:bg-blue-300 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-200 flex justify-center items-center gap-2">
                    {#if isProcessingBulk}
                        <LoaderIcon size="18" class="animate-spin"/> Memproses...
                    {:else}
                        <CheckCircleIcon size="18"/> Jalankan Proses Massal
                    {/if}
                </button>
            </div>
        </form>
    </div>
</div>
{/if}

{#if showModal}
<div class="fixed inset-0 z-[50] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto">
    <div class="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-4 flex flex-col max-h-[90vh]">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <h3 class="text-lg font-bold text-gray-800">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
            <button onclick={() => showModal = false} class="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition"><XIcon size="20" /></button>
        </div>
        <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
            <form class="grid grid-cols-1 md:grid-cols-12 gap-6" onsubmit={handleQueueUpload}>
                <div class="md:col-span-8 space-y-5">
                    
                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2"><BoxIcon size="12"/> Informasi Dasar</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="col-span-2"><label class="block text-xs font-bold text-gray-600 mb-1">Nama Produk <span class="text-red-500">*</span></label><input type="text" bind:value={formData.name} required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm transition" placeholder="Contoh: Alkitab Besar..."/></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">SKU (Kode)</label><input type="text" bind:value={formData.sku} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm transition" placeholder="Opsional"/></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Jenis Barang</label><select bind:value={formData.category} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"><option value="nonbook">Barang Umum</option><option value="book">Buku / Kitab</option></select></div>
                            <div class="col-span-2"><label class="block text-xs font-bold text-gray-600 mb-1">Sub Kategori</label><input type="text" bind:value={formData.subcategory} list="subcategories-list" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm transition" placeholder="Ketik atau pilih..." /><datalist id="subcategories-list">{#each uniqueSubcategories as sub} <option value={sub}></option> {/each}</datalist></div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2"><FilterIcon size="12"/> Harga & Stok</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Harga Jual (Rp) <span class="text-red-500">*</span></label><input type="number" bind:value={formData.price} required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold text-gray-800" placeholder="0"/></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Stok Awal <span class="text-red-500">*</span></label><input type="number" bind:value={formData.stock} required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" placeholder="0"/></div>
                            
                            <div class="col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                <label class="block text-xs font-bold text-blue-700 mb-1 flex items-center gap-1"><PercentIcon size="12"/> Voucher Diskon (Global)</label>
                                <select bind:value={formData.discount_id} class="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-2">
                                    <option value={0}>-- Tidak Ada Diskon --</option>
                                    {#each discounts as disc}<option value={disc.id}>{disc.name} ({disc.percentage}%) {disc.is_active ? '✅' : '🔴'}</option>{/each}
                                </select>
                                <label class="block text-xs font-bold text-gray-500 mb-1">Atau Harga Coret Manual</label>
                                <input type="number" bind:value={formData.strike_price} class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm" placeholder="Isi harga sebelum diskon..."/>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2"><BoxIcon size="12"/> Fisik (Untuk Ongkir)</h4>
                        <div class="grid grid-cols-5 gap-2">
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">Berat(gr)</label><input type="number" bind:value={formData.weight} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">P(cm)</label><input type="number" bind:value={formData.length} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">L(cm)</label><input type="number" bind:value={formData.width} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">T(cm)</label><input type="number" bind:value={formData.height} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">D(cm)</label><input type="number" bind:value={formData.diameter} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                        </div>
                    </div>

                    {#if formData.category === 'book'}
                    <div class="bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-3">
                        <h4 class="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 border-b border-blue-100 pb-2"><BookIcon size="12"/> Detail Buku</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">ISBN</label><input type="text" bind:value={formData.isbn} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Penulis</label><input type="text" bind:value={formData.author} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Penerbit</label><input type="text" bind:value={formData.publisher} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Edisi/Versi</label><input type="text" bind:value={formData.book_version} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            <div class="grid grid-cols-2 gap-2 col-span-2">
                                <div><label class="block text-xs font-bold text-gray-600 mb-1">Tahun Terbit</label><input type="number" bind:value={formData.publish_year} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                <div><label class="block text-xs font-bold text-gray-600 mb-1">Jml Halaman</label><input type="number" bind:value={formData.pages} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            </div>
                        </div>
                    </div>
                    {/if}
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">Deskripsi Lengkap</label>
                        <textarea bind:value={formData.description} rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" placeholder="Tulis deskripsi produk..."></textarea>
                    </div>
                </div>

                <div class="md:col-span-4 space-y-5">
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3"><ImageIcon size="12"/> Foto & Video</h4>
                        
                        <div class="mb-3">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Foto Utama</label>
                            
                            <div 
                                role="button" 
                                tabindex="0" 
                                onpaste={(e) => handlePaste(e, 'foto_1')} 
                                class="relative border-2 border-dashed {fileStorage.foto_1 || formData.foto_1_url ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'} rounded-xl h-40 flex items-center justify-center hover:border-blue-400 transition cursor-pointer overflow-hidden group"
                                title="Klik Upload atau Paste Gambar (Ctrl+V)"
                            >
                                {#if previews.foto_1}
                                    <img src={previews.foto_1} alt="Preview" class="h-full w-full object-contain p-1" />
                                    <button type="button" onclick={(e) => { e.stopPropagation(); removeFile('foto_1'); }} class="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1 shadow-sm hover:bg-red-50 border border-gray-100 z-30"><XIcon size="12"/></button>
                                {:else}
                                    <div class="text-center pointer-events-none p-4">
                                        <UploadCloudIcon size="24" class="mx-auto text-gray-400 mb-2"/>
                                        <span class="text-xs font-bold text-gray-600 block">Upload / Paste</span>
                                    </div>
                                {/if}
                                {#if !previews.foto_1}
                                    <input type="file" id="foto_1" accept="image/*" onchange={(e) => handleFileChange(e, 'foto_1')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {/if}
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2 mb-4">
                            {#each ['foto_2', 'foto_3'] as f}
                            <div 
                                role="button" tabindex="0" onpaste={(e) => handlePaste(e, f)}
                                class="relative border-2 border-dashed rounded-lg h-20 flex items-center justify-center bg-white hover:border-blue-400 transition cursor-pointer overflow-hidden"
                            >
                                {#if previews[f]} 
                                    <img src={previews[f]} alt="Preview" class="h-full w-full object-contain p-1" /> 
                                    <button type="button" onclick={(e) => { e.stopPropagation(); removeFile(f); }} class="absolute top-0 right-0 bg-white text-red-500 rounded-bl-lg p-0.5 shadow-sm border-l border-b border-gray-100 z-30"><XIcon size="10"/></button>
                                {:else} 
                                    <PlusIcon size="16" class="text-gray-300 pointer-events-none"/> 
                                    <input type="file" id={f} accept="image/*" onchange={(e) => handleFileChange(e, f)} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {/if}
                            </div>
                            {/each}
                        </div>

                        <div class="pt-3 border-t border-gray-200">
                            <label class="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><VideoIcon size="12"/> Video (MP4)</label>
                            <div class="relative border-2 border-dashed {fileStorage.video ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'} rounded-lg h-20 flex items-center justify-center hover:border-blue-400 transition cursor-pointer">
                                {#if previews.video} 
                                    <div class="text-[10px] text-green-700 font-bold flex flex-col items-center"><CheckCircleIcon size="16" class="mb-1"/> Ready</div> 
                                    <button type="button" onclick={(e) => { e.stopPropagation(); removeFile('video'); }} class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 z-30"><XIcon size="12"/></button>
                                {:else} 
                                    <span class="text-[10px] text-gray-400 pointer-events-none">Klik Upload</span> 
                                    <input type="file" id="video" accept="video/*" onchange={(e) => handleFileChange(e, 'video')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /> 
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="md:col-span-12 flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
                    <button type="button" onclick={() => showModal = false} class="px-5 py-2.5 rounded-lg text-sm text-gray-600 font-bold hover:bg-gray-100 transition">Batal</button>
                    <button type="submit" class="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200">
                        <CheckCircleIcon size="16"/> <span>{editingId ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
{/if}

<!-- <script>
    import { 
        SearchIcon, PlusIcon, FilterIcon, Edit2Icon, Trash2Icon, XIcon,
        GridIcon, ListIcon, ChevronLeftIcon, ChevronRightIcon, 
        FileTextIcon, LoaderIcon, BookIcon, BoxIcon, UploadCloudIcon,
        ImageIcon, VideoIcon, CheckCircleIcon, AlertCircleIcon, PercentIcon,
        DownloadIcon // [BARU] Import ikon download
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { goto } from '$app/navigation';

    // --- 1. STATE (SVELTE 5 RUNES) ---
    let products = $state([]); 
    let discounts = $state([]); 
    let isLoadingData = $state(true); 
    
    // Filter State
    let searchQuery = $state('');
    let activeCategory = $state('all'); 
    let viewMode = $state('list'); 
    
    // Pagination State
    let currentPage = $state(1);
    let itemsPerPage = 20; 
    let totalItems = $state(0);
    let totalPages = $state(1);

    let isImporting = $state(false);
    let isExporting = $state(false); // [BARU] State untuk loading export
    let excelInput; 

    const CACHE_KEY = 'admin_products_v10_svelte5'; 

    // --- 2. FETCH DATA ---
    onMount(async () => {
        if (typeof localStorage === 'undefined') return;
        const token = localStorage.getItem("token");
        if (!token) { goto('/login'); return; }

        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                products = data.data || []; 
            }
        } catch (e) { console.error("Cache Error", e); }

        await Promise.all([fetchProducts(), loadDiscounts()]);
    });

    async function fetchProducts() {
        isLoadingData = true;
        const token = localStorage.getItem("token");
        try {
            let url = `${PUBLIC_API_URL}/products/?page=${currentPage}&limit=${itemsPerPage}`;
            if (activeCategory !== 'all') url += `&category=${activeCategory}`;
            if (searchQuery) url += `&q=${searchQuery}`;
            url += `&t=${Date.now()}`;

            const res = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
            
            if (res.ok) {
                const result = await res.json();
                
                if (result.data) {
                    products = result.data;
                    totalItems = result.total;
                    totalPages = result.total_pages;
                } else {
                    products = result;
                    totalItems = result.length;
                    totalPages = 1;
                }

                if (currentPage === 1 && !searchQuery) {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
                }
            }
        } catch (e) { console.error("Fetch Error", e); } 
        finally { isLoadingData = false; }
    }

    async function loadDiscounts() {
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${PUBLIC_API_URL}/discounts/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) discounts = await res.json();
        } catch (e) {}
    }

    // --- 3. DERIVED STATE ---
    // [FIX] Jangan paksa Title Case di sini agar filter akurat
    let uniqueSubcategories = $derived(
        products 
        ? [...new Set(products.map(p => p.subcategory || ''))].filter(Boolean).sort()
        : []
    );

    // --- 4. FORM STATE ---
    let showModal = $state(false);
    let editingId = $state(null);
    let formData = $state({
        name: '', sku: '', category: 'nonbook', subcategory: '', 
        price: '', strike_price: '', stock: '', description: '', discount_id: 0,
        weight: '', length: '', width: '', height: '', diameter: '', 
        isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: '',
        foto_1_url: '', foto_2_url: '', foto_3_url: '' 
    });

    let fileStorage = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });
    let previews = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });
    let activeUploads = $state([]); 

    // --- 5. HANDLERS ---
    
    function handleSearch() {
        currentPage = 1;
        fetchProducts();
    }

    function changeCategory(cat) {
        activeCategory = cat;
        currentPage = 1;
        fetchProducts();
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            fetchProducts();
        }
    }

    // --- FILE & PASTE HANDLING ---
    function handleFileChange(e, fieldName) {
        const file = e.target.files[0];
        if (file) {
            fileStorage[fieldName] = file;
            previews[fieldName] = URL.createObjectURL(file);
            formData[fieldName + '_url'] = ''; 
        }
    }

    function handlePaste(e, fieldName) {
        const clipboardData = e.clipboardData || window.clipboardData;
        
        if (clipboardData.files && clipboardData.files.length > 0) {
            const file = clipboardData.files[0];
            if (file.type.startsWith('image/')) {
                e.preventDefault();
                fileStorage[fieldName] = file;
                previews[fieldName] = URL.createObjectURL(file);
                formData[fieldName + '_url'] = '';
                return;
            }
        }
        
        const pastedText = clipboardData.getData('text');
        if (pastedText && (pastedText.startsWith('http') || pastedText.match(/\.(jpeg|jpg|gif|png|webp)/))) {
            e.preventDefault();
            previews[fieldName] = pastedText; 
            formData[fieldName + '_url'] = pastedText; 
            fileStorage[fieldName] = null; 
        }
    }

    function removeFile(fieldName) {
        fileStorage[fieldName] = null;
        previews[fieldName] = null;
        formData[fieldName + '_url'] = '';
        const input = document.getElementById(fieldName);
        if(input) input.value = '';
    }

    // --- MODAL ---
    function resetForm() {
        editingId = null; 
        formData = { 
            name: '', sku: '', category: 'nonbook', subcategory: '', 
            price: '', strike_price: '', stock: '', description: '', discount_id: 0,
            weight: '', length: '', width: '', height: '', diameter: '', 
            isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: '',
            foto_1_url: '', foto_2_url: '', foto_3_url: '' 
        };
        fileStorage = { foto_1: null, foto_2: null, foto_3: null, video: null };
        previews = { foto_1: null, foto_2: null, foto_3: null, video: null };
    }

    function openAddModal() { resetForm(); showModal = true; }
    
    // [FIX UTAMA] Jangan gunakan toTitleCase() saat load data edit!
    // Biarkan data apa adanya dari database (Agar TUHAN YESUS tetap TUHAN YESUS)
    function openEditModal(product) {
        editingId = product.id;
        formData = { 
            ...product, 
            name: product.name, // [FIX] Hapus toTitleCase()
            subcategory: product.subcategory, // [FIX] Hapus toTitleCase()
            discount_id: product.discount ? product.discount.id : 0,
            foto_1_url: '', foto_2_url: '', foto_3_url: '' 
        };
        previews = { 
            foto_1: product.image_1_url, foto_2: product.image_2_url, 
            foto_3: product.image_3_url, video: product.video_url 
        };
        fileStorage = { foto_1: null, foto_2: null, foto_3: null, video: null };
        showModal = true;
    }

    // --- UPLOAD ---
    function handleQueueUpload(e) {
        e.preventDefault();
        // Snapshot Svelte 5 state
        const currentData = JSON.parse(JSON.stringify(formData)); 
        const currentFiles = { ...fileStorage }; 
        const isEdit = editingId; 
        const uploadId = Date.now(); 
        
        showModal = false;
        resetForm();
        
        activeUploads = [...activeUploads, { id: uploadId, name: currentData.name, status: 'loading' }];
        processBackgroundUpload(uploadId, currentData, currentFiles, isEdit);
    }

    async function processBackgroundUpload(uploadId, dataPayload, filesPayload, editId) {
        const token = localStorage.getItem("token");
        try {
            const dataToSend = new FormData();
            const imageFields = ['foto_1', 'foto_2', 'foto_3'];
            
            for (const field of imageFields) {
                if (filesPayload[field] instanceof File) {
                    dataToSend.append(field, filesPayload[field]); 
                } else if (dataPayload[field + '_url']) {
                    dataToSend.append(field + '_url', dataPayload[field + '_url']);
                }
            }
            if (filesPayload.video instanceof File) dataToSend.append('video', filesPayload.video);

            // [FIX] Kirim data persis seperti inputan (Tanpa toTitleCase)
            dataToSend.append('name', dataPayload.name); 
            dataToSend.append('subcategory', dataPayload.subcategory || '');

            const keys = ['sku', 'category', 'price', 'stock', 'description', 'strike_price', 'weight', 'length', 'width', 'height', 'diameter', 'isbn', 'publisher', 'author', 'publish_year', 'pages', 'book_version'];
            keys.forEach(k => dataToSend.append(k, String(dataPayload[k] || '')));

            let url = `${PUBLIC_API_URL}/products/`;
            let method = "POST";
            if (editId) { url = `${PUBLIC_API_URL}/products/${editId}`; method = "PUT"; }

            const res = await fetch(url, { method, headers: { "Authorization": `Bearer ${token}` }, body: dataToSend });

            if (res.ok) {
                const savedProduct = await res.json();
                const prodId = editId || savedProduct.id;
                
                const discData = new FormData();
                discData.append('discount_id', dataPayload.discount_id || 0);
                await fetch(`${PUBLIC_API_URL}/products/${prodId}/assign-discount`, { method: "PUT", headers: { "Authorization": `Bearer ${token}` }, body: discData });

                updateUploadStatus(uploadId, 'success');
                fetchProducts(); 
            } else {
                const err = await res.json();
                updateUploadStatus(uploadId, 'error', err.detail || 'Gagal');
            }
        } catch (error) {
            updateUploadStatus(uploadId, 'error', 'Koneksi Error');
        }
    }

    function updateUploadStatus(id, status, msg = '') {
        activeUploads = activeUploads.map(u => u.id === id ? { ...u, status, msg } : u);
        if (status === 'success') {
            setTimeout(() => {
                activeUploads = activeUploads.filter(u => u.id !== id);
            }, 4000);
        }
    }

    // --- LAINNYA ---
    async function handleExcelUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        isImporting = true;
        const token = localStorage.getItem("token");
        const dataExcel = new FormData();
        dataExcel.append('file', file);
        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/import`, { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: dataExcel });
            const result = await res.json();
            if (res.ok) { 
                alert(`✅ Sukses! ${result.message || 'Selesai'}`); 
                currentPage = 1; 
                fetchProducts();
            } else { alert("Gagal: " + (result.detail || result.message)); }
        } catch { alert("Error upload."); } finally { isImporting = false; if (excelInput) excelInput.value = ''; }
    }

    // [BARU] FUNGSI EXPORT EXCEL
    async function handleExportExcel() {
        isExporting = true;
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${PUBLIC_API_URL}/products/export`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                // Konversi response stream menjadi blob file
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                
                // Coba ambil nama file dari header jika ada
                let filename = `Export_Produk_${new Date().toISOString().slice(0,10)}.xlsx`;
                const disposition = res.headers.get('Content-Disposition');
                if (disposition && disposition.includes('filename=')) {
                    filename = disposition.split('filename=')[1].replace(/"/g, '');
                }
                
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);
            } else {
                const err = await res.json();
                alert("Gagal Export: " + (err.detail || "Terjadi kesalahan"));
            }
        } catch (e) {
            alert("Error koneksi saat mencoba Export Data.");
        } finally {
            isExporting = false;
        }
    }

    async function handleDelete(id, name) {
        if (!confirm(`Hapus "${name}"?`)) return;
        const token = localStorage.getItem("token");
        try {
            await fetch(`${PUBLIC_API_URL}/products/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); 
            fetchProducts();
        } catch (e) { alert("Error koneksi"); }
    }

    // --- HELPERS ---
    function formatRupiah(num) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num); }
    function toTitleCase(str) { return str?.toLowerCase().replace(/(?:^|\s)\w/g, m => m.toUpperCase()) || ''; }
    function getStockColor(stock) { return stock === 0 ? 'text-red-600 bg-red-100' : stock < 5 ? 'text-orange-600 bg-orange-100' : 'text-green-600 bg-green-100'; }
</script>

<div class="space-y-4 relative min-h-screen pb-20">
    
    <div class="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 w-80">
        {#each activeUploads as upload (upload.id)}
            <div class="bg-white p-3 rounded-xl shadow-2xl border border-gray-100 flex items-center gap-3 animate-in slide-in-from-right duration-300">
                {#if upload.status === 'loading'}
                    <LoaderIcon size="20" class="text-blue-500 animate-spin flex-shrink-0"/>
                    <div class="flex-1 min-w-0"><div class="text-xs font-bold text-gray-500">Menyimpan...</div><div class="text-sm font-bold text-gray-800 truncate">{upload.name}</div></div>
                {:else if upload.status === 'success'}
                    <CheckCircleIcon size="20" class="text-green-500 flex-shrink-0"/><div class="flex-1 min-w-0"><div class="text-xs font-bold text-green-600">Berhasil!</div><div class="text-sm font-bold text-gray-800 truncate">{upload.name}</div></div>
                {:else}
                    <AlertCircleIcon size="20" class="text-red-500 flex-shrink-0"/><div class="flex-1 min-w-0"><div class="text-xs font-bold text-red-600">Gagal</div><div class="text-xs text-gray-500 truncate">{upload.msg || 'Error'}</div></div><button onclick={() => activeUploads = activeUploads.filter(u => u.id !== upload.id)} class="text-gray-400 hover:text-gray-600"><XIcon size="14"/></button>
                {/if}
            </div>
        {/each}
    </div>

    <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
        <div class="flex flex-col md:flex-row justify-between items-center gap-3">
            <div><h2 class="text-xl font-bold text-gray-800 pl-1">Katalog Produk</h2><p class="text-[10px] text-gray-500 pl-1 uppercase tracking-wide font-bold">Total {totalItems} items</p></div>
            <div class="flex items-center gap-2 w-full md:w-auto">
                <div class="relative flex-1 md:w-64">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon size="16" /></span>
                    <input type="text" bind:value={searchQuery} onchange={() => {currentPage=1; fetchProducts()}} placeholder="Cari Nama / SKU..." class="w-full pl-9 pr-3 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-200 outline-none transition" />
                </div>
                
                <input type="file" bind:this={excelInput} onchange={handleExcelUpload} accept=".xlsx, .xls" hidden />
                <button onclick={() => excelInput.click()} disabled={isImporting} class="bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                    {#if isImporting} <LoaderIcon size="16" class="animate-spin"/> {:else} <UploadCloudIcon size="16" /> <span class="hidden md:inline">Import</span> {/if}
                </button>
                
                <button onclick={handleExportExcel} disabled={isExporting} class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                    {#if isExporting} <LoaderIcon size="16" class="animate-spin"/> {:else} <DownloadIcon size="16" /> <span class="hidden md:inline">Export</span> {/if}
                </button>
                
                <button onclick={openAddModal} class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition">
                    <PlusIcon size="16" /> <span class="hidden md:inline">Baru</span>
                </button>
            </div>
        </div>
        <div class="flex flex-col md:flex-row justify-between items-center gap-3 pt-2 border-t border-gray-50">
            <div class="flex p-1 bg-gray-50 rounded-lg">
                <button onclick={() => changeCategory('all')} class="px-3 py-1.5 rounded-md text-xs font-bold transition-all {activeCategory === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Semua</button>
                <button onclick={() => changeCategory('book')} class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 {activeCategory === 'book' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"><BookIcon size="12"/> Buku</button>
                <button onclick={() => changeCategory('nonbook')} class="px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1 {activeCategory === 'nonbook' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"><BoxIcon size="12"/> Non-Buku</button>
            </div>
            <div class="flex gap-1">
                <button onclick={() => viewMode = 'grid'} class="p-1.5 rounded transition {viewMode === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}"><GridIcon size="16"/></button>
                <button onclick={() => viewMode = 'list'} class="p-1.5 rounded transition {viewMode === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400 hover:bg-gray-50'}"><ListIcon size="16"/></button>
            </div>
        </div>
    </div>

    {#if isLoadingData && products.length === 0}
        <div class="flex flex-col items-center justify-center py-20 text-gray-400"><LoaderIcon size="32" class="mb-2 text-blue-300 animate-spin"/><p class="text-xs font-bold">Sedang memuat...</p></div>
    {:else}
        {#if viewMode === 'grid'}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {#each products as product}
                <div class="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden group flex flex-col relative border border-gray-100">
                    {#if product.discount_label} <div class="absolute top-2 right-2 z-10 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded shadow-sm">{product.discount_label}</div> {/if}
                    <div class="relative aspect-square bg-gray-50 overflow-hidden">
                        <img src={product.image_1_url || 'https://placehold.co/300?text=No+Img'} alt={product.name} class="w-full h-full object-cover" loading="lazy" />
                        {#if product.category === 'book'} <span class="absolute top-2 left-2 bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded backdrop-blur-sm">BUKU</span> {/if}
                        <div class="absolute inset-0 bg-black/30 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200 backdrop-blur-[1px]">
                            <button onclick={() => openEditModal(product)} class="bg-white text-blue-600 p-1.5 rounded-lg hover:scale-105 transition shadow-sm"><Edit2Icon size="16"/></button>
                            <button onclick={() => handleDelete(product.id, product.name)} class="bg-white text-red-500 p-1.5 rounded-lg hover:scale-105 transition shadow-sm"><Trash2Icon size="16"/></button>
                        </div>
                    </div>
                    <div class="p-3 flex-1 flex flex-col">
                        <div class="text-[9px] text-gray-400 font-bold uppercase tracking-wide mb-0.5 truncate">{product.subcategory || 'Umum'}</div>
                        <h3 class="text-xs font-bold text-gray-800 line-clamp-2 leading-tight mb-2 flex-1" title={product.name}>{product.name}</h3>
                        <div class="flex justify-between items-end mt-auto">
                            <div>
                                {#if product.display_strike_price > 0 && product.display_strike_price > product.final_price} <div class="text-[9px] text-gray-400 line-through">{formatRupiah(product.display_strike_price)}</div> {/if}
                                <div class="text-sm font-extrabold {product.discount_label ? 'text-red-600' : 'text-gray-900'}">{formatRupiah(product.final_price)}</div>
                            </div>
                            <div class="text-[9px] font-bold px-1.5 py-0.5 rounded {getStockColor(product.stock)}">{product.stock}</div>
                        </div>
                    </div>
                </div>
                {/each}
            </div>
        {:else}
            <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <table class="w-full text-left">
                    <thead class="bg-gray-50 text-gray-500 text-[10px] uppercase font-bold tracking-wider"><tr class="border-b border-gray-100"><th class="p-3">Produk</th><th class="p-3">Kategori</th><th class="p-3">Harga</th><th class="p-3 text-center">Stok</th><th class="p-3 text-right">Aksi</th></tr></thead>
                    <tbody class="divide-y divide-gray-50 text-sm">
                        {#each products as product}
                        <tr class="group hover:bg-gray-50 transition">
                            <td class="p-3 flex items-center gap-3">
                                <img src={product.image_1_url || 'https://placehold.co/100?text=No+Img'} alt="img" class="w-9 h-9 rounded-md object-cover bg-gray-100 border border-gray-100" />
                                <div>
                                    <div class="font-bold text-gray-800 text-xs line-clamp-1">{product.name}</div>
                                    <div class="flex items-center gap-2"><div class="text-[10px] text-gray-400 font-mono">{product.sku || '-'}</div>{#if product.discount_label}<span class="text-[8px] bg-red-100 text-red-600 px-1 rounded font-bold">{product.discount_label}</span>{/if}</div>
                                </div>
                            </td>
                            <td class="p-3 text-xs text-gray-500">{product.subcategory || '-'}</td>
                            <td class="p-3">
                                {#if product.display_strike_price > 0 && product.display_strike_price > product.final_price} <div class="text-[9px] text-gray-400 line-through">{formatRupiah(product.display_strike_price)}</div> {/if}
                                <div class="text-xs font-bold {product.discount_label ? 'text-red-600' : 'text-gray-800'}">{formatRupiah(product.final_price)}</div>
                            </td>
                            <td class="p-3 text-center"><span class="px-1.5 py-0.5 rounded text-[9px] font-bold {getStockColor(product.stock)}">{product.stock}</span></td>
                            <td class="p-3 text-right">
                                <div class="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition">
                                    <button onclick={() => openEditModal(product)} class="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition"><Edit2Icon size="14"/></button>
                                    <button onclick={() => handleDelete(product.id, product.name)} class="text-red-500 hover:bg-red-50 p-1.5 rounded transition"><Trash2Icon size="14"/></button>
                                </div>
                            </td>
                        </tr>
                        {/each}
                    </tbody>
                </table>
            </div>
        {/if}
        {#if products.length === 0} <div class="flex flex-col items-center justify-center py-12 text-gray-400"><FilterIcon size="32" class="mb-2 text-gray-200"/><p class="text-sm">Data kosong.</p></div> {/if}
        
        {#if totalPages > 1}
        <div class="flex justify-center items-center gap-3 mt-6 pb-6">
            <button onclick={() => changePage(currentPage - 1)} disabled={currentPage === 1} class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"><ChevronLeftIcon size="16"/></button>
            <span class="text-xs font-bold text-gray-500 uppercase tracking-wide">Page {currentPage} / {totalPages}</span>
            <button onclick={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} class="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition"><ChevronRightIcon size="16"/></button>
        </div>
        {/if}
    {/if}
</div>

{#if showModal}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm transition-opacity overflow-y-auto">
    <div class="bg-white rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-4 flex flex-col max-h-[90vh]">
        <div class="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50 shrink-0">
            <h3 class="text-lg font-bold text-gray-800">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
            <button onclick={() => showModal = false} class="text-gray-400 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition"><XIcon size="20" /></button>
        </div>
        <div class="p-6 overflow-y-auto custom-scrollbar flex-1">
            <form class="grid grid-cols-1 md:grid-cols-12 gap-6" onsubmit={handleQueueUpload}>
                <div class="md:col-span-8 space-y-5">
                    
                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2"><BoxIcon size="12"/> Informasi Dasar</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div class="col-span-2"><label class="block text-xs font-bold text-gray-600 mb-1">Nama Produk <span class="text-red-500">*</span></label><input type="text" bind:value={formData.name} required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm transition" placeholder="Contoh: Alkitab Besar..."/></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">SKU (Kode)</label><input type="text" bind:value={formData.sku} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm transition" placeholder="Opsional"/></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Jenis Barang</label><select bind:value={formData.category} class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm bg-white"><option value="nonbook">Barang Umum</option><option value="book">Buku / Kitab</option></select></div>
                            <div class="col-span-2"><label class="block text-xs font-bold text-gray-600 mb-1">Sub Kategori</label><input type="text" bind:value={formData.subcategory} list="subcategories-list" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm transition" placeholder="Ketik atau pilih..." /><datalist id="subcategories-list">{#each uniqueSubcategories as sub} <option value={sub}></option> {/each}</datalist></div>
                        </div>
                    </div>
                    
                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2"><FilterIcon size="12"/> Harga & Stok</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Harga Jual (Rp) <span class="text-red-500">*</span></label><input type="number" bind:value={formData.price} required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm font-bold text-gray-800" placeholder="0"/></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Stok Awal <span class="text-red-500">*</span></label><input type="number" bind:value={formData.stock} required class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" placeholder="0"/></div>
                            
                            <div class="col-span-2 bg-blue-50/50 p-3 rounded-lg border border-blue-100">
                                <label class="block text-xs font-bold text-blue-700 mb-1 flex items-center gap-1"><PercentIcon size="12"/> Voucher Diskon (Global)</label>
                                <select bind:value={formData.discount_id} class="w-full px-3 py-2 border border-blue-200 rounded-lg bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-sm mb-2">
                                    <option value={0}>-- Tidak Ada Diskon --</option>
                                    {#each discounts as disc}<option value={disc.id}>{disc.name} ({disc.percentage}%) {disc.is_active ? '✅' : '🔴'}</option>{/each}
                                </select>
                                <label class="block text-xs font-bold text-gray-500 mb-1">Atau Harga Coret Manual</label>
                                <input type="number" bind:value={formData.strike_price} class="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white text-sm" placeholder="Isi harga sebelum diskon..."/>
                            </div>
                        </div>
                    </div>

                    <div class="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 border-b border-gray-100 pb-2"><BoxIcon size="12"/> Fisik (Untuk Ongkir)</h4>
                        <div class="grid grid-cols-5 gap-2">
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">Berat(gr)</label><input type="number" bind:value={formData.weight} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">P(cm)</label><input type="number" bind:value={formData.length} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">L(cm)</label><input type="number" bind:value={formData.width} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">T(cm)</label><input type="number" bind:value={formData.height} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                            <div><label class="text-[9px] font-bold text-gray-500 uppercase">D(cm)</label><input type="number" bind:value={formData.diameter} class="w-full px-2 py-1.5 border border-gray-300 rounded-md text-xs text-center focus:ring-1 focus:ring-blue-200 outline-none" placeholder="0"/></div>
                        </div>
                    </div>

                    {#if formData.category === 'book'}
                    <div class="bg-blue-50/30 p-4 rounded-xl border border-blue-100 space-y-3">
                        <h4 class="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-2 border-b border-blue-100 pb-2"><BookIcon size="12"/> Detail Buku</h4>
                        <div class="grid grid-cols-2 gap-3">
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">ISBN</label><input type="text" bind:value={formData.isbn} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Penulis</label><input type="text" bind:value={formData.author} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Penerbit</label><input type="text" bind:value={formData.publisher} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            <div><label class="block text-xs font-bold text-gray-600 mb-1">Edisi/Versi</label><input type="text" bind:value={formData.book_version} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            <div class="grid grid-cols-2 gap-2 col-span-2">
                                <div><label class="block text-xs font-bold text-gray-600 mb-1">Tahun Terbit</label><input type="number" bind:value={formData.publish_year} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                                <div><label class="block text-xs font-bold text-gray-600 mb-1">Jml Halaman</label><input type="number" bind:value={formData.pages} class="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" /></div>
                            </div>
                        </div>
                    </div>
                    {/if}
                    <div>
                        <label class="block text-xs font-bold text-gray-600 mb-1">Deskripsi Lengkap</label>
                        <textarea bind:value={formData.description} rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 outline-none text-sm" placeholder="Tulis deskripsi produk..."></textarea>
                    </div>
                </div>

                <div class="md:col-span-4 space-y-5">
                    <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                        <h4 class="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3"><ImageIcon size="12"/> Foto & Video</h4>
                        
                        <div class="mb-3">
                            <label class="block text-xs font-bold text-gray-700 mb-1">Foto Utama</label>
                            
                            <div 
                                role="button" 
                                tabindex="0" 
                                onpaste={(e) => handlePaste(e, 'foto_1')} 
                                class="relative border-2 border-dashed {fileStorage.foto_1 || formData.foto_1_url ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'} rounded-xl h-40 flex items-center justify-center hover:border-blue-400 transition cursor-pointer overflow-hidden group"
                                title="Klik Upload atau Paste Gambar (Ctrl+V)"
                            >
                                {#if previews.foto_1}
                                    <img src={previews.foto_1} alt="Preview" class="h-full w-full object-contain p-1" />
                                    <button type="button" onclick={(e) => { e.stopPropagation(); removeFile('foto_1'); }} class="absolute top-1 right-1 bg-white text-red-500 rounded-full p-1 shadow-sm hover:bg-red-50 border border-gray-100 z-30"><XIcon size="12"/></button>
                                {:else}
                                    <div class="text-center pointer-events-none p-4">
                                        <UploadCloudIcon size="24" class="mx-auto text-gray-400 mb-2"/>
                                        <span class="text-xs font-bold text-gray-600 block">Upload / Paste</span>
                                    </div>
                                {/if}
                                {#if !previews.foto_1}
                                    <input type="file" id="foto_1" accept="image/*" onchange={(e) => handleFileChange(e, 'foto_1')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {/if}
                            </div>
                        </div>

                        <div class="grid grid-cols-2 gap-2 mb-4">
                            {#each ['foto_2', 'foto_3'] as f}
                            <div 
                                role="button" tabindex="0" onpaste={(e) => handlePaste(e, f)}
                                class="relative border-2 border-dashed rounded-lg h-20 flex items-center justify-center bg-white hover:border-blue-400 transition cursor-pointer overflow-hidden"
                            >
                                {#if previews[f]} 
                                    <img src={previews[f]} alt="Preview" class="h-full w-full object-contain p-1" /> 
                                    <button type="button" onclick={(e) => { e.stopPropagation(); removeFile(f); }} class="absolute top-0 right-0 bg-white text-red-500 rounded-bl-lg p-0.5 shadow-sm border-l border-b border-gray-100 z-30"><XIcon size="10"/></button>
                                {:else} 
                                    <PlusIcon size="16" class="text-gray-300 pointer-events-none"/> 
                                    <input type="file" id={f} accept="image/*" onchange={(e) => handleFileChange(e, f)} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                {/if}
                            </div>
                            {/each}
                        </div>

                        <div class="pt-3 border-t border-gray-200">
                            <label class="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1"><VideoIcon size="12"/> Video (MP4)</label>
                            <div class="relative border-2 border-dashed {fileStorage.video ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-white'} rounded-lg h-20 flex items-center justify-center hover:border-blue-400 transition cursor-pointer">
                                {#if previews.video} 
                                    <div class="text-[10px] text-green-700 font-bold flex flex-col items-center"><CheckCircleIcon size="16" class="mb-1"/> Ready</div> 
                                    <button type="button" onclick={(e) => { e.stopPropagation(); removeFile('video'); }} class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 z-30"><XIcon size="12"/></button>
                                {:else} 
                                    <span class="text-[10px] text-gray-400 pointer-events-none">Klik Upload</span> 
                                    <input type="file" id="video" accept="video/*" onchange={(e) => handleFileChange(e, 'video')} class="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" /> 
                                {/if}
                            </div>
                        </div>
                    </div>
                </div>

                <div class="md:col-span-12 flex justify-end gap-3 pt-4 border-t border-gray-100 shrink-0">
                    <button type="button" onclick={() => showModal = false} class="px-5 py-2.5 rounded-lg text-sm text-gray-600 font-bold hover:bg-gray-100 transition">Batal</button>
                    <button type="submit" class="px-6 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200">
                        <CheckCircleIcon size="16"/> <span>{editingId ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
{/if} -->