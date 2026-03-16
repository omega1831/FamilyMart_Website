/**
 * AUTH.JS - Quản lý xác thực và phân quyền FamilyMart
 * Kết nối: Frontend -> Backend (ASP.NET) -> DB (Oracle)
 */

const AUTH_CONFIG = {
    // Thay đổi URL này trùng với địa chỉ chạy Backend ASP.NET của bạn
    BASE_URL: "https://localhost:5001/api/Auth", 
    LOGIN_PAGE: "login.html",
    INDEX_PAGE: "index.html",
    ADMIN_PAGE: "manager.html"
};

// 1. HÀM ĐĂNG NHẬP (Gửi Email/Pass lên Backend)
async function login(email, password) {
    try {
        const response = await fetch(`${AUTH_CONFIG.BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (response.ok) {
            // Lưu thông tin lấy từ Oracle vào SessionStorage
            sessionStorage.setItem('isLoggedIn', 'true');
            sessionStorage.setItem('userToken', data.token); // JWT Token nếu có
            sessionStorage.setItem('userRole', data.role);   // Lấy từ cột ROLE trong DB
            sessionStorage.setItem('userName', data.fullName);
            sessionStorage.setItem('userEmail', email);

            return { success: true, role: data.role };
        } else {
            return { success: false, message: data.message || "Sai thông tin đăng nhập!" };
        }
    } catch (error) {
        console.error("Auth Error:", error);
        return { success: false, message: "Không thể kết nối tới máy chủ!" };
    }
}

// 2. HÀM ĐĂNG XUẤT
function logout() {
    sessionStorage.clear(); // Xóa sạch dấu vết đăng nhập
    window.location.href = AUTH_CONFIG.LOGIN_PAGE;
}

// 3. KIỂM TRA QUYỀN TRUY CẬP (Bảo vệ các trang Manager)
function checkAccess() {
    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userRole = sessionStorage.getItem('userRole');
    const currentPage = window.location.pathname.split("/").pop();

    // Nếu cố tình vào manager.html mà không phải Manager
    if (currentPage === AUTH_CONFIG.ADMIN_PAGE) {
        if (!isLoggedIn || userRole !== 'Manager') {
            alert("⚠️ Cảnh báo: Bạn không có quyền truy cập khu vực quản trị!");
            window.location.href = AUTH_CONFIG.INDEX_PAGE;
        }
    }
    
    // Nếu đã đăng nhập mà vẫn cố vào trang login.html
    if (currentPage === AUTH_CONFIG.LOGIN_PAGE && isLoggedIn) {
        window.location.href = AUTH_CONFIG.INDEX_PAGE;
    }
}

// 4. CẬP NHẬT GIAO DIỆN DỰA TRÊN LOGIN (Ẩn/Hiện nút)
function updateUIBasedOnAuth() {
    const authArea = document.getElementById('authArea');
    if (!authArea) return;

    const isLoggedIn = sessionStorage.getItem('isLoggedIn');
    const userName = sessionStorage.getItem('userName');
    const userRole = sessionStorage.getItem('userRole');

    if (isLoggedIn) {
        authArea.innerHTML = `
            <div class="flex items-center space-x-4">
                <div class="text-right hidden sm:block">
                    <p class="text-xs font-bold uppercase tracking-tighter text-white opacity-80">${userRole}</p>
                    <p class="text-sm font-black text-white">${userName}</p>
                </div>
                <div class="relative group">
                    <button class="w-10 h-10 bg-white text-[#0080C0] rounded-full flex items-center justify-center shadow-lg">
                        <i class="fa fa-user"></i>
                    </button>
                    <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl py-2 hidden group-hover:block border animate-fade-in">
                        ${userRole === 'Manager' ? `<a href="manager.html" class="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 font-bold"><i class="fa fa-tasks mr-2"></i>Quản trị</a>` : ''}
                        <button onclick="logout()" class="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold">
                            <i class="fa fa-sign-out-alt mr-2"></i>Đăng xuất
                        </button>
                    </div>
                </div>
            </div>
        `;
    }
}

// Tự động chạy kiểm tra khi nạp file JS
document.addEventListener('DOMContentLoaded', () => {
    checkAccess();
    updateUIBasedOnAuth();
});