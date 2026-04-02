
class Store {
    constructor(data) {

        this.id = data.storeid || data.storeId;
        this.name = data.storename || data.storeName;
    }

    // Tạo HTML cho option trong dropdown
    renderOption() {
        return `<option value="${this.id}" data-name="${this.name}">${this.name}</option>`;
    }
}

// 2. CẤU HÌNH & TRẠNG THÁI
const AUTH_CONFIG = {
    BASE_URL: "https://unpatinated-unmelodized-monique.ngrok-free.dev",
    STORE_PAGE: "store.html",
    POS_PAGE: "pos.html"
};

const authState = {
    stores: []
};

// 3. HÀM LẤY DANH SÁCH CHI NHÁNH
async function fetchStores() {
    const storeSelect = document.getElementById('storeSelect');
    if (!storeSelect) return;

    try {
        const response = await fetch(`${AUTH_CONFIG.BASE_URL}/api/store/get-all`, {
            method: 'GET',
            headers: {
                'ngrok-skip-browser-warning': 'true', 
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

        const rawData = await response.json();
        
        // PARSE DỮ LIỆU SANG MODEL
        authState.stores = rawData.map(item => new Store(item));

        // HIỂN THỊ LÊN UI
        storeSelect.innerHTML = '<option value="" disabled selected>-- Chọn chi nhánh làm việc --</option>';
        storeSelect.innerHTML += authState.stores.map(s => s.renderOption()).join('');

    } catch (error) {
        console.error("Lỗi khi lấy danh sách Store:", error);

        loadMockStores();
    }
}

// 4. HÀM XÁC NHẬN CHỌN STORE (LOGIN)
function loginToStore() {
    const select = document.getElementById('storeSelect');
    if (!select || !select.value) {
        alert("Vui lòng chọn một chi nhánh để bắt đầu!");
        return;
    }

    const selectedOption = select.options[select.selectedIndex];
    const storeId = select.value;
    const storeName = selectedOption.getAttribute('data-name');

    // Lưu vào localStorage (Đồng bộ với pos.js)
    localStorage.setItem('isLoggedIn', 'true');
    localStorage.setItem('selectedStoreId', storeId);
    localStorage.setItem('selectedStoreName', storeName);

    // Chuyển sang trang POS
    window.location.href = AUTH_CONFIG.POS_PAGE;
}

// 5. KIỂM TRA QUYỀN TRUY CẬP
function checkAccess() {
    const isLoggedIn = localStorage.getItem('isLoggedIn');
    const path = window.location.pathname;
    
    // Kiểm tra xem đang ở trang nào dựa trên tên file trong URL
    const isAtPos = path.includes(AUTH_CONFIG.POS_PAGE);
    const isAtStore = path.includes(AUTH_CONFIG.STORE_PAGE) || path.endsWith('/');

    if (isAtPos && !isLoggedIn) {
        window.location.href = AUTH_CONFIG.STORE_PAGE;
    }
    
    if (isAtStore && isLoggedIn) {
        window.location.href = AUTH_CONFIG.POS_PAGE;
    }
}

// 6. ĐĂNG XUẤT (LOGOUT)
function logout() {
    if (confirm("Bạn có chắc chắn muốn thoát ca và đổi chi nhánh không?")) {
        localStorage.clear();
        window.location.href = AUTH_CONFIG.STORE_PAGE;
    }
}

// KHỞI CHẠY TỰ ĐỘNG
document.addEventListener('DOMContentLoaded', () => {
    const path = window.location.pathname;
    
    // Nếu đang ở trang chọn store thì mới load danh sách
    if (path.includes(AUTH_CONFIG.STORE_PAGE) || path.endsWith('/') || path.includes('index.html')) {
        fetchStores();
    }
    
    checkAccess();
});

// DỮ LIỆU GIẢ (BACKUP)
function loadMockStores() {
    const storeSelect = document.getElementById('storeSelect');
    const mockData = [
        new Store({ storeid: "MOCK01", storename: "Family Mart Lê Thánh Tôn (Dữ liệu Test)" }),
        new Store({ storeid: "MOCK02", storename: "Family Mart Nguyễn Hữu Cảnh (Dữ liệu Test)" })
    ];
    storeSelect.innerHTML = '<option value="" disabled selected>-- API Lỗi - Chọn tạm Store Test --</option>';
    storeSelect.innerHTML += mockData.map(s => s.renderOption()).join('');
}