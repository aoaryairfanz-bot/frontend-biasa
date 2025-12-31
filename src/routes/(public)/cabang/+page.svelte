<script>
    // --- 1. DATA DARI SERVER ---
    let { data } = $props(); 
    let branches = $derived(data.branches || []); 

    // --- 2. STATE PENCARIAN ---
    let searchQuery = $state("");

    // --- 3. FILTER CABANG ---
    let filteredBranches = $derived(branches.filter(branch => {
        const term = searchQuery.toLowerCase();
        const name = (branch.name || "").toLowerCase();
        const address = (branch.address || "").toLowerCase();
        return name.includes(term) || address.includes(term);
    }));

    // --- 4. HELPER LINK WA ---
    function getWALink(phone) {
        const clean = phone ? phone.replace(/\D/g, '') : '';
        return `https://wa.me/${clean}`;
    }
</script>

<div class="min-h-screen bg-white pb-24 pt-8 font-sans text-gray-800">
    <div class="container mx-auto px-4 max-w-5xl">
        
        <div class="mb-8 border-b border-gray-100 pb-6">
            <h1 class="text-3xl font-bold tracking-tight mb-2">Daftar Cabang</h1>
            <p class="text-gray-500">Temukan lokasi Narwastu terdekat.</p>
        </div>

        <div class="mb-10">
            <input 
                type="text" 
                bind:value={searchQuery} 
                placeholder="Ketik nama kota atau alamat..." 
                class="w-full p-4 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition placeholder-gray-400 font-medium"
            />
        </div>

        {#if filteredBranches.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                {#each filteredBranches as branch}
                <div class="border border-gray-200 rounded-lg p-6 hover:border-black transition duration-200 flex flex-col h-full bg-white">
                    
                    <div class="mb-4">
                        <h2 class="text-xl font-bold mb-1">{branch.name}</h2>
                        <span class="inline-block bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded">Resmi</span>
                    </div>

                    <div class="mb-6 flex-grow">
                        <p class="text-xs font-bold text-gray-400 uppercase mb-1">Alamat</p>
                        <p class="text-gray-700 leading-relaxed text-sm">
                            {branch.address || '-'}
                        </p>
                    </div>

                    <div class="flex gap-4 pt-4 border-t border-gray-100 mt-auto">
                        {#if branch.map_url}
                            <a href={branch.map_url} target="_blank" class="text-sm font-bold text-blue-600 hover:underline">
                                Buka Peta
                            </a>
                        {:else}
                            <span class="text-sm font-bold text-gray-300 cursor-not-allowed">Peta Tidak Ada</span>
                        {/if}

                        <span class="text-gray-300">|</span>

                        {#if branch.whatsapp}
                            <a href={getWALink(branch.whatsapp)} target="_blank" class="text-sm font-bold text-green-600 hover:underline">
                                Hubungi WA
                            </a>
                        {:else}
                            <span class="text-sm font-bold text-gray-300 cursor-not-allowed">WA Tidak Ada</span>
                        {/if}
                    </div>

                </div>
                {/each}
            </div>
        {:else}
            <div class="py-12 text-center border-2 border-dashed border-gray-100 rounded-lg">
                <p class="text-gray-400 font-medium">Data cabang tidak ditemukan.</p>
            </div>
        {/if}

    </div>
</div>