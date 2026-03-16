using System.Collections.Generic;

namespace FamilyMart_Project.Models
{
    public class Product
    {
        // Tương ứng với bảng PRODUCT trong Oracle
        public string ProId { get; set; }          // Mã sản phẩm (PK)
        public string ProName { get; set; }        // Tên sản phẩm
        public decimal BasePrice { get; set; }     // Giá gốc (Size nhỏ nhất hoặc mặc định)
        public string ImageUrl { get; set; }       // Link ảnh sản phẩm
        public string Description { get; set; }    // Mô tả món ăn/đồ uống
        public int Stock { get; set; }             // Số lượng tồn kho

        // Tương ứng với bảng PRODUCT_SIZES (Để xử lý đổi size nhảy giá)
        // Key: Tên Size (M, L, XL), Value: Giá cộng thêm (0, 5000, 10000)
        public Dictionary<string, decimal> Sizes { get; set; } = new Dictionary<string, decimal>();
    }

    // Class phụ để hỗ trợ map dữ liệu từ bảng PRODUCT_SIZES
    public class ProductSize
    {
        public int SizeId { get; set; }
        public string ProId { get; set; }
        public string SizeName { get; set; }
        public decimal ExtraPrice { get; set; }
    }
}