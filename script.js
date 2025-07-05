document.addEventListener('DOMContentLoaded', () => {
    // Data produk HARINFOOD
    const produkData = [
        { 
            id: 1, 
            nama: "Risol", 
            harga: 3000, 
            gambar: "risol.webp" // Menggunakan gambar lokal risol.webp
        },
        { 
            id: 2, 
            nama: "Cibay", 
            harga: 2500, 
            gambar: "cibay.webp"
        },
        { 
            id: 3, 
            nama: "Citung", 
            harga: 2500, 
            gambar: "citung.webp" 
        },
        { 
            id: 4, 
            nama: "Topokki", 
            harga: 5000, 
            gambar: "toppoki.webp" 
        },
        { 
            id: 5, 
            nama: "Tteokbokki Besar", 
            harga: 10000, 
            gambar: "toppoki.webp" 
        },
        { 
            id: 6, 
            nama: "Spaghetti", 
            harga: 6000, 
            gambar: "spaghetti.webp" 
        },
        { 
            id: 7, 
            nama: "Spaghetti Besar", 
            harga: 10000, 
            gambar: "spaghetti.webp" 
        },
        { 
            id: 8, 
            nama: "Balungan", 
            harga: 5000, 
            gambar: "balungan.webp" 
        },
        { 
            id: 9, 
            nama: "Es Teh Jumbo", 
            harga: 3000, 
            gambar: "esteh.webp" 
        }
    ];

    const produkList = document.getElementById('produk-list');
    const keranjangItems = document.getElementById('keranjang-items');
    const keranjangTotal = document.getElementById('keranjang-total');
    const clearKeranjangBtn = document.getElementById('clear-keranjang');
    const cetakPesananBtn = document.getElementById('cetak-pesanan');
    const pesanWhatsappBtn = document.getElementById('pesan-whatsapp');
    const namaPemesanInput = document.getElementById('nama-pemesan');
    const alamatPemesanInput = document.getElementById('alamat-pemesan'); 
    const keteranganPesananInput = document.getElementById('keterangan-pesanan'); 

    const addManualOrderFab = document.getElementById('add-manual-order-fab');
    const manualOrderModal = document.getElementById('manualOrderModal');
    const manualProductNameInput = document.getElementById('manualProductName');
    const manualProductPriceInput = document.getElementById('manualProductPrice');
    const manualProductQtyInput = document.getElementById('manualProductQty');

    let keranjang = [];
    let nextManualItemId = 1000; // ID unik untuk item manual (agar tidak bentrok dengan produkData)

    // Informasi default untuk struk (tidak bisa diedit via UI)
    const defaultShopName = "HARINFOOD";
    const defaultPhoneNumber = "6281235368643"; // <--- Nomor WhatsApp tujuan telah diubah di sini ke format Indonesia yang benar!
    const defaultFooterText = "Terima Kasih Atas Kunjungannya!";

    // Fungsi utilitas untuk memformat angka menjadi Rupiah
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0 
        }).format(number);
    };

    // Fungsi untuk menampilkan produk di halaman katalog
    function displayProduk() {
        produkList.innerHTML = ''; 
        produkData.forEach(produk => {
            const produkDiv = document.createElement('div');
            produkDiv.classList.add('produk-item');
            produkDiv.innerHTML = `
                <img src="${produk.gambar}" alt="${produk.nama}">
                <h3>${produk.nama}</h3>
                <p>Harga: ${formatRupiah(produk.harga)}</p>
                <div class="produk-controls" id="controls-${produk.id}">
                    <button class="add-to-cart-btn" data-id="${produk.id}"><i class="fas fa-plus"></i></button>
                </div>
            `;
            produkList.appendChild(produkDiv);
        });

        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const produkId = parseInt(e.currentTarget.dataset.id); 
                tambahKeKeranjang(produkId);
            });
        });
        updateProdukControls(); // Panggil ini untuk menampilkan Qty di awal jika ada di keranjang
    }

    // Fungsi untuk menambahkan produk ke keranjang belanja
    function tambahKeKeranjang(produkObj) { 
        let productToAdd = produkObj;
        if (typeof produkObj === 'number') { 
            productToAdd = produkData.find(p => p.id === produkObj);
            if (!productToAdd) return; 
            productToAdd = { ...productToAdd, qty: 1 }; 
        } else if (!productToAdd.qty) { 
            productToAdd.qty = 1; 
        }

        const existingItem = keranjang.find(item => item.id === productToAdd.id && item.nama === productToAdd.nama); 
        if (existingItem) {
            existingItem.qty += productToAdd.qty; 
        } else {
            if (productToAdd.id >= 1000 && !productToAdd.isManual) { 
                productToAdd.isManual = true; 
            }
            keranjang.push(productToAdd); 
        }
        updateKeranjang(); 
        updateProdukControls(); // Panggil ini setelah keranjang diupdate
    }

    // Fungsi untuk memperbarui tampilan keranjang belanja dan total harga
    function updateKeranjang() {
        let total = 0;
        const currentDisplayedIds = new Set(); 

        keranjang.forEach((item, index) => {
            // Gunakan ID unik untuk elemen keranjang di DOM
            const itemIdInDom = `cart-item-${item.id}-${item.nama.replace(/\s/g, '-')}-${index}`; // Unik per item + index

            let itemDiv = document.getElementById(itemIdInDom);

            if (itemDiv) {
                // Item sudah ada, hanya perbarui kuantitas dan subtotal
                itemDiv.querySelector('input[type="number"]').value = item.qty;
                itemDiv.querySelector('span:last-of-type').textContent = formatRupiah(item.harga * item.qty);
            } else {
                // Item belum ada, buat elemen baru
                itemDiv = document.createElement('div');
                itemDiv.id = itemIdInDom; // Beri ID unik
                itemDiv.innerHTML = `
                    <span>${item.nama}</span>
                    <input type="number" value="${item.qty}" min="1" onchange="updateCartItemQty(${index}, this.value)">
                    <span>${formatRupiah(item.harga * item.qty)}</span>
                    <button onclick="removeFromCart(${index})" style="background-color: #e74c3c; color: white; border: none; padding: 5px 8px; border-radius: 4px; cursor: pointer;">Hapus</button>
                `;
                keranjangItems.appendChild(itemDiv);
            }
            currentDisplayedIds.add(itemIdInDom);
            total += item.harga * item.qty;
        });

        // Hapus item dari DOM yang tidak ada lagi di array keranjang
        Array.from(keranjangItems.children).forEach(child => {
            if (!currentDisplayedIds.has(child.id)) {
                child.remove();
            }
        });
        
        // Jika keranjang kosong, pastikan tidak ada item yang tersisa di DOM
        if (keranjang.length === 0) {
            keranjangItems.innerHTML = ''; 
        }

        keranjangTotal.textContent = formatRupiah(total); 
    }

    // Fungsi untuk memperbarui kontrol produk di kartu menu
    // Ini adalah kunci untuk mengubah tombol '+' menjadi '- QTY +'
    function updateProdukControls() {
        produkData.forEach(produk => {
            const controlsDiv = document.getElementById(`controls-${produk.id}`);
            if (!controlsDiv) return; // Pastikan elemen kontrol ada

            const itemInCart = keranjang.find(item => item.id === produk.id);

            if (itemInCart) {
                // Jika produk ada di keranjang, tampilkan kontrol kuantitas
                controlsDiv.innerHTML = `
                    <button class="qty-control-btn minus-btn" data-id="${produk.id}" data-action="minus"><i class="fas fa-minus"></i></button>
                    <span class="product-qty-display">${itemInCart.qty}</span>
                    <button class="qty-control-btn plus-btn" data-id="${produk.id}" data-action="plus"><i class="fas fa-plus"></i></button>
                `;
            } else {
                // Jika produk tidak ada di keranjang, tampilkan tombol tambah keranjang
                controlsDiv.innerHTML = `
                    <button class="add-to-cart-btn" data-id="${produk.id}"><i class="fas fa-plus"></i></button>
                `;
            }
        });

        // Re-attach event listeners for the dynamically created buttons
        document.querySelectorAll('.add-to-cart-btn').forEach(button => {
            button.removeEventListener('click', handleAddButtonClick); // Hapus event lama jika ada
            button.addEventListener('click', handleAddButtonClick);
        });

        document.querySelectorAll('.qty-control-btn').forEach(button => {
            button.removeEventListener('click', handleQtyControlButtonClick); // Hapus event lama jika ada
            button.addEventListener('click', handleQtyControlButtonClick);
        });
    }

    // Handler untuk tombol tambah keranjang (ikon + awal)
    function handleAddButtonClick(e) {
        const produkId = parseInt(e.currentTarget.dataset.id);
        tambahKeKeranjang(produkId); // Tambahkan 1 ke keranjang
    }

    // Handler untuk tombol plus/minus kuantitas di kartu produk
    function handleQtyControlButtonClick(e) {
        const produkId = parseInt(e.currentTarget.dataset.id);
        const action = e.currentTarget.dataset.action;
        const itemInCart = keranjang.find(item => item.id === produkId);

        if (itemInCart) {
            if (action === 'plus') {
                itemInCart.qty++;
            } else if (action === 'minus') {
                itemInCart.qty--;
                if (itemInCart.qty <= 0) {
                    // Hapus dari keranjang jika kuantitas nol atau kurang
                    const indexToRemove = keranjang.indexOf(itemInCart);
                    if (indexToRemove > -1) {
                        keranjang.splice(indexToRemove, 1);
                    }
                }
            }
            updateKeranjang(); // Perbarui keranjang utama
            updateProdukControls(); // Perbarui tampilan kontrol di kartu produk
        }
    }


    // Fungsi untuk mengubah kuantitas item di keranjang langsung dari input
    window.updateCartItemQty = function(index, newQty) {
        let quantity = parseInt(newQty);
        if (isNaN(quantity) || quantity < 1) { // Jika kuantitas kurang dari 1, hapus item dari keranjang
            quantity = 0; // Set ke 0 agar logic di bawah menghapus
        }
        
        if (quantity === 0) {
            keranjang.splice(index, 1);
        } else {
            keranjang[index].qty = quantity;
        }
        updateKeranjang();
        updateProdukControls(); // Penting: Perbarui tampilan kontrol di kartu produk
    };

    // Fungsi untuk menghapus item dari keranjang
    window.removeFromCart = function(index) {
        keranjang.splice(index, 1);
        updateKeranjang();
        updateProdukControls(); // Penting: Perbarui tampilan kontrol di kartu produk
    };


    // Event listener untuk tombol "Bersihkan Keranjang"
    clearKeranjangBtn.addEventListener('click', () => {
        keranjang = []; 
        updateKeranjang(); 
        updateProdukControls(); // Perbarui juga kontrol produk di kartu menu
    });

    // Event listener untuk tombol "Cetak Pesanan"
    cetakPesananBtn.addEventListener('click', () => {
        const namaPemesan = namaPemesanInput.value.trim();
        const alamatPemesan = alamatPemesanInput.value.trim(); 
        const keteranganPesanan = keteranganPesananInput.value.trim(); 

        if (!namaPemesan || !alamatPemesan) {
            alert('Mohon masukkan nama pemesan dan alamat lengkap.');
            return;
        }

        if (keranjang.length === 0) {
            alert('Keranjang belanja masih kosong!');
            return;
        }

        const opsiMakan = document.querySelector('input[name="opsi-makan"]:checked').value;
        const tanggalWaktu = new Date();
        const formattedDate = tanggalWaktu.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedTime = tanggalWaktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const printWindow = window.open('', '_blank');
        printWindow.document.write('<html><head><title>Struk Belanja</title>');
        printWindow.document.write('<link rel="stylesheet" href="style.css">'); 
        printWindow.document.write('</head><body>');
        printWindow.document.write('<div id="print-area">'); 

        printWindow.document.write('<div class="print-header">');
        printWindow.document.write(`<h2>${defaultShopName}</h2>`);
        printWindow.document.write(`<p>Telp: ${defaultPhoneNumber}</p>`);
        printWindow.document.write('</div>');

        printWindow.document.write('<div class="print-info">');
        printWindow.document.write(`<p>Pelanggan: ${namaPemesan}</p>`);
        printWindow.document.write(`<p>Alamat: ${alamatPemesan}</p>`);
        printWindow.document.write(`<p>Opsi: ${opsiMakan}</p>`);
        printWindow.document.write(`<p>Tanggal: ${formattedDate}</p>`);
        printWindow.document.write(`<p>Jam: ${formattedTime}</p>`);
        printWindow.document.write('</div>');

        if (keteranganPesanan) {
            printWindow.document.write('<div class="print-notes">');
            printWindow.document.write(`<p>Catatan: ${keteranganPesanan}</p>`);
            printWindow.document.write('</div>');
        }

        printWindow.document.write('<hr>'); 

        printWindow.document.write('<table><tbody>');
        keranjang.forEach(item => {
            printWindow.document.write(`<tr><td>${item.nama} (${item.qty}x)</td><td style="text-align:right;">${formatRupiah(item.harga)}</td></tr>`);
        });
        printWindow.document.write('</tbody></table>');

        printWindow.document.write('<hr>'); 

        printWindow.document.write('<p class="total-row"><span>TOTAL:</span> ' + keranjangTotal.textContent + '</p>');

        printWindow.document.write(`<p class="thank-you">${defaultFooterText}</p>`);
        printWindow.document.write('</div></body></html>');
        
        printWindow.document.close(); 
        printWindow.focus(); 
        
        setTimeout(() => {
            printWindow.print();
        }, 500); 

        keranjang = [];
        updateKeranjang();
        updateProdukControls(); // Penting: Perbarui juga kontrol produk setelah reset keranjang
        namaPemesanInput.value = '';
        alamatPemesanInput.value = '';
        keteranganPesananInput.value = ''; 
        document.getElementById('makan-disini').checked = true; // Reset opsi
    });

    pesanWhatsappBtn.addEventListener('click', () => {
        const namaPemesan = namaPemesanInput.value.trim();
        const alamatPemesan = alamatPemesanInput.value.trim(); 
        const keteranganPesanan = keteranganPesananInput.value.trim(); 

        if (!namaPemesan || !alamatPemesan) {
            alert('Mohon masukkan nama pemesan dan alamat lengkap untuk pesanan WhatsApp.');
            return;
        }

        if (keranjang.length === 0) {
            alert('Keranjang belanja masih kosong, tidak bisa pesan via WhatsApp!');
            return;
        }

        const opsiMakan = document.querySelector('input[name="opsi-makan"]:checked').value;
        const tanggalWaktu = new Date();
        const formattedDate = tanggalWaktu.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedTime = tanggalWaktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let whatsappMessage = `*${defaultShopName}*\n`;
        whatsappMessage += `Telp: ${defaultPhoneNumber}\n`;
        whatsappMessage += "-----------------------------\n";
        whatsappMessage += `Pelanggan: ${namaPemesan}\n`;
        whatsappMessage += `Alamat: ${alamatPemesan}\n`;
        whatsappMessage += `Opsi: ${opsiMakan}\n`;
        whatsappMessage += `Tanggal: ${formattedDate}\n`;
        whatsappMessage += `Jam: ${formattedTime}\n`;
        whatsappMessage += "-----------------------------\n";
        whatsappMessage += "*Detail Pesanan:*\n";

        keranjang.forEach(item => {
            whatsappMessage += `- ${item.nama} (${item.qty}x) ${formatRupiah(item.harga)}\n`;
        });

        whatsappMessage += "-----------------------------\n";
        whatsappMessage += `*Total: ${keranjangTotal.textContent}*\n\n`;
        
        if (keteranganPesanan) {
            whatsappMessage += `*Catatan:*\n${keteranganPesanan}\n\n`;
        }

        whatsappMessage += defaultFooterText;

        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappURL = `https://wa.me/${defaultPhoneNumber}?text=${encodedMessage}`; 

        window.open(whatsappURL, '_blank'); 

        alert('Struk telah disiapkan di WhatsApp. Silakan pilih kontak dan kirim!');
    });

    addManualOrderFab.addEventListener('click', () => {
        manualOrderModal.style.display = 'flex'; // Tampilkan modal manual
        manualProductNameInput.value = ''; // Reset input
        manualProductPriceInput.value = '';
        manualProductQtyInput.value = '1';
    });

    window.closeManualOrderModal = function() {
        manualOrderModal.style.display = 'none';
    };

    window.addManualOrderItem = function() {
        const name = manualProductNameInput.value.trim();
        const price = parseFloat(manualProductPriceInput.value);
        const qty = parseInt(manualProductQtyInput.value);

        if (!name || isNaN(price) || price <= 0 || isNaN(qty) || qty <= 0) {
            alert('Mohon lengkapi semua bidang dengan nilai yang valid (harga & kuantitas harus positif).');
            return;
        }

        const manualProduct = {
            id: nextManualItemId++, // Memberikan ID unik agar tidak bentrok dengan produkData
            nama: name,
            harga: price,
            qty: qty,
            // Tidak ada gambar untuk produk manual di sini
        };

        tambahKeKeranjang(manualProduct); // Tambahkan ke keranjang
        closeManualOrderModal(); // Tutup modal
    };


    // Inisialisasi aplikasi saat DOM selesai dimuat
    displayProduk();
    updateKeranjang();
    manualOrderModal.style.display = 'none'; // Pastikan modal tersembunyi saat halaman dimuat
});
