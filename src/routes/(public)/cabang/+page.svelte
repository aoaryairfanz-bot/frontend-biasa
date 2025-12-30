<script>
    import { MapPinIcon, PhoneIcon, ClockIcon, SearchIcon, NavigationIcon, AlertCircleIcon } from 'svelte-feather-icons';

    // --- 1. DATA DARI SERVER ---
    let { data } = $props(); 
    let branches = $derived(data.branches || []); 

    // --- 2. STATE ---
    let searchQuery = $state("");

    // --- 3. FILTER ---
    let filteredBranches = $derived(branches.filter(branch => {
        const term = searchQuery.toLowerCase();
        const name = (branch.name || "").toLowerCase();
        const address = (branch.address || "").toLowerCase();
        return name.includes(term) || address.includes(term);
    }));

    // --- 4. HELPER ---
    function getWALink(phone, name) {
        const cleanPhone = phone ? phone.replace(/\D/g, '') : ''; 
        return `https://wa.me/${cleanPhone}`;
    }
</script>

<div class="min-h-screen bg-gray-50 pb-24 pt-6">
    <div class="container mx-auto px-4">
        
        <div class="text-center mb-8">
            <h1 class="text-3xl font-bold text-gray-800" style="font-family: 'Cinzel', serif;">Lokasi <span class="text-[#C4161C]">Kami</span></h1>
        </div>

        <div class="max-w-md mx-auto mb-8 relative">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"><SearchIcon size="20"/></span>
            <input type="text" bind:value={searchQuery} placeholder="Cari cabang..." class="w-full pl-12 pr-4 py-3 rounded-full border border-gray-200 focus:outline-none focus:border-[#C4161C] shadow-sm bg-white"/>
        </div>

        {#if filteredBranches.length > 0}
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {#each filteredBranches as branch}
                <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                    
                    <div class="h-40 bg-gray-200 relative overflow-hidden">
                        {#if branch.image_url}
                            <img src={branch.image_url} alt={branch.name} class="w-full h-full object-cover" />
                        {:else}
                            <div class="w-full h-full flex items-center justify-center bg-[#C4161C] text-white">
                                <span class="font-bold text-xl opacity-50">{branch.name.charAt(0)}</span>
                            </div>
                        {/if}
                    </div>

                    <div class="p-5 flex-1 space-y-3">
                        <h3 class="font-bold text-lg text-gray-800">{branch.name}</h3>
                        
                        <div class="flex items-start gap-3 text-gray-600 text-sm">
                            <MapPinIcon size="16" class="text-[#C4161C] mt-1 flex-shrink-0"/>
                            <p>{branch.address || '-'}</p>
                        </div>
                        
                        {#if branch.operating_hours}
                        <div class="flex items-center gap-3 text-gray-600 text-sm">
                            <ClockIcon size="16" class="text-[#FFD700] flex-shrink-0"/>
                            <p>{branch.operating_hours}</p>
                        </div>
                        {/if}
                    </div>

                    <div class="p-4 border-t border-gray-50 grid grid-cols-2 gap-3">
                        {#if branch.map_url}
                            <a href={branch.map_url} target="_blank" class="flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50">
                                <NavigationIcon size="14"/> Maps
                            </a>
                        {:else}
                            <button disabled class="flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-100 text-gray-300 text-xs font-bold">Maps</button>
                        {/if}

                        {#if branch.phone}
                            <a href={getWALink(branch.phone, branch.name)} target="_blank" class="flex items-center justify-center gap-2 py-2 rounded-lg bg-green-600 text-white text-xs font-bold hover:bg-green-700">
                                <PhoneIcon size="14"/> WhatsApp
                            </a>
                        {:else}
                            <button disabled class="flex items-center justify-center gap-2 py-2 rounded-lg bg-gray-100 text-gray-400 text-xs font-bold">WhatsApp</button>
                        {/if}
                    </div>

                </div>
                {/each}
            </div>
        {:else}
            <div class="text-center py-10 text-gray-400">
                <p>Tidak ada cabang ditemukan.</p>
            </div>
        {/if}
    </div>
</div>