<script>
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { SearchIcon, MessageCircleIcon, CreditCardIcon, TruckIcon, HelpCircleIcon } from 'svelte-feather-icons';

    // --- STATE NOMOR WA ---
    let adminPhone = $state("628112936949"); 

    // --- FETCH DATA DARI DB ---
    onMount(async () => {
        try {
            const res = await fetch(`${PUBLIC_API_URL}/branches?include_inactive=false`);
            if (res.ok) {
                const raw = await res.json();
                let list = Array.isArray(raw) ? raw : (raw.data || []);
                
                // Cari ID 1 (Pusat) atau fallback ke yang punya WA
                const pusat = list.find(b => b.id === 1) || list.find(b => b.whatsapp);
                
                if (pusat && pusat.whatsapp) {
                    adminPhone = pusat.whatsapp.replace(/\D/g, ''); 
                }
            }
        } catch (error) {
            console.error("Gagal ambil nomor admin:", error);
        }
    });

    const steps = [
        {
            icon: SearchIcon,
            title: "1. Pilih Produk",
            desc: "Cari produk di katalog web. Pilih barang yang diinginkan."
        },
        {
            icon: MessageCircleIcon,
            title: "2. Klik Tombol Beli",
            desc: "Klik 'Beli', Akan langsung diarahkan ke WhatsApp Admin kami."
        },
        {
            icon: CreditCardIcon,
            title: "3. Pembayaran",
            desc: "Admin akan memberikan info total harga + ongkir. Lakukan transfer sesuai instruksi."
        },
        {
            icon: TruckIcon,
            title: "4. Pengiriman",
            desc: "Pesanan diproses dan dikirim ke alamat tujuan setelah pembayaran lunas."
        }
    ];

    const infos = [
        {
            title: "Metode Pembayaran",
            desc: "Transfer Bank (BCA, Mandiri, BRI)."
        },
        {
            title: "Jasa Pengiriman",
            desc: "JNE, J&T, SiCepat, dan Cargo untuk barang besar."
        },
        {
            title: "Retur Barang",
            desc: "Wajib menyertakan Video Unboxing untuk klaim kerusakan."
        }
    ];
</script>

<svelte:head>
    <title>Cara Pemesanan - Narwastu</title>
</svelte:head>

<div class="min-h-screen bg-white font-sans pb-20 pt-8 text-gray-800">
    
    <div class="container mx-auto px-4 max-w-xl">

        <div class="mb-8 text-center md:text-left">
            <h1 class="text-xl md:text-2xl font-bold text-gray-900 mb-2">Panduan Belanja</h1>
            <p class="text-sm text-gray-500">Ikuti langkah mudah berikut untuk memesan produk.</p>
        </div>

        <div class="space-y-6">
            {#each steps as step, i}
                <div class="flex gap-4 items-start">
                    <div class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-700 shrink-0 mt-1">
                        <step.icon size="18" />
                    </div>
                    
                    <div class="pb-6 border-b border-gray-100 w-full last:border-0">
                        <h3 class="font-bold text-gray-900 text-sm mb-1">{step.title}</h3>
                        <p class="text-sm text-gray-500 leading-relaxed">
                            {step.desc}
                        </p>
                    </div>
                </div>
            {/each}
        </div>

        <div class="mt-10 pt-8 border-t border-gray-100">
            <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <HelpCircleIcon size="18" />
                Info Lainnya
            </h2>

            <div class="space-y-4">
                {#each infos as info}
                    <div class="bg-gray-50 rounded-lg p-4">
                        <h4 class="text-sm font-bold text-gray-800 mb-1">
                            {info.title}
                        </h4>
                        <p class="text-sm text-gray-600">
                            {info.desc}
                        </p>
                    </div>
                {/each}
            </div>
        </div>

        <div class="mt-10">
            <a href="https://wa.me/{adminPhone}" target="_blank" class="flex items-center justify-center gap-2 w-full py-3 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-lg transition-all shadow-sm active:scale-95 text-sm">
                <MessageCircleIcon size="18" />
                Chat Admin Sekarang
            </a>
            <p class="text-xs text-gray-400 text-center mt-3">Butuh bantuan cepat? Hubungi kami via WhatsApp.</p>
        </div>

    </div>
</div>