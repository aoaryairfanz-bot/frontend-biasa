<script>
    import { 
        SearchIcon, PlusIcon, FilterIcon, MoreVerticalIcon, 
        Edit2Icon, Trash2Icon, EyeIcon, XIcon, UploadCloudIcon,
        BookIcon, BoxIcon, VideoIcon, ImageIcon, CheckCircleIcon, 
        AlertTriangleIcon, GridIcon, ListIcon, ChevronLeftIcon, ChevronRightIcon,
        FileTextIcon, LoaderIcon
    } from 'svelte-feather-icons';
    import { invalidateAll } from '$app/navigation'; 

    // --- 1. DATA DARI LOAD FUNCTION ---
    let { data } = $props(); 
    let products = $derived(data.products || []); 

    // Dropdown Subkategori (Unik & Sorted)
    let uniqueSubcategories = $derived([...new Set(products.map(p => {
        const cat = p.subcategory || '';
        return cat.charAt(0).toUpperCase() + cat.slice(1);
    }).filter(Boolean))].sort());

    // --- 2. STATE VARIABLE ---
    let searchQuery = $state('');
    let showModal = $state(false); 
    let isSubmitting = $state(false); 
    let isImporting = $state(false); 
    let editingId = $state(null); 
    let excelInput; 

    // FILTER & VIEW STATE
    let activeCategory = $state('all'); 
    let viewMode = $state('grid'); 
    let currentPage = $state(1);
    let itemsPerPage = 10; 

    // PENAMPUNG FILE (File Asli)
    let fileStorage = $state({
        foto_1: null, foto_2: null, foto_3: null, video: null
    });

    // Form Data Teks (LENGKAP SESUAI JSON)
    let formData = $state({
        name: '', 
        sku: '', 
        category: 'nonbook', 
        subcategory: '', 
        price: '', 
        strike_price: '', 
        stock: '', 
        description: '',
        // Fisik
        weight: '', 
        length: '', 
        width: '', 
        height: '', 
        diameter: '',
        // Buku
        isbn: '', 
        publisher: '', 
        author: '', 
        publish_year: '', 
        pages: '', 
        book_version: '' // Tambahan yang sempat kurang
    });

    // Preview URL
    let previews = $state({
        foto_1: null, foto_2: null, foto_3: null, video: null
    });

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

    // --- 4. HELPER ---
    function formatRupiah(num) {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(num);
    }
    
    function getStockColor(stock) {
        if (stock === 0) return 'text-red-600 bg-red-100';
        if (stock < 5) return 'text-orange-600 bg-orange-100';
        return 'text-green-600 bg-green-100';
    }

    function toTitleCase(str) {
        if (!str) return '';
        return str.toLowerCase().replace(/(?:^|\s)\w/g, function(match) {
            return match.toUpperCase();
        });
    }

    function changePage(newPage) {
        if (newPage >= 1 && newPage <= totalPages) currentPage = newPage;
    }

    // --- 5. FILE HANDLING ---
    function handleFileChange(e, fieldName) {
        const file = e.target.files[0];
        if (file) {
            fileStorage[fieldName] = file; 
            previews[fieldName] = URL.createObjectURL(file);
        }
    }

    function removeFile(fieldName) {
        fileStorage[fieldName] = null;
        previews[fieldName] = null; 
        const input = document.getElementById(`input-${fieldName}`);
        if(input) input.value = '';
    }

    // --- 6. EXCEL IMPORT HANDLING ---
    async function handleExcelUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        isImporting = true;
        const API_BASE = "https://aryairfan-backendbiasa.hf.space";
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
                if (result.error_log && result.error_log.length > 0) {
                    msg += "⚠️ Error:\n" + result.error_log.join("\n");
                }
                alert(msg);
                await invalidateAll(); 
            } else {
                alert("Gagal Import: " + (result.detail || result.error || "Terjadi kesalahan"));
            }
        } catch (error) {
            console.error(error);
            alert("Error koneksi upload Excel.");
        } finally {
            isImporting = false;
            if (excelInput) excelInput.value = ''; 
        }
    }

    // --- 7. ACTIONS & SUBMIT ---
    function openEditModal(product) {
        editingId = product.id;
        // Isi form LENGKAP
        formData = {
            name: toTitleCase(product.name), 
            sku: product.sku,
            category: product.category || 'nonbook',
            subcategory: toTitleCase(product.subcategory),
            price: product.price,
            strike_price: product.strike_price,
            stock: product.stock,
            description: product.description,
            // Fisik
            weight: product.weight, 
            length: product.length, 
            width: product.width, 
            height: product.height, 
            diameter: product.diameter,
            // Buku
            isbn: product.isbn, 
            publisher: product.publisher, 
            author: product.author, 
            publish_year: product.publish_year, 
            pages: product.pages, 
            book_version: product.book_version 
        };
        previews = {
            foto_1: product.image_1_url,
            foto_2: product.image_2_url,
            foto_3: product.image_3_url,
            video: product.video_url
        };
        fileStorage = { foto_1: null, foto_2: null, foto_3: null, video: null };
        showModal = true;
    }

    async function handleDelete(id, name) {
        if (!confirm(`Yakin hapus "${name}"?`)) return;
        const API_BASE = "https://aryairfan-backendbiasa.hf.space";
        const token = localStorage.getItem("token");
        try {
            const res = await fetch(`${API_BASE}/products/${id}`, {
                method: "DELETE",
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) { await invalidateAll(); } else { alert("Gagal hapus."); }
        } catch (error) { alert("Error koneksi."); }
    }

    async function handleSubmit(e) {
        e.preventDefault(); 
        if (!fileStorage.foto_1 && !previews.foto_1) { alert("Wajib ada Thumbnail!"); return; }
        isSubmitting = true;
        const API_BASE = "https://aryairfan-backendbiasa.hf.space";
        const token = localStorage.getItem("token");

        try {
            const dataToSend = new FormData();
            const capName = toTitleCase(formData.name);
            const capSub = toTitleCase(formData.subcategory);

            // Wajib & Teks Dasar
            dataToSend.append('name', capName);
            dataToSend.append('subcategory', capSub || '');
            dataToSend.append('sku', formData.sku || '');
            dataToSend.append('category', formData.category);
            dataToSend.append('price', String(formData.price));
            dataToSend.append('stock', String(formData.stock));
            dataToSend.append('description', formData.description || '');
            
            // Angka Opsional (Kirim string kosong atau angka)
            if (formData.strike_price) dataToSend.append('strike_price', String(formData.strike_price));
            
            // FISIK (Weight, Dimensions)
            if (formData.weight) dataToSend.append('weight', String(formData.weight));
            if (formData.length) dataToSend.append('length', String(formData.length));
            if (formData.width) dataToSend.append('width', String(formData.width));
            if (formData.height) dataToSend.append('height', String(formData.height));
            if (formData.diameter) dataToSend.append('diameter', String(formData.diameter));

            // BUKU
            if (formData.category === 'book') {
                if (formData.isbn) dataToSend.append('isbn', formData.isbn);
                if (formData.publisher) dataToSend.append('publisher', formData.publisher);
                if (formData.author) dataToSend.append('author', formData.author);
                if (formData.publish_year) dataToSend.append('publish_year', String(formData.publish_year));
                if (formData.pages) dataToSend.append('pages', String(formData.pages));
                if (formData.book_version) dataToSend.append('book_version', formData.book_version);
            }

            // FILE
            if (fileStorage.foto_1) dataToSend.append('foto_1', fileStorage.foto_1); 
            if (fileStorage.foto_2) dataToSend.append('foto_2', fileStorage.foto_2);
            if (fileStorage.foto_3) dataToSend.append('foto_3', fileStorage.foto_3);
            if (fileStorage.video) dataToSend.append('video', fileStorage.video);

            let url = `${API_BASE}/products/`;
            let method = "POST";
            if (editingId) { url = `${API_BASE}/products/${editingId}`; method = "PUT"; }

            const res = await fetch(url, {
                method: method,
                headers: { "Authorization": `Bearer ${token}` },
                body: dataToSend
            });

            if (res.ok) {
                alert("Sukses!"); showModal = false; resetForm(); await invalidateAll(); 
            } else {
                const err = await res.json(); alert("Gagal: " + (err.detail || "Error"));
            }
        } catch (error) { alert("Gagal koneksi."); } finally { isSubmitting = false; }
    }

    function resetForm() {
        editingId = null; 
        formData = {
            name: '', sku: '', category: 'nonbook', subcategory: '', price: '', strike_price: '', stock: '', description: '',
            weight: '', length: '', width: '', height: '', diameter: '',
            isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: ''
        };
        fileStorage = { foto_1: null, foto_2: null, foto_3: null, video: null };
        previews = { foto_1: null, foto_2: null, foto_3: null, video: null };
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

                <button onclick={() => { resetForm(); showModal = true; }} class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-blue-200">
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
</div>

{#if showModal}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity overflow-y-auto">
    <div class="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        <div class="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
            <h3 class="text-xl font-bold text-gray-800">{editingId ? 'Edit Produk' : 'Tambah Produk'}</h3>
            <button onclick={() => showModal = false} class="text-gray-400 hover:text-red-500 p-2"><XIcon size="24" /></button>
        </div>

        <div class="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <form class="grid grid-cols-1 md:grid-cols-12 gap-8" onsubmit={handleSubmit}>
                
                <div class="md:col-span-8 space-y-6">
                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><BoxIcon size="14"/> Informasi Dasar</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="col-span-2">
                                <label class="block text-sm font-bold text-gray-700 mb-1" for="name">Nama Produk</label>
                                <input type="text" id="name" bind:value={formData.name} required class="w-full px-4 py-2 border rounded-xl" />
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1" for="sku">SKU</label>
                                <input type="text" id="sku" bind:value={formData.sku} class="w-full px-4 py-2 border rounded-xl" />
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1" for="category">Jenis</label>
                                <select id="category" bind:value={formData.category} class="w-full px-4 py-2 border rounded-xl">
                                    <option value="nonbook">Barang Umum</option>
                                    <option value="book">Buku / Kitab</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1" for="subcategory">Sub Kategori</label>
                                <input type="text" id="subcategory" bind:value={formData.subcategory} list="subcategories-list" class="w-full px-4 py-2 border rounded-xl" />
                                <datalist id="subcategories-list">
                                    {#each uniqueSubcategories as sub} <option value={sub}></option> {/each}
                                </datalist>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                         <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><FilterIcon size="14"/> Harga & Stok</h4>
                        <div class="grid grid-cols-3 gap-4">
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1" for="price">Harga Jual</label>
                                <input type="number" id="price" bind:value={formData.price} required class="w-full px-4 py-2 border rounded-xl" />
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1" for="stock">Stok</label>
                                <input type="number" id="stock" bind:value={formData.stock} required class="w-full px-4 py-2 border rounded-xl" />
                            </div>
                            <div>
                                <label class="block text-sm font-bold text-gray-700 mb-1" for="strike_price">Coret</label>
                                <input type="number" id="strike_price" bind:value={formData.strike_price} class="w-full px-4 py-2 border rounded-xl" />
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-50 p-5 rounded-2xl border border-gray-100 space-y-4">
                        <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><BoxIcon size="14"/> Dimensi & Berat</h4>
                        <div class="grid grid-cols-5 gap-2">
                            <div><label class="text-[10px] font-bold text-gray-500" for="weight">Berat (gr)</label><input type="number" id="weight" bind:value={formData.weight} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                            <div><label class="text-[10px] font-bold text-gray-500" for="length">P (cm)</label><input type="number" id="length" bind:value={formData.length} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                            <div><label class="text-[10px] font-bold text-gray-500" for="width">L (cm)</label><input type="number" id="width" bind:value={formData.width} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                            <div><label class="text-[10px] font-bold text-gray-500" for="height">T (cm)</label><input type="number" id="height" bind:value={formData.height} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                            <div><label class="text-[10px] font-bold text-gray-500" for="diameter">D (cm)</label><input type="number" id="diameter" bind:value={formData.diameter} class="w-full px-2 py-2 border rounded-lg text-sm" placeholder="0"/></div>
                        </div>
                    </div>

                    {#if formData.category === 'book'}
                    <div class="bg-blue-50 p-5 rounded-2xl border border-blue-100 space-y-4">
                        <h4 class="text-sm font-bold text-blue-500 uppercase tracking-wider flex items-center gap-2"><BookIcon size="14"/> Data Buku</h4>
                        <div class="grid grid-cols-2 gap-4">
                            <div><label class="block text-sm" for="isbn">ISBN</label><input type="text" id="isbn" bind:value={formData.isbn} class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label class="block text-sm" for="author">Penulis</label><input type="text" id="author" bind:value={formData.author} class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label class="block text-sm" for="publisher">Penerbit</label><input type="text" id="publisher" bind:value={formData.publisher} class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div><label class="block text-sm" for="version">Versi</label><input type="text" id="version" bind:value={formData.book_version} class="w-full px-4 py-2 border rounded-xl" /></div>
                            <div class="grid grid-cols-2 gap-2 col-span-2">
                                <div><label class="block text-sm" for="year">Tahun</label><input type="number" id="year" bind:value={formData.publish_year} class="w-full px-4 py-2 border rounded-xl" /></div>
                                <div><label class="block text-sm" for="pages">Hal</label><input type="number" id="pages" bind:value={formData.pages} class="w-full px-4 py-2 border rounded-xl" /></div>
                            </div>
                        </div>
                    </div>
                    {/if}
                    
                    <textarea id="desc" bind:value={formData.description} rows="3" class="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Deskripsi..."></textarea>
                </div>

                <div class="md:col-span-4 space-y-6">
                    <h4 class="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2"><ImageIcon size="14"/> Media</h4>
                    
                    <div>
                        <label class="block text-sm font-bold text-gray-700 mb-1" for="foto_1">Thumbnail (Wajib)</label>
                        <div class="relative border-2 border-dashed {fileStorage.foto_1 ? 'border-green-400' : 'border-blue-300'} rounded-xl h-40 flex items-center justify-center">
                            {#if previews.foto_1}
                                <img src={previews.foto_1} alt="Preview" class="h-full w-full object-cover rounded-lg" />
                                <button type="button" onclick={() => removeFile('foto_1')} class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><XIcon size="14"/></button>
                            {:else}
                                <div class="text-center"><UploadCloudIcon size="24" class="mx-auto text-gray-400"/><span class="text-xs">Upload</span></div>
                            {/if}
                            <input type="file" id="foto_1" accept="image/*" onchange={(e) => handleFileChange(e, 'foto_1')} class="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        {#each ['foto_2', 'foto_3'] as f}
                        <div class="relative border-2 border-dashed rounded-xl h-24 flex items-center justify-center">
                            {#if previews[f]}
                                <img src={previews[f]} alt="Preview" class="h-full w-full object-cover rounded-lg" />
                                <button type="button" onclick={() => removeFile(f)} class="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"><XIcon size="10"/></button>
                            {:else}
                                <PlusIcon size="20" class="text-gray-400"/>
                            {/if}
                            <input type="file" id={f} accept="image/*" onchange={(e) => handleFileChange(e, f)} class="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                        {/each}
                    </div>

                    <div class="pt-4 border-t border-gray-100">
                        <label class="block text-sm font-bold text-gray-700 mb-1 flex items-center gap-2" for="video"><VideoIcon size="14"/> Video Produk</label>
                        <div class="relative border-2 border-dashed {fileStorage.video ? 'border-green-400' : 'border-gray-300'} rounded-xl h-24 flex items-center justify-center">
                            {#if previews.video}
                                <div class="text-xs text-green-600 font-bold flex flex-col items-center">
                                    <CheckCircleIcon size="20" class="mb-1"/> Video OK
                                </div>
                                <button type="button" onclick={() => removeFile('video')} class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><XIcon size="12"/></button>
                            {:else}
                                <span class="text-xs text-gray-400">Upload MP4</span>
                            {/if}
                            <input type="file" id="video" accept="video/*" onchange={(e) => handleFileChange(e, 'video')} class="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>

                <div class="md:col-span-12 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" onclick={() => showModal = false} class="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition">
                        Batal
                    </button>
                    
                    <button type="submit" disabled={isSubmitting} 
                        class="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                        
                        {#if isSubmitting}
                            <LoaderIcon size="20" class="animate-spin" />
                            <span>Menyimpan...</span>
                        {:else}
                            <UploadCloudIcon size="20"/>
                            <span>{editingId ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
                        {/if}
                        
                    </button>
                </div>

            </form>
        </div>
    </div>
</div>
{/if}