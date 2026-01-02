<script>
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { MapPinIcon, PhoneIcon, SearchIcon } from 'svelte-feather-icons';

    // --- STATE ---
    let branches = $state([]);
    let searchQuery = $state("");
    let isLoading = $state(true);

    // --- FETCH DATA (Client Side) ---
    onMount(async () => {
        try {
            // URL API sesuai instruksi: include_inactive=false
            const res = await fetch(`${PUBLIC_API_URL}/branches?include_inactive=false`);
            if (res.ok) {
                const raw = await res.json();
                let list = [];
                if (Array.isArray(raw)) list = raw;
                else if (raw.data) list = raw.data;
                
                branches = list;
            }
        } catch (e) {
            console.error("Gagal load cabang", e);
        } finally {
            isLoading = false;
        }
    });

    // --- FILTER ---
    let filteredBranches = $derived(branches.filter(branch => {
        const term = searchQuery.toLowerCase();
        const name = (branch.name || "").toLowerCase();
        const address = (branch.address || "").toLowerCase();
        return name.includes(term) || address.includes(term);
    }));

    // --- HELPER ---
    function getWALink(phone) {
        if (!phone) return "#";
        const clean = phone.replace(/\D/g, '');
        return `https://wa.me/${clean}`;
    }
</script>

<svelte:head>
    <title>Cabang - Narwastu</title>
</svelte:head>

<div class="min-h-screen bg-white pb-20 pt-6 font-sans text-gray-800">
    <div class="container mx-auto px-4 max-w-2xl">
        
        <h1 class="text-2xl font-bold tracking-tight mb-6 text-center">Cabang</h1>

        <div class="relative mb-8">
            <input 
                type="text" 
                bind:value={searchQuery} 
                placeholder="Cari kota..." 
                class="w-full py-3 pl-10 pr-4 bg-gray-50 border-none rounded-lg focus:ring-0 text-sm font-medium placeholder-gray-400 transition-all duration-200"
            />
            <div class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                <SearchIcon size="16" />
            </div>
        </div>

        {#if isLoading}
            <div class="space-y-6">
                {#each Array(3) as _}
                    <div class="animate-pulse">
                        <div class="h-5 bg-gray-100 rounded w-1/3 mb-2"></div>
                        <div class="h-3 bg-gray-100 rounded w-3/4 mb-4"></div>
                        <div class="h-8 bg-gray-100 rounded w-1/4"></div>
                    </div>
                {/each}
            </div>

        {:else if filteredBranches.length > 0}
            <div class="space-y-8">
                {#each filteredBranches as branch}
                    <div class="group">
                        <h2 class="text-lg font-bold text-gray-900 mb-1">
                            {branch.name.replace('Cabang ', '').replace('Narwastu ', '')}
                        </h2>
                        
                        <p class="text-sm text-gray-500 leading-relaxed mb-3 max-w-md">
                            {branch.address || '-'}
                        </p>

                        <div class="flex items-center gap-4 text-xs font-bold tracking-wide">
                            {#if branch.map_url}
                                <a href={branch.map_url} target="_blank" class="flex items-center gap-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                                    <MapPinIcon size="14" />
                                    <span>PETA</span>
                                </a>
                            {/if}

                            {#if branch.whatsapp}
                                <a href={getWALink(branch.whatsapp)} target="_blank" class="flex items-center gap-1.5 text-gray-400 hover:text-green-600 transition-colors">
                                    <PhoneIcon size="14" />
                                    <span>WHATSAPP</span>
                                </a>
                            {/if}
                        </div>
                    </div>
                {/each}
            </div>

        {:else}
            <div class="text-center py-10 text-gray-400 text-sm italic">
                Tidak ditemukan.
            </div>
        {/if}

    </div>
</div>