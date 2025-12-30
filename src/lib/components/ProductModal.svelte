<script>
    import { 
        XIcon, UploadCloudIcon, LoaderIcon, CheckCircleIcon, 
        BoxIcon, FilterIcon, BookIcon, ImageIcon, PlusIcon 
    } from 'svelte-feather-icons';
    import { PUBLIC_API_URL } from '$env/static/public';
    import imageCompression from 'browser-image-compression';

    // --- PROPS DARI PARENT ---
    // Menggunakan $props() untuk menerima data dari halaman utama
    let { show, editData, subcategories = [], onClose, onSuccess } = $props();

    // --- STATE ---
    let isSubmitting = $state(false);
    let submitStatus = $state('');
    let fileStorage = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });
    let previews = $state({ foto_1: null, foto_2: null, foto_3: null, video: null });
    
    // Form Default
    let formData = $state({
        name: '', sku: '', category: 'nonbook', subcategory: '', price: '', strike_price: '', stock: '', description: '',
        weight: '', length: '', width: '', height: '', diameter: '',
        isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: ''
    });

    // --- EFFECT: ISI FORM OTOMATIS SAAT EDIT ---
    $effect(() => {
        if (show) {
            if (editData) {
                // Mode Edit: Salin data yang ada ke form
                formData = { 
                    name: editData.name,
                    sku: editData.sku,
                    category: editData.category,
                    subcategory: editData.subcategory,
                    price: editData.price,
                    strike_price: editData.strike_price,
                    stock: editData.stock,
                    description: editData.description,
                    weight: editData.weight,
                    length: editData.length,
                    width: editData.width,
                    height: editData.height,
                    diameter: editData.diameter,
                    isbn: editData.isbn,
                    publisher: editData.publisher,
                    author: editData.author,
                    publish_year: editData.publish_year,
                    pages: editData.pages,
                    book_version: editData.book_version
                };
                // Load preview gambar dari URL server
                previews.foto_1 = editData.image_1_url;
                previews.foto_2 = editData.image_2_url;
                previews.foto_3 = editData.image_3_url;
                previews.video = editData.video_url;
                // Reset file fisik (karena belum ada yg diupload baru)
                fileStorage = { foto_1: null, foto_2: null, foto_3: null, video: null };
            } else {
                // Mode Tambah: Kosongkan form
                resetForm();
            }
        }
    });

    function resetForm() {
        formData = {
            name: '', sku: '', category: 'nonbook', subcategory: '', price: '', strike_price: '', stock: '', description: '',
            weight: '', length: '', width: '', height: '', diameter: '',
            isbn: '', publisher: '', author: '', publish_year: '', pages: '', book_version: ''
        };
        fileStorage = { foto_1: null, foto_2: null, foto_3: null, video: null };
        previews = { foto_1: null, foto_2: null, foto_3: null, video: null };
    }

    // --- LOGIKA FILE & GAMBAR ---
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

    function toTitleCase(str) {
        return str?.toLowerCase().replace(/(?:^|\s)\w/g, m => m.toUpperCase()) || '';
    }

    // --- SUBMIT DENGAN KOMPRESI ---
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Validasi: Wajib ada thumbnail
        if (!fileStorage.foto_1 && !previews.foto_1) { alert("Wajib ada Thumbnail!"); return; }

        isSubmitting = true;
        submitStatus = "Memproses Gambar...";
        const token = localStorage.getItem("token");
        const compressionOptions = { maxSizeMB: 0.5, maxWidthOrHeight: 1280, useWebWorker: true, initialQuality: 0.7 };

        try {
            const dataToSend = new FormData();
            
            // 1. Proses Gambar (Kompresi)
            const imageFields = ['foto_1', 'foto_2', 'foto_3'];
            for (const field of imageFields) {
                if (fileStorage[field] instanceof File) {
                    try {
                        const compressed = await imageCompression(fileStorage[field], compressionOptions);
                        dataToSend.append(field, compressed, compressed.name);
                    } catch { 
                        // Jika gagal kompres, kirim file asli
                        dataToSend.append(field, fileStorage[field]); 
                    }
                }
            }
            
            // 2. Proses Video (Langsung tanpa kompresi)
            if (fileStorage.video instanceof File) dataToSend.append('video', fileStorage.video);

            submitStatus = "Mengirim...";
            
            // 3. Proses Data Teks
            dataToSend.append('name', toTitleCase(formData.name));
            dataToSend.append('subcategory', toTitleCase(formData.subcategory) || '');
            dataToSend.append('sku', formData.sku || '');
            dataToSend.append('category', formData.category);
            dataToSend.append('price', String(formData.price));
            dataToSend.append('stock', String(formData.stock));
            dataToSend.append('description', formData.description || '');

            // Field Opsional
            const optionalFields = ['strike_price', 'weight', 'length', 'width', 'height', 'diameter', 'isbn', 'publisher', 'author', 'publish_year', 'pages', 'book_version'];
            optionalFields.forEach(key => {
                if (formData[key]) dataToSend.append(key, String(formData[key]));
            });

            // Tentukan Endpoint (POST untuk Baru, PUT untuk Edit)
            let url = `${PUBLIC_API_URL}/products/`;
            let method = "POST";
            if (editData && editData.id) { 
                url = `${PUBLIC_API_URL}/products/${editData.id}`; 
                method = "PUT"; 
            }

            const res = await fetch(url, {
                method: method,
                headers: { "Authorization": `Bearer ${token}` },
                body: dataToSend
            });

            if (res.ok) {
                alert("Sukses!");
                onSuccess(); // Beritahu halaman utama untuk refresh
            } else {
                const err = await res.json();
                alert("Gagal: " + (err.detail || "Error"));
            }
        } catch (error) { 
            console.error(error); alert("Gagal koneksi."); 
        } finally { 
            isSubmitting = false; 
        }
    }
</script>

{#if show}
<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm transition-opacity overflow-y-auto">
    <div class="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 my-8">
        
        <div class="flex justify-between items-center p-6 border-b border-gray-100 bg-gray-50 sticky top-0 z-10">
            <h3 class="text-xl font-bold text-gray-800">{editData ? 'Edit Produk' : 'Tambah Produk'}</h3>
            <button on:click={onClose} class="text-gray-400 hover:text-red-500 p-2"><XIcon size="24" /></button>
        </div>

        <div class="p-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
            <form class="grid grid-cols-1 md:grid-cols-12 gap-8" on:submit={handleSubmit}>
                
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
                                    {#each subcategories as sub} <option value={sub}></option> {/each}
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
                                <button type="button" on:click={() => removeFile('foto_1')} class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><XIcon size="14"/></button>
                            {:else}
                                <div class="text-center"><UploadCloudIcon size="24" class="mx-auto text-gray-400"/><span class="text-xs">Upload</span></div>
                            {/if}
                            <input type="file" id="foto_1" accept="image/*" on:change={(e) => handleFileChange(e, 'foto_1')} class="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-2">
                        {#each ['foto_2', 'foto_3'] as f}
                        <div class="relative border-2 border-dashed rounded-xl h-24 flex items-center justify-center">
                            {#if previews[f]}
                                <img src={previews[f]} alt="Preview" class="h-full w-full object-cover rounded-lg" />
                                <button type="button" on:click={() => removeFile(f)} class="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"><XIcon size="10"/></button>
                            {:else}
                                <PlusIcon size="20" class="text-gray-400"/>
                            {/if}
                            <input type="file" id={f} accept="image/*" on:change={(e) => handleFileChange(e, f)} class="absolute inset-0 opacity-0 cursor-pointer" />
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
                                <button type="button" on:click={() => removeFile('video')} class="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1"><XIcon size="12"/></button>
                            {:else}
                                <span class="text-xs text-gray-400">Upload MP4</span>
                            {/if}
                            <input type="file" id="video" accept="video/*" on:change={(e) => handleFileChange(e, 'video')} class="absolute inset-0 opacity-0 cursor-pointer" />
                        </div>
                    </div>
                </div>

                <div class="md:col-span-12 flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button type="button" on:click={onClose} class="px-6 py-3 rounded-xl text-gray-600 font-bold hover:bg-gray-100 transition">
                        Batal
                    </button>
                    
                    <button type="submit" disabled={isSubmitting} 
                        class="px-8 py-3 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-200 disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2">
                        
                        {#if isSubmitting}
                            <LoaderIcon size="20" class="animate-spin" />
                            <span>{submitStatus || "Menyimpan..."}</span>
                        {:else}
                            <UploadCloudIcon size="20"/>
                            <span>{editData ? 'Simpan Perubahan' : 'Simpan Produk'}</span>
                        {/if}
                        
                    </button>
                </div>

            </form>
        </div>
    </div>
</div>
{/if}