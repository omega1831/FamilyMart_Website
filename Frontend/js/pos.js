// ==========================================
// 1. MODEL - CHUYỂN ĐỔI DỮ LIỆU TỪ API
// ==========================================
class Product {
    constructor(data) {
        // Parse dữ liệu từ API 
        this.id = data.productid;
        this.name = data.productname;
        this.category = data.categoryName || "Khác";
        this.supplier = data.supplierName || "Family Mart";
     
    }

    // Hàm tạo mã HTML cho từng sản phẩm 
    renderCard() {
        return `
            <div onclick="addToCartById('${this.id}')" 
                 class="product-card bg-white p-4 rounded-2xl shadow-sm border border-transparent hover:border-[#0080C0] cursor-pointer transition-all flex flex-col items-center text-center">
                <div class="w-full aspect-square bg-gray-50 rounded-xl mb-3 flex items-center justify-center text-gray-400">
                    <i class="fa fa-shopping-basket text-3xl"></i>
                </div>
                <h3 class="font-bold text-gray-700 text-xs h-8 overflow-hidden mb-1">${this.name}</h3>
                <p class="text-[10px] text-gray-400 mb-1 uppercase">${this.category}</p>
                <p class="text-[#0080C0] font-black">${this.price.toLocaleString()}đ</p>
            </div>
        `;
    }
}

// ==========================================
// 2. STATE - QUẢN LÝ TRẠNG THÁI HỆ THỐNG
// ==========================================
const state = {
    allProducts: [], // Chứa các đối tượng Product (Model)
    cart: [],
    totalRemaining: 0,
    apiUrl: "https://unpatinated-unmelodized-monique.ngrok-free.dev/api/product/get-all"
};

// ==========================================
// 3. KHỞI TẠO & GỌI API
// ==========================================
window.onload = async () => {
    const storeName = localStorage.getItem('selectedStoreName') || "Chi nhánh Family Mart";
    document.getElementById('currentStoreName').textContent = storeName;
    await fetchProducts();
};

async function fetchProducts() {
    try {
        const response = await fetch(state.apiUrl, {
            headers: { 'ngrok-skip-browser-warning': 'true' }
        });
        if (!response.ok) throw new Error("API Connection Failed");

        const rawData = await response.json();

        // CHUYỂN DỮ LIỆU THÔ SANG MODEL (PARSE DATA)
        state.allProducts = rawData.map(item => new Product(item));

        renderCategoryButtons();
        renderProductGrid(state.allProducts);
    } catch (error) {
        console.error("Lỗi tải sản phẩm:", error);
        alert("Không thể kết nối API của nhóm trưởng!");
    }
}

// ==========================================
// 4. HIỂN THỊ GIAO DIỆN (UI RENDERING)
// ==========================================
function renderProductGrid(products) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = products.map(p => p.renderCard()).join('');
}

function renderCategoryButtons() {
    const container = document.getElementById('categoryContainer');
    const categories = ['Tất cả', ...new Set(state.allProducts.map(p => p.category))];
    
    container.innerHTML = categories.map(cat => `
        <button onclick="filterByCategory('${cat}', this)" 
                class="cat-btn ${cat === 'Tất cả' ? 'active' : ''} px-6 py-2.5 rounded-xl font-bold bg-white border transition-all">
            ${cat}
        </button>
    `).join('');
}

function filterByCategory(catName, btn) {
    document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const filtered = (catName === 'Tất cả') 
        ? state.allProducts 
        : state.allProducts.filter(p => p.category === catName);
    renderProductGrid(filtered);
}

// ==========================================
// 5. GIỎ HÀNG & THANH TOÁN (LOGIC)
// ==========================================
function addToCartById(id) {
    const product = state.allProducts.find(p => p.id === id);
    if (!product) return;

    const itemInCart = state.cart.find(item => item.id === id);
    if (itemInCart) {
        itemInCart.sl++;
    } else {
        state.cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            sl: 1
        });
    }
    updateCartUI();
}

function changeQty(id, delta) {
    const item = state.cart.find(i => i.id === id);
    if (item) {
        item.sl += delta;
        if (item.sl <= 0) state.cart = state.cart.filter(i => i.id !== id);
        updateCartUI();
    }
}

function updateCartUI() {
    const body = document.getElementById('cartBody');
    const empty = document.getElementById('emptyCart');
    
    if (state.cart.length === 0) {
        body.innerHTML = "";
        empty.style.display = "block";
        state.totalRemaining = 0;
    } else {
        empty.style.display = "none";
        let total = 0;
        body.innerHTML = state.cart.map(item => {
            const subtotal = item.price * item.sl;
            total += subtotal;
            return `
                <tr class="border-b">
                    <td class="py-4 font-bold text-gray-700">${item.name}</td>
                    <td class="py-4 text-center">
                        <div class="flex items-center justify-center gap-2">
                            <button onclick="changeQty('${item.id}', -1)" class="w-6 h-6 border rounded-full hover:bg-red-50">-</button>
                            <span class="font-black">${item.sl}</span>
                            <button onclick="changeQty('${item.id}', 1)" class="w-6 h-6 border rounded-full hover:bg-green-50">+</button>
                        </div>
                    </td>
                    <td class="py-4 text-right font-black text-[#0080C0]">${subtotal.toLocaleString()}đ</td>
                </tr>
            `;
        }).join('');
        state.totalRemaining = total;
    }
    
    document.getElementById('totalDisplay').textContent = state.totalRemaining.toLocaleString();
    document.getElementById('payAmount').value = state.totalRemaining; 
}

// THANH TOÁN D2 (TRỪ DẦN)
function confirmPartial() {
    const payInput = document.getElementById('payAmount');
    const amountPaid = parseInt(payInput.value) || 0;

    if (amountPaid <= 0) return alert("Vui lòng nhập số tiền!");

    state.totalRemaining = Math.max(0, state.totalRemaining - amountPaid);
    
    alert(`Đã nhận ${amountPaid.toLocaleString()}đ. Còn lại: ${state.totalRemaining.toLocaleString()}đ`);
    document.getElementById('totalDisplay').textContent = state.totalRemaining.toLocaleString();
    document.getElementById('payAmount').value = state.totalRemaining;
}

async function processPayment() {
    if (state.cart.length === 0) return alert("Giỏ hàng trống!");
    if (state.totalRemaining > 0) return alert("Chưa thu đủ tiền!");

    alert("Thanh toán thành công!");
    state.cart = [];
    updateCartUI();
}

function handleSearch(val) {
    const term = val.toLowerCase();
    const filtered = state.allProducts.filter(p => p.name.toLowerCase().includes(term));
    renderProductGrid(filtered);
}