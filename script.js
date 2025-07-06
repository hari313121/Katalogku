document.addEventListener('DOMContentLoaded', () => {
    // --- MODAL NAMA PEMESAN ---
    function getNamaPemesan() {
        return localStorage.getItem('namaPemesan') || '';
    }

    function tampilkanModalNamaPemesan() {
        document.getElementById('namaPemesanModal').style.display = 'flex';
        document.getElementById('inputNamaPemesan').focus();
    }

    function sembunyikanModalNamaPemesan() {
        document.getElementById('namaPemesanModal').style.display = 'none';
    }

    function autofillNamaPemesanForm() {
        const nama = getNamaPemesan();
        const namaPemesanInput = document.getElementById('nama-pemesan');
        if (namaPemesanInput) {
            namaPemesanInput.value = nama;
        }
    }

    if (!localStorage.getItem('namaPemesan')) {
        tampilkanModalNamaPemesan();
    } else {
        autofillNamaPemesanForm();
    }

    document.getElementById('btnSimpanNamaPemesan').onclick = function() {
        var nama = document.getElementById('inputNamaPemesan').value.trim();
        if (nama.length < 2) {
            alert('Nama pemesan wajib diisi!');
            return;
        }
        localStorage.setItem('namaPemesan', nama);
        sembunyikanModalNamaPemesan();
        autofillNamaPemesanForm();
    };

    // --- DATA PRODUK ---
    const produkData = [
        // PENTING: Anda harus mengganti nilai barcode dengan barcode aktual produk Anda.
        // Barcode ini adalah contoh format EAN-13.
        { id: 1, nama: "Risol", harga: 3000, gambar: "risol.webp", barcode: "risol" },
        { id: 2, nama: "Cibay", harga: 2500, gambar: "cibay.webp", barcode: "8997000000027" },
        { id: 3, nama: "Citung", harga: 2500, gambar: "citung.webp", barcode: "8997000000034" },
        { id: 4, nama: "Topokki", harga: 5000, gambar: "toppoki.webp", barcode: "8997000000041" },
        { id: 5, nama: "Tteokbokki Besar", harga: 10000, gambar: "toppoki.webp", barcode: "8997000000058" },
        { id: 6, nama: "Spaghetti", harga: 6000, gambar: "spaghetti.webp", barcode: "8997000000065" },
        { id: 7, nama: "Spaghetti Besar", harga: 10000, gambar: "spaghetti.webp", barcode: "8997000000072" },
        { id: 8, nama: "Balungan", harga: 5000, gambar: "balungan.webp", barcode: "8997000000089" },
        { id: 9, nama: "Es Teh Jumbo", harga: 3000, gambar: "esteh.webp", barcode: "8997000000096" },
        { id: 10, nama: "Es Teh kecil", harga: 2000, gambar: "esteh.webp", barcode: "8997000000102" }
    ];

    // --- REFERENSI DOM ---
    const produkList = document.getElementById('produk-list');
    const keranjangItems = document.getElementById('keranjang-items');
    const keranjangTotal = document.getElementById('keranjang-total');
    const printOrderFab = document.getElementById('print-order-fab');
    const addManualOrderFab = document.getElementById('add-manual-order-fab');
    const clearCartFab = document.getElementById('clear-cart-fab');
    // NEW: Barcode scanner FAB
    const scanBarcodeFab = document.getElementById('scan-barcode-fab');
    const pesanWhatsappBtn = document.getElementById('pesan-whatsapp');
    const namaPemesanInput = document.getElementById('nama-pemesan');
    const alamatPemesanInput = document.getElementById('alamat-pemesan');
    const keteranganPesananInput = document.getElementById('keterangan-pesanan');
    const nominalPembayaranInput = document.getElementById('nominal-pembayaran');
    const kembalianDisplay = document.getElementById('kembalian-display');
    const manualOrderModal = document.getElementById('manualOrderModal');
    const manualProductNameInput = document.getElementById('manualProductName');
    const manualProductPriceInput = document.getElementById('manualProductPrice');
    const manualProductQtyInput = document.getElementById('manualProductQty');
    // NEW: Barcode scanner modal and elements
    const barcodeScannerModal = document.getElementById('barcodeScannerModal');
    const scanFeedback = document.getElementById('scan-feedback');
    const stopScannerButton = document.getElementById('stop-scanner-button');

    let keranjang = [];
    let nextManualItemId = 1000;
    let isNominalInputFocused = false;
    let scannerActive = false; // State for scanner

    // --- SETTING STRUK/WHATSAPP ---
    const defaultShopName = "HARINFOOD";
    const defaultPhoneNumber = "6281235368643";
    const defaultFooterText = "Terima Terima Kasih!";

    // --- UTILITAS FORMAT RUPIAH ---
    const formatRupiah = (number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(number);
    };

    // --- RENDER PRODUK + KONTROL QTY ---
    function displayProduk() {
        produkList.innerHTML = '';
        produkData.forEach(produk => {
            // Cek item di keranjang berdasarkan ID produk dan pastikan bukan item manual
            let itemInCart = keranjang.find(item => item.id === produk.id && !item.isManual);
            let qty = itemInCart ? itemInCart.qty : 0;
            const produkDiv = document.createElement('div');
            produkDiv.classList.add('produk-item');
            produkDiv.innerHTML = `
                <img src="${produk.gambar}" alt="${produk.nama}">
                <h3>${produk.nama}</h3>
                <p>Harga: ${formatRupiah(produk.harga)}</p>
                <div class="produk-controls" id="controls-${produk.id}">
                    ${
                        qty < 1 ? `
                        <button class="add-to-cart-btn qty-btn" data-id="${produk.id}" title="Tambah ke keranjang"><i class="fas fa-plus"></i></button>
                        ` : `
                        <button class="qty-control-btn qty-btn minus-btn" data-id="${produk.id}" data-action="minus" title="Kurangi qty">-</button>
                        <span class="qty-value">${qty}</span>
                        <button class="qty-control-btn qty-btn plus-btn" data-id="${produk.id}" data-action="plus" title="Tambah qty">+</button>
                        `
                    }
                </div>
            `;
            produkList.appendChild(produkDiv);
        });
    }

    function updateProdukControls() {
        displayProduk();
    }

    // --- EVENT QTY CONTROL DI MENU (DELEGASI) ---
    produkList.addEventListener('click', function(e) {
        const btn = e.target.closest('button');
        if (!btn) return;
        const produkId = parseInt(btn.dataset.id);

        if (btn.classList.contains('add-to-cart-btn')) {
            const product = produkData.find(p => p.id === produkId);
            if (product) {
                tambahKeKeranjang(product);
            }
            return;
        }
        if (btn.classList.contains('plus-btn')) {
            const itemInCart = keranjang.find(item => item.id === produkId && !item.isManual);
            if (itemInCart) {
                itemInCart.qty++;
                updateKeranjang();
                updateProdukControls();
            }
            return;
        }
        if (btn.classList.contains('minus-btn')) {
            const itemInCart = keranjang.find(item => item.id === produkId && !item.isManual);
            if (itemInCart) {
                itemInCart.qty--;
                if (itemInCart.qty <= 0) {
                    keranjang = keranjang.filter(item => !(item.id === produkId && !item.isManual));
                }
                updateKeranjang();
                updateProdukControls();
            }
            return;
        }
    });

    // --- TAMBAH KE KERANJANG (PERBAIKAN LOGIKA DUPLIKASI) ---
    function tambahKeKeranjang(produkSumber) {
        let productToAdd;

        // Tentukan apakah produk berasal dari produkData (berdasarkan ID atau barcode)
        // atau produk manual (berdasarkan isManual)
        if (produkSumber.isManual) {
            productToAdd = { ...produkSumber }; // Ini adalah produk manual baru
        } else {
            // Ini produk dari daftar produkData atau hasil scan
            // Cari item yang sudah ada di keranjang berdasarkan ID atau barcode (jika ada)
            // Penting: Pastikan id produk manual tidak bentrok dengan id produk regular
            const existingItem = keranjang.find(item => {
                // Cek jika produk reguler (bukan manual) dengan ID yang sama
                if (!item.isManual && item.id === produkSumber.id) {
                    return true;
                }
                // Cek jika produk yang akan ditambahkan memiliki barcode dan item yang ada juga memiliki barcode yang sama
                if (produkSumber.barcode && item.barcode && item.barcode === produkSumber.barcode) {
                    return true;
                }
                return false;
            });

            if (existingItem) {
                existingItem.qty += (produkSumber.qty || 1);
                updateKeranjang();
                updateProdukControls();
                return; // Berhenti di sini karena qty sudah ditambahkan
            } else {
                productToAdd = { ...produkSumber };
                // Pastikan qty default 1 jika tidak disediakan
                productToAdd.qty = produkSumber.qty || 1;
            }
        }

        // Jika tidak ada item yang cocok atau ini adalah produk manual baru
        if (productToAdd.isManual && !productToAdd.hasOwnProperty('id')) {
            productToAdd.id = nextManualItemId++; // Berikan ID unik untuk produk manual
        } else if (!productToAdd.hasOwnProperty('id') && !productToAdd.barcode) {
            // Ini kasus fallback jika tidak ada ID atau barcode (misal: penambahan produk tanpa ID/barcode dari sumber lain)
            // Kita bisa tetapkan sebagai manual juga atau berikan ID unik sementara
            productToAdd.id = nextManualItemId++;
            productToAdd.isManual = true; // Menganggapnya sebagai manual jika tidak ada ID/barcode
        }
        
        keranjang.push(productToAdd);
        updateKeranjang();
        updateProdukControls(); // Ini akan merefresh tampilan produk di katalog
    }


    // --- RENDER KERANJANG BELANJA ---
    function updateKeranjang() {
        let total = 0;
        keranjangItems.innerHTML = '';
        if (keranjang.length === 0) {
            keranjangItems.innerHTML = '<tr><td colspan="4" class="empty-cart-message">Keranjang kosong.</td></tr>';
        } else {
            keranjang.forEach((item, index) => {
                const subtotal = item.harga * item.qty;
                total += subtotal;
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${item.nama}</td>
                    <td><input type="number" value="${item.qty}" min="1" onchange="updateCartItemQty(${index}, this.value)"></td>
                    <td>${formatRupiah(item.harga)}</td>
                    <td><button onclick="removeFromCart(${index})" class="btn-remove-item"><i class="fas fa-trash-alt"></i></button></td>
                `;
                keranjangItems.appendChild(row);
            });
        }
        keranjangTotal.textContent = formatRupiah(total);
        const totalBelanjaNumeric = total; // Gunakan total langsung
        if (!isNominalInputFocused) {
            const currentNominalValueNumeric = parseFloat(nominalPembayaranInput.value) || 0;
            const isCurrentlyEmptyOrZero = nominalPembayaranInput.value === '' || currentNominalValueNumeric === 0;
            if (isCurrentlyEmptyOrZero || nominalPembayaranInput.dataset.autofilled === 'true') {
                nominalPembayaranInput.value = totalBelanjaNumeric;
                if (totalBelanjaNumeric > 0) {
                    nominalPembayaranInput.dataset.autofilled = 'true';
                } else {
                    delete nominalPembayaranInput.dataset.autofilled;
                }
            }
        }
        hitungKembalian();
    }

    window.updateCartItemQty = function(index, newQty) {
        let quantity = parseInt(newQty);
        if (isNaN(quantity) || quantity < 1) {
            quantity = 0;
        }
        if (quantity === 0) {
            keranjang.splice(index, 1);
        } else {
            keranjang[index].qty = quantity;
        }
        updateKeranjang();
        updateProdukControls();
    };

    window.removeFromCart = function(index) {
        keranjang.splice(index, 1);
        updateKeranjang();
        updateProdukControls();
    };

    // --- FAB CLEAR KERANJANG (MERAH) ---
    clearCartFab.addEventListener('click', () => {
        keranjang = [];
        updateKeranjang();
        updateProdukControls();
        nominalPembayaranInput.value = 0;
        delete nominalPembayaranInput.dataset.autofilled;
        hitungKembalian();
    });

    // --- HITUNG KEMBALIAN ---
    function hitungKembalian() {
        const totalBelanja = parseFloat(keranjangTotal.textContent.replace('Rp', '').replace(/\./g, '').replace(',', '.')) || 0;
        const nominalPembayaran = parseFloat(nominalPembayaranInput.value) || 0;
        const kembalian = nominalPembayaran - totalBelanja;
        kembalianDisplay.textContent = formatRupiah(kembalian);
    }
    nominalPembayaranInput.addEventListener('input', hitungKembalian);

    nominalPembayaranInput.addEventListener('focus', () => {
        isNominalInputFocused = true;
        if (nominalPembayaranInput.dataset.autofilled === 'true' || parseFloat(nominalPembayaranInput.value) === 0) {
            nominalPembayaranInput.value = '';
            delete nominalPembayaranInput.dataset.autofilled;
        }
    });
    nominalPembayaranInput.addEventListener('blur', () => {
        isNominalInputFocused = false;
        const totalBelanjaNumeric = parseFloat(keranjangTotal.textContent.replace('Rp', '').replace(/\./g, '').replace(',', '.')) || 0;
        if (nominalPembayaranInput.value === '' && totalBelanjaNumeric > 0) {
            nominalPembayaranInput.value = totalBelanjaNumeric;
            nominalPembayaranInput.dataset.autofilled = 'true';
            hitungKembalian();
        } else if (nominalPembayaranInput.value === '' && totalBelanjaNumeric === 0) {
            nominalPembayaranInput.value = 0;
            delete nominalPembayaranInput.dataset.autofilled;
            hitungKembalian();
        }
    });

    // --- CETAK STRUK ---
    printOrderFab.addEventListener('click', () => {
        const namaPemesan = namaPemesanInput.value.trim();
        const alamatPemesan = alamatPemesanInput.value.trim();
        const keteranganPesanan = keteranganPesananInput.value.trim();

        const totalBelanja = parseFloat(keranjangTotal.textContent.replace('Rp', '').replace(/\./g, '').replace(',', '.')) || 0;
        const nominalPembayaran = parseFloat(nominalPembayaranInput.value) || 0;
        const kembalian = nominalPembayaran - totalBelanja;

        if (keranjang.length === 0) {
            alert('Keranjang belanja masih kosong!');
            return;
        }
        if (nominalPembayaran < totalBelanja) {
            alert('Nominal pembayaran kurang dari total belanja.');
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
        printWindow.document.write(`<p>Pelanggan: ${namaPemesan || '-'}</p>`);
        printWindow.document.write(`<p>Alamat: ${alamatPemesan || '-'}</p>`);
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
        printWindow.document.write('<p class="print-payment-info"><span>BAYAR:</span> ' + formatRupiah(nominalPembayaran) + '</p>');
        printWindow.document.write('<p class="print-payment-info"><span>KEMBALIAN:</span> ' + formatRupiah(kembalian) + '</p>');
        printWindow.document.write('<div style="text-align: center; margin-top: 10px; margin-bottom: 5px;">');
        printWindow.document.write('<img src="qris.webp" alt="QRIS Code" style="width: 45mm; height: auto; display: block; margin: 0 auto;">');
        printWindow.document.write('</div>');
        printWindow.document.write(`<p class="thank-you">${defaultFooterText} - Scan QRIS Untuk Pembayaran</p>`);
        printWindow.document.write('</div></body></html>');
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => {
            printWindow.print();
        }, 500);
        keranjang = [];
        updateKeranjang();
        updateProdukControls();
        namaPemesanInput.value = '';
        alamatPemesanInput.value = '';
        keteranganPesananInput.value = '';
        nominalPembayaranInput.value = 0;
        document.getElementById('dibawa-pulang').checked = true;
        hitungKembalian();
    });

    // --- PESAN WHATSAPP ---
    pesanWhatsappBtn.addEventListener('click', () => {
        const namaPemesan = namaPemesanInput.value.trim();
        const alamatPemesan = alamatPemesanInput.value.trim();
        const keteranganPesanan = keteranganPesananInput.value.trim();

        const totalBelanja = parseFloat(keranjangTotal.textContent.replace('Rp', '').replace(/\./g, '').replace(',', '.')) || 0;
        const nominalPembayaran = parseFloat(nominalPembayaranInput.value) || 0;
        const kembalian = nominalPembayaran - totalBelanja;

        if (keranjang.length === 0) {
            alert('Keranjang belanja masih kosong, tidak bisa pesan via WhatsApp!');
            return;
        }
        if (nominalPembayaran < totalBelanja) {
            alert('Nominal pembayaran kurang dari total belanja.');
            return;
        }

        const opsiMakan = document.querySelector('input[name="opsi-makan"]:checked').value;
        const tanggalWaktu = new Date();
        const formattedDate = tanggalWaktu.toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' });
        const formattedTime = tanggalWaktu.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        let whatsappMessage = `*${defaultShopName}*\n`;
        whatsappMessage += `Telp: ${defaultPhoneNumber}\n`;
        whatsappMessage += "-----------------------------\n";
        whatsappMessage += `Pelanggan: ${namaPemesan || '-'}\n`;
        whatsappMessage += `Alamat: ${alamatPemesan || '-'}\n`;
        whatsappMessage += `Tanggal: ${formattedDate}\n`;
        whatsappMessage += `Jam: ${formattedTime}\n`;
        whatsappMessage += "-----------------------------\n";
        whatsappMessage += "*Detail Pesanan:*\n";
        keranjang.forEach(item => {
            whatsappMessage += `- ${item.nama} (${item.qty}x) ${formatRupiah(item.harga)}\n`;
        });
        whatsappMessage += "-----------------------------\n";
        whatsappMessage += `*Total: ${keranjangTotal.textContent}*\n`;
        whatsappMessage += `*Bayar: ${formatRupiah(nominalPembayaran)}*\n`;
        whatsappMessage += `*Kembalian: ${formatRupiah(kembalian)}*\n\n`;
        if (keteranganPesanan) {
            whatsappMessage += `*Catatan:*\n${keteranganPesanan}\n\n`;
        }
        whatsappMessage += defaultFooterText;
        const encodedMessage = encodeURIComponent(whatsappMessage);
        const whatsappURL = `https://wa.me/${defaultPhoneNumber}?text=${encodedMessage}`;
        window.open(whatsappURL, '_blank');
        alert('Struk telah disiapkan di WhatsApp. Silakan pilih kontak dan kirim!');
    });

    // --- MODAL & PESANAN MANUAL ---
    addManualOrderFab.addEventListener('click', () => {
        manualOrderModal.style.display = 'flex';
        manualProductNameInput.value = '';
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
            id: nextManualItemId++,
            nama: name,
            harga: price,
            qty: qty,
            isManual: true
        };
        tambahKeKeranjang(manualProduct);
        closeManualOrderModal();
    };

    // --- BARCODE SCANNER INTEGRATION ---
    // Event listener untuk FAB Scan Barcode
    scanBarcodeFab.addEventListener('click', () => {
        barcodeScannerModal.style.display = 'flex';
        scanFeedback.textContent = 'Mencari barcode...';
        stopScannerButton.style.display = 'block'; // Show stop button
        startScanner();
    });

    window.closeBarcodeScannerModal = function() {
        barcodeScannerModal.style.display = 'none';
        stopScanner();
    };

    stopScannerButton.addEventListener('click', () => {
        closeBarcodeScannerModal();
    });

    function startScanner() {
        if (scannerActive) return; // Prevent multiple instances
        scannerActive = true;
        scanFeedback.textContent = 'Mencari barcode...';

        Quagga.init({
            inputStream: {
                name: "Live",
                type: "LiveStream",
                target: document.querySelector('#interactive'), // Target div for the video stream
                constraints: {
                    facingMode: "environment" // Use rear camera on mobile
                },
            },
            decoder: {
                // Konfigurasi pembaca barcode. Anda bisa menyesuaikannya.
                // ean_reader dan ean_8_reader umum untuk produk retail.
                readers: ["ean_reader", "ean_8_reader", "upc_reader", "upc_e_reader", "code_128_reader", "code_39_reader"]
            }
        }, function(err) {
            if (err) {
                console.error(err);
                scanFeedback.textContent = 'Gagal memulai kamera. Pastikan browser memiliki izin.';
                scannerActive = false;
                return;
            }
            console.log("Initialization finished. Ready to start");
            Quagga.start();
        });

        Quagga.onDetected(function(result) {
            const barcode = result.codeResult.code;
            console.log("Barcode detected:", barcode);
            scanFeedback.textContent = `Barcode terdeteksi: ${barcode}`;

            // Cari produk di produkData berdasarkan barcode
            const foundProduct = produkData.find(p => p.barcode === barcode);

            if (foundProduct) {
                tambahKeKeranjang(foundProduct);
                scanFeedback.textContent = `Produk "${foundProduct.nama}" ditambahkan!`;
                // Secara opsional, hentikan scanning setelah berhasil scan
                // Anda bisa menghapus atau mengubah timeout ini jika ingin scan terus-menerus
                setTimeout(() => {
                    closeBarcodeScannerModal();
                }, 1000); // Tutup modal setelah 1 detik
            } else {
                scanFeedback.textContent = `Barcode ${barcode} tidak ditemukan di katalog. Coba lagi.`;
            }
        });

        Quagga.onProcessed(function(result) {
            var drawingCtx = Quagga.canvas.ctx.overlay,
                drawingCanvas = Quagga.canvas.dom.overlay;

            if (result) {
                if (result.boxes) {
                    drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute("width")), parseInt(drawingCanvas.getAttribute("height")));
                    result.boxes.filter(function (box) {
                        return box !== result.box;
                    }).forEach(function (box) {
                        Quagga.ImageDebug.drawPath(box, {x: 0, y: 1}, drawingCtx, {color: "green", lineWidth: 2});
                    });
                }

                if (result.box) {
                    Quagga.ImageDebug.drawPath(result.box, {x: 0, y: 1}, drawingCtx, {color: "#00F0FF", lineWidth: 2});
                }

                if (result.codeResult && result.codeResult.code) {
                    Quagga.ImageDebug.drawPath(result.line, {x: 'x', y: 'y'}, drawingCtx, {color: "red", lineWidth: 3});
                }
            }
        });
    }

    function stopScanner() {
        if (scannerActive) {
            Quagga.stop();
            scannerActive = false;
            console.log("Scanner stopped.");
            scanFeedback.textContent = '';
            stopScannerButton.style.display = 'none'; // Sembunyikan tombol stop
        }
    }

    // --- INISIALISASI APP ---
    displayProduk();
    updateKeranjang();
    hitungKembalian();
    manualOrderModal.style.display = 'none';
});

// Fungsi hidePilihanMakan:
function hidePilihanMakan() {
    const opsiIds = [
        { id: "dibawa-pulang", labelText: "Dibawa Pulang" },
        { id: "makan-disini", labelText: "Makan di Sini" }
    ];
    opsiIds.forEach(opsi => {
        const radio = document.getElementById(opsi.id);
        if (radio) radio.style.display = 'none';
        const label = document.querySelector(`label[for='${opsi.id}']`);
        if (label) label.style.display = 'none';
    });
}

// Jalankan saat halaman sudah siap
document.addEventListener('DOMContentLoaded', hidePilihanMakan);
