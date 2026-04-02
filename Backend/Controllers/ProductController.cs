using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Linq;

namespace Backend.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        // Danh sách dữ liệu mẫu chuẩn để test giao diện
        private static readonly List<object> _mockProducts = new List<object>
        {
            new { 
                productId = "f8e97eef-6765-aa47-8fe4-abe98b338cc5", 
                productName = "C2 Chanh", 
                categoryName = "Thức uống", 
                price = 10000,
                imageUrl = "https://cdn.tgdd.vn/Products/Images/2443/76467/bhx/tra-xanh-c2-huong-chanh-360ml-202308111037388910.jpg"
            },
            new { 
                productId = "1f107dda-8754-b041-ad25-e0ff08abf7d5", 
                productName = "Hao Hao Noodles", 
                categoryName = "Đồ Ăn", 
                price = 5000,
                imageUrl = "https://acecookvietnam.vn/wp-content/uploads/2017/07/Hao-Hao-Tom-Chua-Cay.jpg"
            },
            new { 
                productId = "9f0ef484-0899-8a4b-a6f4-f6b03eb1966a", 
                productName = "Vinamilk Fresh Milk", 
                categoryName = "Thức uống", 
                price = 12000,
                imageUrl = "https://p-vn.u-static.com/product/112/111059/1.jpg"
            },
            new { 
                productId = "ef1ee53d-0ce0-de46-8825-189ded8378da", 
                productName = "Pepsi Cola", 
                categoryName = "Thức uống", 
                price = 10000,
                imageUrl = "https://i.imgur.com/8Q8W1lF.jpg" 
            }
        };

        // 1. API Lấy toàn bộ sản phẩm (Dùng cho trang POS chính)
        [HttpGet("get-all")]
        public IActionResult GetAll()
        {
            return Ok(_mockProducts);
        }

        // 2. API Lấy chi tiết 1 sản phẩm (Dùng khi click chọn món)
        [HttpGet("{id}")]
        public IActionResult GetById(string id)
        {
            var product = _mockProducts.FirstOrDefault(p => 
                (string)p.GetType().GetProperty("productId").GetValue(p) == id);

            if (product == null) return NotFound(new { message = "Không tìm thấy" });
            return Ok(product);
        }

        // 3. API Tìm kiếm (Dùng cho thanh Search banh bao, c2...)
        [HttpGet("search")]
        public IActionResult Search([FromQuery] string query)
        {
            if (string.IsNullOrEmpty(query)) return Ok(_mockProducts);
            
            var results = _mockProducts.Where(p => 
                p.GetType().GetProperty("productName").GetValue(p).ToString().ToLower().Contains(query.ToLower())
            ).ToList();

            return Ok(results);
        }
    }
}