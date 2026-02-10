<script>
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { MapPinIcon, PhoneIcon, ClockIcon, NavigationIcon } from 'svelte-feather-icons';

    // --- STATE ---
    let branch = $state({
        name: "Narwastu Store Yogyakarta",
        address: "Jl. Beo No.40, Demangan Baru, Caturtunggal, Kec. Depok, Kabupaten Sleman, Daerah Istimewa Yogyakarta 55281",
        whatsapp: "628112936949",
        // [FIX] INI LINK EMBED YANG BENAR UNTUK NARWASTU
        map_url: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3953.186847141549!2d110.39054797455322!3d-7.770019977073286!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a59c26b91176d%3A0x705973711910609d!2sNarwastu%20Store!5e0!3m2!1sid!2id!4v1707800000000!5m2!1sid!2id"
    });
    
    let isLoading = $state(true);

    // --- FETCH DATA ---
    onMount(async () => {
        try {
            const res = await fetch(`${PUBLIC_API_URL}/branches?include_inactive=false`);
            if (res.ok) {
                const raw = await res.json();
                let list = Array.isArray(raw) ? raw : (raw.data || []);
                
                // Cari ID 1 (Pusat)
                const pusat = list.find(b => b.id === 1);
                if (pusat) {
                    // Kita ambil data teksnya, tapi JAGA map_url agar tetap pakai versi Embed yg benar
                    // KECUALI di database Baginda sudah diganti jadi link embed.
                    branch.name = pusat.name;
                    branch.address = pusat.address;
                    branch.whatsapp = pusat.whatsapp;
                    // Jika di DB ada link embed, pakai. Jika tidak, pakai default Narwastu di atas.
                    if (pusat.map_url && pusat.map_url.includes("embed")) {
                        branch.map_url = pusat.map_url;
                    }
                }
            }
        } catch (e) {
            console.error("Gagal load data kontak", e);
        } finally {
            isLoading = false;
        }
    });

    function getWALink(phone) {
        if (!phone) return "#";
        const clean = phone.replace(/\D/g, '');
        return `https://wa.me/${clean}`;
    }
</script>

<svelte:head>
    <title>Kontak - Narwastu</title>
</svelte:head>

<div class="min-h-screen bg-white font-sans pb-20">
    
    <div class="bg-white pt-8 pb-4">
        <div class="container mx-auto px-4 max-w-4xl text-center">
            <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 mb-2 uppercase tracking-wider" style="font-family: 'Cinzel', serif;">
                Narwastu - Toko Kristiani
            </h1>
            <p class="text-xs md:text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
                Pusat pernak-pernik rohani dan perlengkapan ibadah berkualitas. Melayani dengan sepenuh hati.
            </p>
        </div>
    </div>

    <div class="container mx-auto px-4 max-w-5xl">
        <div class="bg-white rounded-2xl overflow-hidden flex flex-col-reverse md:flex-row border border-gray-200 shadow-sm">
            
            <div class="w-full md:w-1/3 p-6 flex flex-col justify-center bg-white relative z-10">
                <div class="mb-6">
                    <span class="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase tracking-widest rounded mb-3">
                        Lokasi Utama
                    </span>
                    
                    <h2 class="text-lg font-bold text-gray-900 mb-3 leading-tight">
                        {branch.name.replace('Narwastu ', '')}
                    </h2>
                    
                    <div class="flex items-start gap-3 mb-3">
                        <div class="mt-0.5 text-gray-900 shrink-0"><MapPinIcon size="16" /></div>
                        <p class="text-xs text-gray-600 leading-relaxed">
                            {branch.address}
                        </p>
                    </div>

                    <div class="flex items-start gap-3 mb-4">
                        <div class="mt-0.5 text-gray-900 shrink-0"><ClockIcon size="16" /></div>
                        <div class="text-xs text-gray-600">
                            <p class="font-bold text-gray-800">Senin - Sabtu</p>
                            <p>08:00 - 17:00 WIB</p>
                            <p class="text-red-500 italic mt-0.5">Minggu Libur</p>
                        </div>
                    </div>
                </div>

                <div class="flex flex-col gap-2 mt-auto">
                    <a href="https://www.google.com/maps/search/?api=1&query={encodeURIComponent(branch.address)}" target="_blank" class="flex items-center justify-center gap-2 w-full py-2.5 bg-[#C4161C] hover:bg-red-800 text-white font-bold rounded-lg transition text-xs shadow-sm">
                        <NavigationIcon size="14" />
                        Petunjuk Arah
                    </a>
                    
                    {#if branch.whatsapp}
                    <a href={getWALink(branch.whatsapp)} target="_blank" class="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-lg transition text-xs shadow-sm">
                        <PhoneIcon size="14" />
                        Chat WhatsApp
                    </a>
                    {/if}
                </div>
            </div>

            <div class="w-full md:w-2/3 h-[300px] md:h-auto bg-gray-100 relative min-h-[300px]">
                {#if isLoading}
                    <div class="absolute inset-0 flex items-center justify-center text-gray-400 animate-pulse bg-gray-50">
                        <MapPinIcon class="animate-bounce mb-2 mr-2" /> Memuat...
                    </div>
                {/if}
                
                <iframe 
                    src={branch.map_url}
                    width="100%" 
                    height="100%" 
                    style="border:0;" 
                    allowfullscreen="" 
                    loading="lazy" 
                    referrerpolicy="no-referrer-when-downgrade"
                    title="Lokasi Narwastu"
                    class="absolute inset-0 w-full h-full grayscale-[20%] hover:grayscale-0 transition duration-500"
                ></iframe>
            </div>

        </div>
    </div>

</div>