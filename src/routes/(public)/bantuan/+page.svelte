<script>
    import { onMount } from 'svelte';
    import { PUBLIC_API_URL } from '$env/static/public';
    import { SearchIcon, MessageCircleIcon, CreditCardIcon, TruckIcon, PackageIcon, HelpCircleIcon } from 'svelte-feather-icons';

    // --- STATE NOMOR WA ---
    // Default nomor (jaga-jaga loading belum selesai)
    let adminPhone = $state("628112936949"); 

    // --- FETCH DATA DARI DB ---
    onMount(async () => {
        try {
            const res = await fetch(`${PUBLIC_API_URL}/branches?include_inactive=false`);
            if (res.ok) {
                const raw = await res.json();
                let list = Array.isArray(raw) ? raw : (raw.data || []);
                
                // Cari ID 1 (Pusat) atau fallback ke yang punya WA pertama
                const pusat = list.find(b => b.id === 1) || list.find(b => b.whatsapp);
                
                if (pusat && pusat.whatsapp) {
                    // Bersihkan karakter non-angka agar link wa.me valid
                    adminPhone = pusat.whatsapp.replace(/\D/g, ''); 
                }
            }
        } catch (error) {
            console.error("Gagal ambil nomor admin:", error);
        }
    });

    // Data Langkah Pemesanan
    const steps = [
        {
            icon: SearchIcon,
            title: "1. Pilih Produk",
            desc: "Jelajahi katalog kami. Gunakan fitur pencarian atau filter kategori untuk menemukan perlengkapan rohani yang Anda butuhkan."
        },
        {
            icon: MessageCircleIcon,
            title: "2. Klik 'Beli'",
            desc: "Klik tombol 'Beli' pada produk. Anda akan diarahkan otomatis ke WhatsApp Admin Pusat kami dengan format pesanan yang sudah terisi."
        },
        {
            icon: CreditCardIcon,
            title: "3. Konfirmasi & Bayar",
            desc: "Admin akan mengecek stok dan menghitung ongkos kirim. Lakukan pembayaran via transfer bank sesuai instruksi Admin."
        },
        {
            icon: TruckIcon,
            title: "4. Pengiriman",
            desc: "Setelah pembayaran terkonfirmasi, pesanan akan diproses, dikemas aman, dan dikirim ke alamat tujuan Anda."
        }
    ];

    // Data FAQ / Info Tambahan
    const infos = [
        {
            title: "Metode Pembayaran",
            desc: "Kami menerima pembayaran melalui Transfer Bank (BCA, Mandiri, BRI). Detail rekening akan diinformasikan oleh Admin di WhatsApp."
        },
        {
            title: "Jasa Pengiriman",
            desc: "Kami bekerja sama dengan JNE, J&T, SiCepat, dan Cargo untuk pengiriman barang besar (Patung/Salib Besar)."
        },
        {
            title: "Kebijakan Retur",
            desc: "Wajib menyertakan Video Unboxing saat membuka paket. Kerusakan akibat pengiriman akan kami bantu klaim ke ekspedisi terkait."
        }
    ];
</script>

<svelte:head>
    <title>Cara Pemesanan - Narwastu</title>
</svelte:head>

<div class="min-h-screen bg-white font-sans pb-20">
    
    <div class="bg-white pt-10 pb-8 border-b border-gray-50">
        <div class="container mx-auto px-4 max-w-4xl text-center">
            <h1 class="text-2xl md:text-3xl font-extrabold text-gray-900 mb-3 uppercase tracking-wider" style="font-family: 'Cinzel', serif;">
                Panduan Belanja
            </h1>
            <p class="text-sm text-gray-500 max-w-xl mx-auto leading-relaxed">
                Berbelanja di Narwastu sangat mudah. Ikuti langkah sederhana berikut untuk memesan perlengkapan rohani kebutuhan Anda.
            </p>
        </div>
    </div>

    <div class="container mx-auto px-4 max-w-5xl py-10">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            
            <div class="hidden lg:block absolute top-8 left-0 w-full h-0.5 bg-gray-100 -z-10 transform translate-y-4"></div>

            {#each steps as step, i}
                <div class="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group text-center h-full flex flex-col items-center">
                    
                    <div class="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-[#C4161C] mb-4 group-hover:scale-110 transition-transform duration-300 relative z-10 border-4 border-white">
                        <step.icon size="28" stroke-width="1.5" />
                    </div>

                    <h3 class="text-lg font-bold text-gray-800 mb-2">{step.title}</h3>
                    <p class="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
            {/each}
        </div>
    </div>

    <div class="container mx-auto px-4 max-w-4xl mt-4">
        <div class="bg-gray-50 rounded-2xl p-6 md:p-10">
            <h2 class="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                <HelpCircleIcon size="20" class="text-[#C4161C]" />
                Informasi Penting
            </h2>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
                {#each infos as info}
                    <div class="flex flex-col gap-2">
                        <h4 class="text-sm font-bold text-gray-800 uppercase tracking-wide border-l-2 border-[#C4161C] pl-3">
                            {info.title}
                        </h4>
                        <p class="text-xs text-gray-500 leading-relaxed pl-3.5 text-justify">
                            {info.desc}
                        </p>
                    </div>
                {/each}
            </div>
        </div>
    </div>

    <div class="container mx-auto px-4 text-center mt-12">
        <p class="text-sm text-gray-400 mb-4">Masih ada pertanyaan?</p>
        
        <a href="https://wa.me/{adminPhone}" target="_blank" class="inline-flex items-center gap-2 px-8 py-3 bg-[#25D366] hover:bg-[#1ebc57] text-white font-bold rounded-full transition-all shadow-lg hover:shadow-green-100 active:scale-95 text-sm">
            <MessageCircleIcon size="18" />
            Chat Admin Sekarang
        </a>
    </div>

</div>