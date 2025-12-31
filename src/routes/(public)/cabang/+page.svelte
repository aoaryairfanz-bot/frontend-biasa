<script>
    // 1. TERIMA DATA DARI SERVER (+page.js)
    let { data } = $props(); 
    
    // Pastikan data branches ada, jika tidak kosongkan array
    let branches = $derived(data.branches || []); 

    // 2. STATE PENCARIAN
    let searchQuery = $state("");

    // 3. LOGIKA FILTER (Nama & Alamat)
    let filteredBranches = $derived(branches.filter(branch => {
        const term = searchQuery.toLowerCase();
        const name = (branch.name || "").toLowerCase();
        const address = (branch.address || "").toLowerCase();
        return name.includes(term) || address.includes(term);
    }));

    // 4. HELPER LINK WHATSAPP
    function getWALink(phone) {
        if (!phone) return "#";
        // Hapus karakter selain angka
        const clean = phone.replace(/\D/g, '');
        return `https://wa.me/${clean}`;
    }
</script>

<div class="min-h-screen bg-white pb-20 pt-8 font-sans text-gray-800">
    <div class="container mx-auto px-4 max-w-6xl">
        
        <div class="mb-8 border-b border-gray-100 pb-6">
            <h1 class="text-3xl font-bold tracking-tight mb-2">Daftar Cabang</h1>
            <p class="text-gray-500">Temukan lokasi Narwastu terdekat di kota Anda.</p>
        </div>

        <div class="mb-8">
            <input 
                type="text" 
                bind:value={searchQuery} 
                placeholder="Cari nama kota atau alamat..." 
                class="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition placeholder-gray-400 font-medium"
            />
        </div>

        {#if filteredBranches.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredBranches as branch}
                <div class="border border-gray-200 rounded-lg p-6 hover:border-black transition duration-200 flex flex-col h-full bg-white shadow-sm">
                    
                    <div class="mb-4">
                        <h2 class="text-xl font-bold text-gray-900 leading-tight mb-2">{branch.name}</h2>
                        <div class="h-1 w-10 bg-red-600"></div>
                    </div>

                    <div class="mb-6 flex-grow">
                        <p class="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Alamat</p>
                        <p class="text-gray-700 text-sm leading-relaxed">
                            {branch.address || '-'}
                        </p>
                    </div>

                    <div class="flex gap-4 pt-4 border-t border-gray-100 mt-auto text-sm">
                        {#if branch.map_url && branch.map_url.length > 5}
                            <a href={branch.map_url} target="_blank" rel="noopener noreferrer" class="font-bold text-blue-700 hover:underline hover:text-blue-900">
                                Buka Peta
                            </a>
                        {:else}
                            <span class="font-bold text-gray-300 cursor-not-allowed">Peta Tidak Ada</span>
                        {/if}

                        <span class="text-gray-300">|</span>

                        {#if branch.whatsapp}
                            <a href={getWALink(branch.whatsapp)} target="_blank" rel="noopener noreferrer" class="font-bold text-green-700 hover:underline hover:text-green-900">
                                Hubungi WA
                            </a>
                        {:else}
                            <span class="font-bold text-gray-300 cursor-not-allowed">WA Tidak Ada</span>
                        {/if}
                    </div>

                </div>
                {/each}
            </div>
        {:else}
            <div class="py-16 text-center border-2 border-dashed border-gray-100 rounded-xl bg-gray-50">
                <p class="text-gray-500 font-medium">Data cabang tidak ditemukan.</p>
                {#if branches.length === 0}
                    <p class="text-xs text-gray-400 mt-2">Belum ada data dari server.</p>
                {/if}
            </div>
        {/if}

    </div>
</div>