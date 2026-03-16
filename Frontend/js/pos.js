/**
 * POS.JS - Logic Bán Hàng & Xử Lý Sản Phẩm FamilyMart
 * Quy trình: Fetch API -> Render UI -> Modal Detail (Change Size) -> Add to Cart
 */

const POS_CONFIG = {
    // URL API từ ASP.NET kết nối Oracle
    PRODUCT_API: "https://localhost:5001/api/Product",
    ORDER_API: "https://localhost:5001/api/Order"
};

let allProducts = []; // Lưu trữ danh sách sản phẩm lấy từ DB
let currentSelectedProduct = null; // Sản phẩm đang xem trong Modal

// 1. HÀM LẤY DỮ LIỆU TỪ BACKEND (FRONTEND -> BACKEND -> ORACLE)
async function fetchProducts() {
    try {
        const response = await fetch(POS_CONFIG.PRODUCT_API);
        if (response.ok) {
            allProducts = await response.json();
            renderProductGrid(allProducts);
        } else {
            console.error("Lỗi lấy dữ liệu từ Oracle");
            // Mock dữ liệu giả nếu API chưa sẵn sàng để bạn test UI
            loadMockData(); 
        }
    } catch (error) {
        console.warn("Chưa kết nối được API Backend, đang dùng dữ liệu giả để test UI.");
        loadMockData();
    }
}

// 2. HIỂN THỊ DANH SÁCH SẢN PHẨM LÊN GIAO DIỆN
function renderProductGrid(products) {
    const grid = document.getElementById('productGrid');
    if (!grid) return;

    grid.innerHTML = products.map(p => `
        <div class="bg-white rounded-[2rem] p-5 shadow-lg border-2 border-transparent hover:border-[#00AB4E] transition-all group overflow-hidden">
            <div class="relative overflow-hidden rounded-2xl mb-4">
                <img src="${p.img}" class="w-full h-48 object-cover group-hover:scale-110 transition duration-500">
                <div class="absolute top-2 right-2 bg-white/90 px-3 py-1 rounded-full text-[10px] font-black text-[#0080C0] shadow-sm">
                    ID: ${p.id}
                </div>
            </div>
            <h4 class="font-black text-xl text-gray-800 mb-1 leading-tight h-14 overflow-hidden">${p.name}</h4>
            <p class="text-[#0080C0] font-black text-lg">${p.basePrice.toLocaleString()}đ</p>
            
            <button onclick="viewProductDetail('${p.id}')" 
                    class="mt-5 w-full py-4 bg-[#00AB4E] text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-green-100 hover:bg-green-600 transition active:scale-95">
                XEM CHI TIẾT
            </button>
        </div>
    `).join('');
}

// 3. LOGIC XEM CHI TIẾT & CHỌN SIZE (NHẢY GIÁ)
window.viewProductDetail = (productId) => {
    currentSelectedProduct = allProducts.find(p => p.id === productId);
    const content = document.getElementById('detailContent');
    
    // Tạo giao diện Modal
    content.innerHTML = `
        <div class="space-y-6">
            <img src="${currentSelectedProduct.img}" class="w-full h-64 object-cover rounded-3xl shadow-md">
            
            <div>
                <h2 class="text-3xl font-black text-[#0080C0]">${currentSelectedProduct.name}</h2>
                <p class="text-gray-400 text-sm mt-2 leading-relaxed">${currentSelectedProduct.desc || 'Sản phẩm tươi ngon mỗi ngày từ FamilyMart.'}</p>
            </div>

            <div class="bg-gray-50 p-4 rounded-2xl">
                <label class="block text-[10px] font-black uppercase text-gray-400 mb-4 tracking-[0.2em] text-center italic">Chọn kích cỡ (Size)</label>
                <div class="grid grid-cols-2 gap-3" id="sizeOptions">
                    ${Object.keys(currentSelectedProduct.sizes).map(sizeName => `
                        <button onclick="updatePriceLogic('${sizeName}')" 
                                id="size-${sizeName}"
                                class="size-btn p-4 border-2 bg-white rounded-2xl font-bold transition-all flex justify-between items-center border-gray-100 hover:border-[#0080C0]">
                            <span class="text-sm">${sizeName}</span>
                            <span class="text-[10px] text-[#00AB4E]">+${currentSelectedProduct.sizes[sizeName].toLocaleString()}đ</span>
                        </button>
                    `).join('')}
                </div>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-dashed">
                <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Giá tạm tính</p>
                    <h3 id="modalDisplayPrice" class="text-3xl font-black text-[#00AB4E]">${currentSelectedProduct.basePrice.toLocaleString()}đ</h3>
                </div>
                <button onclick="addToCartLogic()" class="bg-[#0080C0] text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:bg-blue-800 transition active:scale-95">
                    MUA NGAY
                </button>
            </div>
        </div>
    `;
    
    openModal('detailModal');
    // Mặc định chọn size đầu tiên
    const firstSize = Object.keys(currentSelectedProduct.sizes)[0];
    updatePriceLogic(firstSize);
};

// 4. HÀM CẬP NHẬT GIÁ KHI ĐỔI SIZE (NHƯ TRANG FAMILYMART.COM)
window.updatePriceLogic = (sizeName) => {
    const extraPrice = currentSelectedProduct.sizes[sizeName];
    const finalPrice = currentSelectedProduct.basePrice + extraPrice;
    
    // Hiệu ứng nhảy số tiền
    document.getElementById('modalDisplayPrice').innerText = finalPrice.toLocaleString() + "đ";
    
    // Cập nhật trạng thái nút (UI)
    document.querySelectorAll('.size-btn').forEach(btn => {
        btn.classList.remove('border-[#0080C0]', 'bg-blue-50', 'text-[#0080C0]');
        btn.classList.add('border-gray-100', 'bg-white');
    });
    
    const activeBtn = document.getElementById(`size-${sizeName}`);
    activeBtn.classList.remove('border-gray-100', 'bg-white');
    activeBtn.classList.add('border-[#0080C0]', 'bg-blue-50', 'text-[#0080C0]');
    
    // Lưu size đang chọn vào biến tạm của sản phẩm
    currentSelectedProduct.selectedSize = sizeName;
    currentSelectedProduct.currentPrice = finalPrice;
};

// 5. GỬI ĐƠN HÀNG VỀ BACKEND (ORACLE)
async function addToCartLogic() {
    const orderData = {
        productId: currentSelectedProduct.id,
        size: currentSelectedProduct.selectedSize,
        total: currentSelectedProduct.currentPrice,
        orderDate: new Date().toISOString(),
        staffEmail: sessionStorage.getItem('userEmail')
    };

    console.log("Đang gửi đơn hàng về Oracle:", orderData);
    
    // Giao diện thông báo
    alert(`Đã thêm vào giỏ: ${currentSelectedProduct.name} (${orderData.size}) - ${orderData.total.toLocaleString()}đ`);
    closeModal('detailModal');
}

// DỮ LIỆU GIẢ ĐỂ TEST KHI CHƯA CÓ BACKEND
function loadMockData() {
    allProducts = [
        { 
            id: "F01", name: "Lẩu Ly Oden", basePrice: 25000, 
            img: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500",
            sizes: { "S": 0, "M": 5000, "L": 10000 },
            desc: "Nước dùng Oden thanh ngọt chuẩn vị Nhật, ăn kèm các loại cá viên tươi ngon."
        },
        { 
            id: "D02", name: "Cà Phê Sữa Đá", basePrice: 18000, 
            img: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?w=500",
            sizes: { "Vừa": 0, "Lớn": 7000 },
            desc: "Hạt cà phê rang xay nguyên chất pha phin truyền thống."
        },
        { 
            id: "F03", name: "Cơm Trứng Quốc Gia", basePrice: 15000, 
            img: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500",
            sizes: { "Thường": 0, "Thêm trứng": 5000, "Thêm cơm": 3000 },
            desc: "Bữa cơm tiện lợi nhanh chóng, đầy đủ dinh dưỡng cho ngày mới."
        }
    ];
    renderProductGrid(allProducts);
}

// Khởi chạy khi tải trang
document.addEventListener('DOMContentLoaded', fetchProducts);