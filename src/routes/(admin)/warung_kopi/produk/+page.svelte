<script>
    import { 
        SearchIcon, PlusIcon, FilterIcon, MoreVerticalIcon, 
        Edit2Icon, Trash2Icon, EyeIcon, XIcon, UploadCloudIcon,
        BookIcon, BoxIcon, VideoIcon, ImageIcon, CheckCircleIcon, 
        AlertTriangleIcon, GridIcon, ListIcon, ChevronLeftIcon, ChevronRightIcon,
        FileTextIcon, LoaderIcon
    } from 'svelte-feather-icons';
    import { invalidateAll } from '$app/navigation'; 
    import { PUBLIC_API_URL } from '$env/static/public'; // 1. Tambahkan Import PUBLIC_API_URL

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

    // Form Data Teks
    let formData = $state({
        name: '', sku: '', category: 'nonbook', subcategory: '', price: '', strike_price: '', stock: '', description: '',
        weight: '', length: '', width: '', height: '', diameter: '',
        isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: ''
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
        return str.toLowerCase().replace(/(?:^|\s)\w/g, (match) => match.toUpperCase());
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
        const API_BASE = PUBLIC_API_URL; // 2. Gunakan PUBLIC_API_URL
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
            alert("Error koneksi upload Excel.");
        } finally {
            isImporting = false;
            if (excelInput) excelInput.value = ''; 
        }
    }

    // --- 7. ACTIONS & SUBMIT ---
    function openEditModal(product) {
        editingId = product.id;
        formData = {
            name: toTitleCase(product.name), 
            sku: product.sku,
            category: product.category || 'nonbook',
            subcategory: toTitleCase(product.subcategory),
            price: product.price,
            strike_price: product.strike_price,
            stock: product.stock,
            description: product.description,
            weight: product.weight, 
            length: product.length, 
            width: product.width, 
            height: product.height, 
            diameter: product.diameter,
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
        const API_BASE = PUBLIC_API_URL; // 3. Gunakan PUBLIC_API_URL
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
        const API_BASE = PUBLIC_API_URL; // 4. Gunakan PUBLIC_API_URL
        const token = localStorage.getItem("token");

        try {
            const dataToSend = new FormData();
            const capName = toTitleCase(formData.name);
            const capSub = toTitleCase(formData.subcategory);

            dataToSend.append('name', capName);
            dataToSend.append('subcategory', capSub || '');
            dataToSend.append('sku', formData.sku || '');
            dataToSend.append('category', formData.category);
            dataToSend.append('price', String(formData.price));
            dataToSend.append('stock', String(formData.stock));
            dataToSend.append('description', formData.description || '');
            
            if (formData.strike_price) dataToSend.append('strike_price', String(formData.strike_price));
            if (formData.weight) dataToSend.append('weight', String(formData.weight));
            if (formData.length) dataToSend.append('length', String(formData.length));
            if (formData.width) dataToSend.append('width', String(formData.width));
            if (formData.height) dataToSend.append('height', String(formData.height));
            if (formData.diameter) dataToSend.append('diameter', String(formData.diameter));

            if (formData.category === 'book') {
                if (formData.isbn) dataToSend.append('isbn', formData.isbn);
                if (formData.publisher) dataToSend.append('publisher', formData.publisher);
                if (formData.author) dataToSend.append('author', formData.author);
                if (formData.publish_year) dataToSend.append('publish_year', String(formData.publish_year));
                if (formData.pages) dataToSend.append('pages', String(formData.pages));
                if (formData.book_version) dataToSend.append('book_version', formData.book_version);
            }

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
    </div>