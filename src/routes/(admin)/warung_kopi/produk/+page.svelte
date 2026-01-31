<script>
    import { 
        SearchIcon, PlusIcon, FilterIcon, Edit2Icon, Trash2Icon, XIcon,
        GridIcon, ListIcon, ChevronLeftIcon, ChevronRightIcon, 
        FileTextIcon, LoaderIcon, BookIcon, BoxIcon, UploadCloudIcon,
        ImageIcon, VideoIcon, CheckCircleIcon, AlertCircleIcon, PercentIcon
    } from 'svelte-feather-icons';
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { goto } from '$app/navigation';

    // --- 1. STATE HALAMAN ---
    let products = $state([]); 
    let discounts = $state([]); 
    let isLoadingData = $state(true); 
    
    // Filter State
    let searchQuery = $state('');
    let activeCategory = $state('all'); 
    let viewMode = $state('list'); 
    
    // Pagination State (Server Side)
    let currentPage = $state(1);
    let itemsPerPage = 20; 
    let totalItems = $state(0);     // Total dari server
    let totalPages = $state(1);     // Total halaman dari server

    let isImporting = $state(false);
    let excelInput;

    const CACHE_KEY = 'admin_products_page_1'; 

    // --- 2. FETCH DATA ---
    onMount(async () => {
        const token = localStorage.getItem("token");
        if (!token) { goto('/login'); return; }

        // Load Cache (Hanya untuk tampilan awal instan)
        try {
            const cached = sessionStorage.getItem(CACHE_KEY);
            if (cached) {
                const data = JSON.parse(cached);
                products = data.data || []; 
                isLoadingData = false;
            }
        } catch (e) { console.error(e); }

        // Sync Data Real
        await Promise.all([fetchProducts(), loadDiscounts()]);
    });

    // [PERBAIKAN] Fetch Data Server-Side Pagination
    async function fetchProducts() {
        isLoadingData = true;
        const token = localStorage.getItem("token");
        try {
            // Kirim parameter page, limit, q, category ke Backend
            let url = `${PUBLIC_API_URL}/products/?page=${currentPage}&limit=${itemsPerPage}`;
            if (activeCategory !== 'all') url += `&category=${activeCategory}`;
            if (searchQuery) url += `&q=${searchQuery}`;
            url += `&t=${Date.now()}`;

            const res = await fetch(url, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (res.ok) {
                const result = await res.json();
                
                // Cek format respon backend (Pagination vs List)
                if (result.data) {
                    products = result.data;
                    totalItems = result.total;
                    totalPages = result.total_pages;
                } else {
                    // Fallback jika backend kirim list biasa
                    products = result;
                    totalItems = result.length;
                    totalPages = 1;
                }

                // Cache halaman 1 saja agar navigasi balik cepat
                if (currentPage === 1 && !searchQuery) {
                    sessionStorage.setItem(CACHE_KEY, JSON.stringify(result));
                }
            }
        } catch (e) { console.error(e); } 
        finally { isLoadingData = false; }
    }

    async function loadDiscounts() {
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${PUBLIC_API_URL}/discounts/`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) discounts = await res.json();
        } catch (e) { console.error("Gagal load diskon", e); }
    }

    // --- 3. STATE MODAL & FORM ---
    let showModal = $state(false);
    let editingId = $state(null);

    let formData = $state({
        name: '', sku: '', category: 'nonbook', subcategory: '', 
        price: '', strike_price: '', stock: '', description: '',
        discount_id: 0,
        weight: '', length: '', width: '', height: '', diameter: '',
        isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: '',
        // Field URL Khusus (Hidden logic)
        foto_1_url: '', foto_2_url: '', foto_3_url: '' 
    });

    let fileStorage = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });
    let previews = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });

    let activeUploads = $state([]); 

    // --- 4. ACTION HANDLERS ---
    
    // [PERBAIKAN] Search trigger fetch baru
    function handleSearch() {
        currentPage = 1;
        fetchProducts();
    }

    // [PERBAIKAN] Category trigger fetch baru
    function changeCategory(cat) {
        activeCategory = cat;
        currentPage = 1;
        fetchProducts();
    }

    // [PERBAIKAN] Pagination trigger fetch baru
    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            fetchProducts();
        }
    }

    // --- 5. FILE & PASTE HANDLING ---

    function handleFileChange(e, fieldName) {
        const file = e.target.files[0];
        if (file) {
            fileStorage[fieldName] = file;
            previews[fieldName] = URL.createObjectURL(file);
            formData[fieldName + '_url'] = ''; // Reset URL jika upload manual
        }
    }

    // [BARU] Fitur Paste (Ctrl+V) tanpa merusak desain
    function handlePaste(e, fieldName) {
        const clipboardData = e.clipboardData || window.clipboardData;
        
        // 1. Cek File Gambar di Clipboard
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

        // 2. Cek URL Text di Clipboard
        const pastedText = clipboardData.getData('text');
        if (pastedText && (pastedText.startsWith('http') || pastedText.match(/\.(jpeg|jpg|gif|png|webp)/))) {
            e.preventDefault();
            previews[fieldName] = pastedText; // Tampilkan preview dari link
            formData[fieldName + '_url'] = pastedText; // Simpan URL untuk dikirim
            fileStorage[fieldName] = null; // Hapus file binary
        }
    }

    function removeFile(fieldName) {
        fileStorage[fieldName] = null;
        previews[fieldName] = null;
        if (fieldName.startsWith('foto')) formData[fieldName + '_url'] = ''; 
        const input = document.getElementById(fieldName);
        if(input) input.value = '';
    }

    // --- 6. MODAL ACTIONS ---
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
    
    function openEditModal(product) {
        editingId = product.id;
        formData = { 
            ...product, 
            name: toTitleCase(product.name), 
            subcategory: toTitleCase(product.subcategory),
            discount_id: product.discount ? product.discount.id : 0,
            foto_1_url: '', foto_2_url: '', foto_3_url: '' 
        };
        previews = { 
            foto_1: product.image_1_url, foto_2: product.image_2_url, 
            foto_3: product.image_3_url, video: product.video_url 
        };
        showModal = true;
    }

    // --- 7. UPLOAD & SAVE ---
    function handleQueueUpload(e) {
        e.preventDefault();
        const currentData = { ...formData }; 
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
            
            // Handle Images (Priority: File > URL)
            const imageFields = ['foto_1', 'foto_2', 'foto_3'];
            for (const field of imageFields) {
                if (filesPayload[field] instanceof File) {
                    dataToSend.append(field, filesPayload[field]); 
                } else if (dataPayload[field + '_url']) {
                    dataToSend.append(field + '_url', dataPayload[field + '_url']);
                }
            }
            if (filesPayload.video instanceof File) dataToSend.append('video', filesPayload.video);

            // Append Text Fields
            dataToSend.append('name', toTitleCase(dataPayload.name));
            dataToSend.append('subcategory', toTitleCase(dataPayload.subcategory) || '');
            dataToSend.append('sku', dataPayload.sku || '');
            dataToSend.append('category', dataPayload.category);
            dataToSend.append('price', String(dataPayload.price));
            dataToSend.append('stock', String(dataPayload.stock));
            dataToSend.append('description', dataPayload.description || '');
            
            ['strike_price', 'weight', 'length', 'width', 'height', 'diameter', 'isbn', 'publisher', 'author', 'publish_year', 'pages', 'book_version'].forEach(key => {
                if (dataPayload[key]) dataToSend.append(key, String(dataPayload[key]));
            });

            let url = `${PUBLIC_API_URL}/products/`;
            let method = "POST";
            if (editId) { url = `${PUBLIC_API_URL}/products/${editId}`; method = "PUT"; }

            const res = await fetch(url, {
                method: method,
                headers: { "Authorization": `Bearer ${token}` },
                body: dataToSend
            });

            if (res.ok) {
                const savedProduct = await res.json();
                const prodId = editId || savedProduct.id;

                // Assign Discount
                const discFormData = new FormData();
                discFormData.append('discount_id', dataPayload.discount_id || 0);
                
                await fetch(`${PUBLIC_API_URL}/products/${prodId}/assign-discount`, {
                    method: "PUT",
                    headers: { "Authorization": `Bearer ${token}` },
                    body: discFormData
                });

                updateUploadStatus(uploadId, 'success');
                fetchProducts(); // Refresh Table dengan data baru
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
            setTimeout(() => activeUploads = activeUploads.filter(u => u.id !== id), 4000);
        }
    }

    // --- 8. DELETE ---
    async function handleDelete(id, name) {
        if (!confirm(`Hapus "${name}"?`)) return;
        const token = localStorage.getItem("token");
        try { 
            await fetch(`${PUBLIC_API_URL}/products/${id}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } }); 
            fetchProducts(); // Refresh data dari server
        } catch { alert("Error koneksi."); }
    }

    // --- 9. IMPORT EXCEL ---
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

    // Helpers
    function formatRupiah(num) { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num); }
    function toTitleCase(str) { return str?.toLowerCase().replace(/(?:^|\s)\w/g, m => m.toUpperCase()) || ''; }
    function getStockColor(stock) { return stock === 0 ? 'text-red-600 bg-red-100' : stock < 5 ? 'text-orange-600 bg-orange-100' : 'text-green-600 bg-green-100'; }
    // Unique Subcategories sekarang diambil dari API atau dari data yang tampil (Fallback)
    // Karena pagination server-side, kita sebaiknya ambil list lengkap dari endpoint khusus jika ada, 
    // atau biarkan dynamic dari data yg tampil. Di sini kita biarkan dynamic dari 'products' (20 data) agar simple
    // atau lebih baik hilangkan fitur filter subkategori di tabel admin jika tidak krusial, 
    // tapi kode ini mempertahankan logic lama:
    let uniqueSubcategories = $derived([...new Set(products.map(p => p.subcategory ? p.subcategory.charAt(0).toUpperCase() + p.subcategory.slice(1) : ''))].filter(Boolean).sort());

</script>

<div class="space-y-6 relative min-h-screen pb-20">
    
    <div class="fixed bottom-6 right-6 z-[60] flex flex-col gap-2 w-80">
        {#each activeUploads as upload (upload.id)}
            <div class="bg-white p-3 rounded-xl shadow-2xl border border-gray-100 flex items-center gap-3 animate-in slide-in-from-right duration-300">
                {#if upload.status === 'loading'}
                    <LoaderIcon size="20" class="text-blue-500 animate-spin flex-shrink-0"/>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-bold text-gray-500">Menyimpan...</div>
                        <div class="text-sm font-bold text-gray-800 truncate">{upload.name}</div>
                    </div>
                {:else if upload.status === 'success'}
                    <CheckCircleIcon size="20" class="text-green-500 flex-shrink-0"/>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-bold text-green-600">Berhasil!</div>
                        <div class="text-sm font-bold text-gray-800 truncate">{upload.name}</div>
                    </div>
                {:else}
                    <AlertCircleIcon size="20" class="text-red-500 flex-shrink-0"/>
                    <div class="flex-1 min-w-0">
                        <div class="text-xs font-bold text-red-600">Gagal</div>
                        <div class="text-xs text-gray-500 truncate">{upload.msg || 'Error'}</div>
                    </div>
                    <button on:click={() => activeUploads = activeUploads.filter(u => u.id !== upload.id)} class="text-gray-400 hover:text-gray-600"><XIcon size="14"/></button>
                {/if}
            </div>
        {/each}
    </div>

    <div class="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div class="flex flex-col md:flex-row justify-between items-center gap-4">
            <div><h2 class="text-2xl font-bold text-gray-800 pl-2">Katalog Produk</h2><p class="text-xs text-gray-500 pl-2">Total {totalItems} produk</p></div>
            <div class="flex items-center gap-3 w-full md:w-auto">
                <div class="relative flex-1 md:w-64">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon size="18" /></span>
                    <input type="text" bind:value={searchQuery} on:change={handleSearch} placeholder="Cari Nama / SKU..." class="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-100 outline-none transition" />
                </div>
                <input type="file" bind:this={excelInput} on:change={handleExcelUpload} accept=".xlsx, .xls" hidden />
                <button on:click={() => excelInput.click()} disabled={isImporting} class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                    {#if isImporting} <LoaderIcon size="18" class="animate-spin"/> {:else} <FileTextIcon size="18" /> <span class="hidden md:inline">Import</span> {/if}
                </button>
                <button on:click={openAddModal} class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition">
                    <PlusIcon size="18" /> <span class="hidden md:inline">Baru</span>
                </button>
            </div>
        </div>
        <div class="flex flex-col md:flex-row justify-between items-center gap-4 pt-2 border-t border-gray-50">
            <div class="flex p-1 bg-gray-100 rounded-xl">
                <button on:click={() => changeCategory('all')} class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all {activeCategory === 'all' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}">Semua</button>
                <button on:click={() => changeCategory('book')} class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 {activeCategory === 'book' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"><BookIcon size="14"/> Buku</button>
                <button on:click={() => changeCategory('nonbook')} class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 {activeCategory === 'nonbook' ? 'bg-white text-orange-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}"><BoxIcon size="14"/> Non-Buku</button>
            </div>
            <div class="flex gap-2">
                <button on:click={() => viewMode = 'grid'} class="p-2 rounded-lg transition {viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}"><GridIcon size="18"/></button>
                <button on:click={() => viewMode = 'list'} class="p-2 rounded-lg transition {viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:bg-gray-100'}"><ListIcon size="18"/></button>
            </div>
        </div>
    </div>

    {#if isLoadingData && products.length === 0}
        <div class="flex flex-col items-center justify-center py-20 text-gray-400">
            <LoaderIcon size="48" class="mb-4 text-blue-200 animate-spin"/>
            <p class="animate-pulse font-bold">Sedang memuat data...</p>
        </div>
    {:else}
        {#if viewMode === 'grid'}
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {#each products as product}
                <div class="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden group flex flex-col relative">
                    
                    {#if product.discount_label}
                        <div class="absolute top-2 right-2 z-10 bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-lg animate-pulse">
                            {product.discount_label}
                        </div>
                    {/if}

                    <div class="relative aspect-square bg-gray-50 overflow-hidden">
                        <img src={product.image_1_url || 'https://placehold.co/300?text=No+Img'} alt={product.name} class="w-full h-full object-cover" loading="lazy" />
                        
                        {#if product.category === 'book'} <span class="absolute top-2 left-2 bg-blue-500/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">BUKU</span> {/if}
                        
                        <div class="absolute inset-0 bg-black/40 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition duration-200">
                            <button on:click={() => openEditModal(product)} class="bg-white text-blue-600 p-2 rounded-full hover:scale-110 transition"><Edit2Icon size="16"/></button>
                            <button on:click={() => handleDelete(product.id, product.name)} class="bg-white text-red-500 p-2 rounded-full hover:scale-110 transition"><Trash2Icon size="16"/></button>
                        </div>
                    </div>
                    <div class="p-4 flex-1 flex flex-col">
                        <div class="text-[10px] text-gray-400 uppercase tracking-wide mb-1">{product.subcategory || 'Umum'}</div>
                        <h3 class="text-sm font-bold text-gray-800 line-clamp-2 leading-snug mb-2 flex-1" title={product.name}>{product.name}</h3>
                        <div class="flex justify-between items-end">
                            <div>
                                {#if product.display_strike_price > 0 && product.display_strike_price > product.final_price} 
                                    <div class="text-[10px] text-gray-400 line-through">{formatRupiah(product.display_strike_price)}</div> 
                                {/if}
                                <div class="text-sm font-bold {product.discount_label ? 'text-red-600' : 'text-gray-900'}">
                                    {formatRupiah(product.final_price)}
                                </div>
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
                                <th class="p-4 font-semibold">Produk</th><th class="p-4 font-semibold">Kategori</th><th class="p-4 font-semibold">Harga</th><th class="p-4 font-semibold text-center">Stok</th><th class="p-4 font-semibold text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-100 text-sm">
                            {#each products as product}
                            <tr class="group hover:bg-blue-50/30 transition">
                                <td class="p-4 flex items-center gap-3">
                                    <img src={product.image_1_url || 'https://placehold.co/100?text=No+Img'} alt="img" class="w-10 h-10 rounded-lg object-cover bg-gray-100" />
                                    <div>
                                        <div class="font-bold text-gray-800 text-sm line-clamp-1">{product.name}</div>
                                        <div class="flex items-center gap-2">
                                            <div class="text-xs text-gray-400 font-mono">{product.sku || '-'}</div>
                                            {#if product.discount_label}
                                                <span class="text-[9px] bg-red-100 text-red-600 px-1 rounded font-bold">{product.discount_label}</span>
                                            {/if}
                                        </div>
                                    </div>
                                </td>
                                <td class="p-4 text-xs text-gray-600">{product.subcategory || '-'}</td>
                                <td class="p-4">
                                    {#if product.display_strike_price > 0 && product.display_strike_price > product.final_price}
                                        <div class="text-[10px] text-gray-400 line-through">{formatRupiah(product.display_strike_price)}</div>
                                    {/if}
                                    <div class="text-sm font-bold {product.discount_label ? 'text-red-600' : 'text-gray-700'}">
                                        {formatRupiah(product.final_price)}
                                    </div>
                                </td>
                                <td class="p-4 text-center"><span class="px-2 py-1 rounded text-[10px] font-bold {getStockColor(product.stock)}">{product.stock}</span></td>
                                <td class="p-4 text-right">
                                    <div class="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                                        <button on:click={() => openEditModal(product)} class="text-blue-600 hover:bg-blue-100 p-1.5 rounded"><Edit2Icon size="14"/></button>
                                        <button on:click={() => handleDelete(product.id, product.name)} class="text-red-500 hover:bg-red-100 p-1.5 rounded"><Trash2Icon size="14"/></button>
                                    </div>
                                </td>
                            </tr>
                            {/each}
                        </tbody>
                    </table>
                </div>
            </div>
        {/if}
        {#if products.length === 0} <div class="flex flex-col items-center justify-center py-20 text-gray-400"><FilterIcon size="48" class="mb-4 text-gray-200"/><p>Tidak ada produk yang cocok.</p></div> {/if}
        {#if totalPages > 1}
        <div class="flex justify-center items-center gap-4 mt-8">
            <button on:click={() => changePage(currentPage - 1)} disabled={currentPage === 1} class="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30"><ChevronLeftIcon size="20"/></button>
            <span class="text-sm font-bold text-gray-600">Hal {currentPage} / {totalPages}</span>
            <button on:click={() => changePage(currentPage + 1)} disabled={currentPage === totalPages} class="p-2 rounded-full border border-gray-200 hover:bg-gray-50 disabled:opacity-30"><ChevronRightIcon size="20"/></button>
        </div>
        {/if}
    {/if}
</div>

{#if showModal}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity overflow-y-auto">
    <div class="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        <div class="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
            <h3 class="text-xl font-bold text-gray-800">{editingId ? 'Edit Produk' : 'Tambah Produk'}</h3>
            <button on:click={() => showModal = false} class="text-gray-400 hover:text-red-500 p-2"><XIcon size="24" /></button>
        </div>
        <div class="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <form class="grid grid-cols-1 md:grid-cols-12 gap-8" on:submit={handleQueueUpload}>
                <div class="md:col-span-8 space-y-6">
                    
                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><BoxIcon size="14"/> Informasi Dasar</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="col-span-2"><label class="block text-sm font-bold text-gray-700 mb-1">Nama Produk</label><input type="text" bind:value={formData.name} required class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label class="block text-sm font-bold text-gray-700 mb-1">SKU</label><input type="text" bind:value={formData.sku} class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label class="block text-sm font-bold text-gray-700 mb-1">Jenis</label><select bind:value={formData.category} class="w-full px-4 py-2 border rounded-xl"><option value="nonbook">Barang Umum</option><option value="book">Buku / Kitab</option></select></div>
                            <div><label class="block text-sm font-bold text-gray-700 mb-1">Sub Kategori</label><input type="text" bind:value={formData.subcategory} list="subcategories-list" class="w-full px-4 py-2 border rounded-xl" /><datalist id="subcategories-list">{#each uniqueSubcategories as sub} <option value={sub}></option> {/each}</datalist></div>
                        </div>
                    </div>
                    
                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><FilterIcon size="14"/> Harga & Diskon</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="block text-sm font-bold text-gray-700 mb-1">Harga Jual</label><input type="number" bind:value={formData.price} required class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label class="block text-sm font-bold text-gray-700 mb-1">Stok</label><input type="number" bind:value={formData.stock} required class="w-full px-4 py-2 border rounded-xl" /></div>
                            
                            <div class="col-span-2 bg-blue-50 p-3 rounded-xl border border-blue-100">
                                <label class="block text-sm font-bold text-blue-800 mb-1 flex items-center gap-2">
                                    <PercentIcon size="14"/> Voucher Diskon (Global)
                                </label>
                                <select bind:value={formData.discount_id} class="w-full px-4 py-2 border border-blue-200 rounded-xl bg-white text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none">
                                    <option value={0}>-- Tidak Ada Diskon --</option>
                                    {#each discounts as disc}
                                        <option value={disc.id}>
                                            {disc.name} ({disc.percentage}%) {disc.is_active ? '✅ Aktif' : '🔴 Nonaktif'}
                                        </option>
                                    {/each}
                                </select>
                                <p class="text-[10px] text-blue-600 mt-1">*Jika dipilih, harga coret manual di bawah akan diabaikan.</p>
                            </div>

                            <div class="col-span-2 opacity-60 hover:opacity-100 transition">
                                <label class="block text-sm font-bold text-gray-500 mb-1">Harga Coret (Manual)</label>
                                <input type="number" bind:value={formData.strike_price} class="w-full px-4 py-2 border rounded-xl bg-gray-100" placeholder="Opsional jika tidak pakai voucher"/>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><BoxIcon size="14"/> Dimensi & Berat</h4>
                        <div class="grid grid-cols-5 gap-2">
                            <div><label class="text-[10px] font-bold text-gray-500">Berat (gr)</label><input type="number" bind:value={formData.weight} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                            <div><label class="text-[10px] font-bold text-gray-500">P (cm)</label><input type="number" bind:value={formData.length} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                            <div><label class="text-[10px] font-bold text-gray-500">L (cm)</label><input type="number" bind:value={formData.width} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                            <div><label class="text-[10px] font-bold text-gray-500">T (cm)</label><input type="number" bind:value={formData.height} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                            <div><label class="text-[10px] font-bold text-gray-500">D (cm)</label><input type="number" bind:value={formData.diameter} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                        </div>
                    </div>

                    {#if formData.category === 'book'}
                    <div class="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-4">
                        <h4 class="text-sm font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2"><BookIcon size="14"/> Data Buku</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="block text-sm">ISBN</label><input type="text" bind:value={formData.isbn} class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label class="block text-sm">Penulis</label><input type="text" bind:value={formData.author} class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label class="block text-sm">Penerbit</label><input type="text" bind:value={formData.publisher} class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label class="block text-sm">Versi</label><input type="text" bind:value={formData.book_version} class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div class="grid grid-cols-2 gap-2 col-span-2">
                                <div><label class="block text-sm">Tahun</label><input type="number" bind:value={formData.publish_year} class="w-full px-4 py-2 border rounded-xl" /></div>
                                <div><label class="block text-sm">Hal</label><input type="number" bind:value={formData.pages} class="w-full px-4 py-2 border rounded-xl" /></div>
                            </div>
                        </div>
                    </div>
                    {/if}
                    <textarea bind:value={formData.description} rows="3" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Deskripsi..."></textarea>
                </div>

                <div class="md:col-span-4 space-y-6">
                    <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><ImageIcon size="14"/> Media</h4>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1">Thumbnail</label>
                        <div 
                            role="button" 
                            tabindex="0" 
                            on:paste={(e) => handlePaste(e, 'foto_1')} 
                            class="relative border-2 border-dashed {fileStorage.foto_1 || formData.foto_1_url ? 'border-green-400' : 'border-blue-300'} rounded-xl h-40 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition focus:ring-2 focus:ring-blue-200 outline-none"
                            title="Klik untuk Upload atau Tekan Ctrl+V untuk Paste Gambar/Link"
                        >
                            {#if previews.foto_1}
                                <img src={previews.foto_1} alt="Preview" class="h-full w-full object-cover rounded-lg" />
                                <button type="button" on:click={() => removeFile('foto_1')} class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><XIcon size="14"/></button>
                            {:else}
                                <div class="text-center"><UploadCloudIcon size="24" class="mx-auto text-gray-400"/><span class="text-xs font-bold text-gray-500">Pilih / Paste (Ctrl+V)</span></div>
                            {/if}
                            <input type="file" id="foto_1" accept="image/*" on:change={(e) => handleFileChange(e, 'foto_1')} class="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        {#each ['foto_2', 'foto_3'] as f}
                        <div 
                            role="button" 
                            tabindex="0" 
                            on:paste={(e) => handlePaste(e, f)}
                            class="relative border-2 border-dashed rounded-xl h-24 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition focus:ring-2 focus:ring-blue-200 outline-none"
                            title="Paste (Ctrl+V) supported"
                        >
                            {#if previews[f]} <img src={previews[f]} alt="Preview" class="h-full w-full object-cover rounded-lg" /> <button type="button" on:click={() => removeFile(f)} class="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"><XIcon size="10"/></button>
                            {:else} <PlusIcon size="20" class="text-gray-400"/> {/if}
                            <input type="file" id={f} accept="image/*" on:change={(e) => handleFileChange(e, f)} class="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        {/each}
                    </div>

                    <div class="pt-4 border-t border-gray-100">
                        <label class="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2"><VideoIcon size="14"/> Video</label>
                        <div class="relative border-2 border-dashed {fileStorage.video ? 'border-green-400' : 'border-gray-300'} rounded-xl h-24 flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition">
                            {#if previews.video} <div class="text-xs text-green-600 font-bold flex flex-col items-center"><CheckCircleIcon size="20" class="mb-1"/> Video OK</div> <button type="button" on:click={() => removeFile('video')} class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><XIcon size="12"/></button>
                            {:else} <span class="text-xs text-gray-400">Upload MP4</span> {/if}
                            <input type="file" id="video" accept="video/*" on:change={(e) => handleFileChange(e, 'video')} class="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>

                <div class="md:col-span-12 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" on:click={() => showModal = false} class="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition">Batal</button>
                    <button type="submit" class="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition flex items-center gap-2 shadow-lg shadow-blue-200">
                        <UploadCloudIcon size="20"/> <span>{editingId ? 'Update & Tutup' : 'Simpan & Baru'}</span>
                    </button>
                </div>
            </form>
        </div>
    </div>
</div>
{/if}