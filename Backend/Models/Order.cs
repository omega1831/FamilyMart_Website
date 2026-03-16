using System;
using System.Collections.Generic;

namespace FamilyMart_Project.Models
{
    // 1. Class đại diện cho thông tin chung của hóa đơn (Bảng ORDERS trong Oracle)
    public class Order
    {
        public string OrderId { get; set; }        // Mã đơn hàng (PK)
        public DateTime OrderDate { get; set; }    // Ngày giờ tạo đơn
        public string StaffEmail { get; set; }     // Email nhân viên bán hàng (FK)
        public decimal TotalAmount { get; set; }   // Tổng tiền cuối cùng
        
        // Danh sách các món hàng chi tiết trong đơn này
        public List<OrderDetail> Details { get; set; } = new List<OrderDetail>();
    }

    // 2. Class đại diện cho từng món hàng trong đơn (Bảng ORDER_DETAILS trong Oracle)
    public class OrderDetail
    {
        public string OrderId { get; set; }        // Mã đơn hàng liên kết (FK)
        public string ProId { get; set; }          // Mã sản phẩm (FK)
        public string ProSize { get; set; }        // Size khách đã chọn (S, M, L, XL...)
        public decimal Price { get; set; }         // Giá tại thời điểm bán (đã gồm extra price của size)
        public int Quantity { get; set; } = 1;     // Số lượng (mặc định là 1)
    }
}