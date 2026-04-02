/**
 * POS.JS 3.0 - Cấu hình Full Call API & Database Oracle
 * Dự án: FamilyMart - HUFLIT
 */

// SỬA LẠI ĐOẠN ĐẦU FILE NHƯ SAU:
const API_CONFIG = {
    BASE_URL: "http://localhost:3000/api",
    STORE_ID: "B03BD3D9", // ID cửa hàng của bạn
    EMPLOYEE_ID: "NV001",
    HEADERS: {
        'Content-Type': 'application/json'
    }
};

let allProducts = []; // Lưu trữ gốc từ database
let cart = [];

/**
 * 1. KHỞI TẠO HỆ THỐNG
 */
async function initPOS() {
    console.log("Đang kết nối hệ thống FamilyMart...");
    // Hiển thị Store ID tạm thời lên giao diện
    const storeDisplay = document.getElementById('currentStoreName');
    if (storeDisplay) storeDisplay.innerText = `Store ID: ${API_CONFIG.STORE_ID.substring(0, 8)}...`;

    try {
        // Fetch song song Sản phẩm và Category (nếu có)
        const res = await fetch(`${API_CONFIG.BASE_URL}/product/get-all`, {
            headers: API_CONFIG.HEADERS
        });
        
        if (!res.ok) throw new Error("Database không phản hồi");
        
        allProducts = await res.json();
        renderProductGrid(allProducts);
        
        console.log("Đã tải " + allProducts.length + " sản phẩm.");
    } catch (error) {
        console.error("Lỗi khởi tạo:", error);
        document.getElementById('productGrid').innerHTML = `
            <div class="col-span-full text-center py-10 text-red-500">
                <i class="fa fa-exclamation-triangle text-3xl mb-2"></i>
                <p>Không thể kết nối Backend. Vui lòng kiểm tra Ngrok/Visual Studio.</p>
            </div>
        `;
    }
}

/**
 * 2. TÌM KIẾM & LỌC SẢN PHẨM
 */
window.handleSearch = (query) => {
    const q = query.toLowerCase().trim();
    const filtered = allProducts.filter(p => 
        p.productName.toLowerCase().includes(q) || 
        p.productId.toLowerCase().includes(q)
    );
    renderProductGrid(filtered);
};

window.filterCategory = (catName) => {
    const filtered = (catName === 'all') 
        ? allProducts 
        : allProducts.filter(p => p.categoryName === catName);
    renderProductGrid(filtered);
};

function renderProductGrid(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;
    
    if (products.length === 0) {
        grid.innerHTML = `<p class="col-span-full text-center text-gray-400 py-10 italic">Không tìm thấy sản phẩm nào...</p>`;
        return;
    }

    grid.innerHTML = products.map(p => `
        <div onclick="handleProductClick('${p.productId}')" 
             class="product-card bg-white p-4 rounded-3xl shadow-sm hover:shadow-xl transition-all cursor-pointer border border-gray-100 flex flex-col items-center text-center group animate-pop-in">
            <div class="w-24 h-24 bg-gray-50 rounded-2xl mb-3 flex items-center justify-center group-hover:rotate-3 transition-transform overflow-hidden">
                <img src="${p.imageUrl || '../Database/img/OIP.webp'}" 
                     class="w-full h-full object-cover" 
                     onerror="this.src='https://via.placeholder.com/150?text=FamilyMart'">
            </div>
            <h3 class="font-bold text-gray-700 text-xs mb-1 line-clamp-2 h-8">${p.productName}</h3>
            <p class="text-[#0080C0] font-black text-sm">${(p.price || 0).toLocaleString()}đ</p>
        </div>
    `).join('');
}

/**
 * 3. XỬ LÝ CHỌN SẢN PHẨM & SIZE
 */
window.handleProductClick = async (productId) => {
    // Theo yêu cầu: Call API lấy chi tiết giá/size trước khi thêm
    try {
        // Nếu API detail chưa có, ta tạm dùng dữ liệu từ allProducts
        const product = allProducts.find(p => p.productId === productId);
        if (!product) return;

        // Giả lập lấy size từ database (Nếu API trả về trường sizes)
        const sizeKeys = product.sizes ? Object.keys(product.sizes) : [];

        if (sizeKeys.length > 1) {
            renderSizeModal(product, sizeKeys);
        } else {
            const sizeName = sizeKeys.length === 1 ? sizeKeys[0] : "Vừa";
            const extra = sizeKeys.length === 1 ? product.sizes[sizeKeys[0]] : 0;
            addToCart(product, sizeName, extra);
        }
    } catch (e) {
        console.error("Lỗi khi chọn SP:", e);
    }
};

function renderSizeModal(product, sizeKeys) {
    const detailContent = document.getElementById('detailContent');
    detailContent.innerHTML = `
        <div class="text-center">
            <p class="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Chọn kích cỡ</p>
            <h2 class="text-2xl font-black text-[#0080C0] mb-6">${product.productName}</h2>
            <div class="grid grid-cols-1 gap-3">
                ${sizeKeys.map(size => `
                    <button onclick="selectSizeAndAdd('${product.productId}', '${size}', ${product.sizes[size]})" 
                            class="w-full py-4 rounded-2xl border-2 border-gray-100 hover:border-[#0080C0] hover:bg-blue-50 transition-all flex justify-between px-8 items-center group">
                        <span class="font-black text-lg text-gray-700 group-hover:text-[#0080C0]">Size ${size}</span>
                        <span class="font-bold text-gray-400 group-hover:text-[#0080C0]">+ ${product.sizes[size].toLocaleString()}đ</span>
                    </button>
                `).join('')}
            </div>
            <button onclick="closeModal('detailModal')" class="mt-8 text-gray-400 font-bold hover:text-red-500 transition-colors uppercase text-xs tracking-widest">Đóng</button>
        </div>
    `;
    openModal('detailModal');
}

window.selectSizeAndAdd = (productId, size, extraPrice) => {
    const product = allProducts.find(p => p.productId === productId);
    addToCart(product, size, extraPrice);
    closeModal('detailModal');
};

/**
 * 4. QUẢN LÝ GIỎ HÀNG
 */
function addToCart(product, size, extra) {
    const cartId = `${product.productId}-${size}`;
    const existing = cart.find(i => i.cartId === cartId);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            cartId: cartId,
            productId: product.productId,
            name: product.productName,
            size: size,
            price: (product.price || 0) + extra,
            quantity: 1
        });
    }
    renderCart();
}

function renderCart() {
    const body = document.getElementById('cartBody');
    if (!body) return;

    let grandTotal = 0;
    body.innerHTML = cart.map((item, index) => {
        const total = item.price * item.quantity;
        grandTotal += total;
        return `
            <tr class="text-[13px] border-b border-gray-50 hover:bg-gray-50/50 transition-colors animate-pop-in">
                <td class="py-4 font-bold text-gray-300 w-8">${index + 1}</td>
                <td class="py-4">
                    <div class="font-bold text-gray-700">${item.name}</div>
                    <div class="text-[9px] text-gray-400 uppercase font-black tracking-tighter">ID: ${item.productId}</div>
                </td>
                <td class="py-4 text-center">
                    <span class="bg-blue-50 text-[#0080C0] px-2 py-0.5 rounded-md text-[10px] font-black">${item.size}</span>
                </td>
                <td class="py-4 text-center">
                    <div class="flex items-center justify-center gap-3">
                        <button onclick="updateQty('${item.cartId}', -1)" class="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white hover:shadow-sm active:scale-90 transition-all">-</button>
                        <span class="font-bold w-4 text-sm">${item.quantity}</span>
                        <button onclick="updateQty('${item.cartId}', 1)" class="w-6 h-6 rounded-full border border-gray-200 flex items-center justify-center hover:bg-white hover:shadow-sm active:scale-90 transition-all">+</button>
                    </div>
                </td>
                <td class="py-4 text-[11px] font-bold text-gray-400">Cái</td>
                <td class="py-4 text-right font-bold text-gray-600">${item.price.toLocaleString()}</td>
                <td class="py-4 text-right font-black text-[#0080C0] pr-2">${total.toLocaleString()}</td>
            </tr>
        `;
    }).join('');

    const totalDisplay = document.getElementById('totalDisplay');
    if (totalDisplay) totalDisplay.innerText = grandTotal.toLocaleString();
}

window.updateQty = (id, delta) => {
    const item = cart.find(i => i.cartId === id);
    if (item) {
        item.quantity += delta;
        if (item.quantity <= 0) cart = cart.filter(i => i.cartId !== id);
    }
    renderCart();
};

/**
 * 5. XỬ LÝ THANH TOÁN (GỬI PAYLOAD LÊN ORACLE)
 */
window.processPayment = async () => {
    const btn = document.getElementById('btnThanhToan');
    const name = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('customerPhone').value.trim();
    const method = document.getElementById('paymentMethod')?.value || "TIỀN MẶT";

    if (cart.length === 0) return alert("Giỏ hàng đang trống!");
    if (!name || !phone) return alert("Vui lòng nhập Tên và SĐT khách hàng!");

    const totalAmount = cart.reduce((s, i) => s + (i.price * i.quantity), 0);

    // Cấu trúc Payload chuẩn như yêu cầu của bạn
    const payload = {
        storeId: API_CONFIG.STORE_ID,
        employeeId: API_CONFIG.EMPLOYEE_ID,
        products: cart.map(i => ({ 
            productId: i.productId, 
            quantity: i.quantity, 
            price: i.price 
        })),
        payments: [{ 
            paymentMethod: method, 
            amount: totalAmount, 
            extraInfo: `KH: ${name} | SĐT: ${phone}` 
        }]
    };

    try {
        btn.disabled = true;
        btn.innerHTML = `<i class="fa fa-spinner fa-spin"></i> Đang xử lý...`;

        const res = await fetch(`${API_CONFIG.BASE_URL}/order/process-sale`, {
            method: 'POST',
            headers: API_CONFIG.HEADERS,
            body: JSON.stringify(payload)
        });
        
        const data = await res.json();
        
        if (res.ok) {
            alert("THÀNH CÔNG: " + (data.message || "Hóa đơn đã được lưu!"));
            // Reset toàn bộ form
            cart = [];
            document.getElementById('customerName').value = "";
            document.getElementById('customerPhone').value = "";
            renderCart();
        } else {
            throw new Error(data.message || "Lỗi Server");
        }
    } catch (e) {
        alert("LỖI THANH TOÁN: " + e.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = `<i class="fa fa-check-circle"></i> Xác nhận thanh toán`;
    }
};

// Khởi chạy khi trang sẵn sàng
document.addEventListener('DOMContentLoaded', initPOS);