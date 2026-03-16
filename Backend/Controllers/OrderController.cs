using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace FamilyMart_Project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class OrderController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public OrderController(IConfiguration configuration)
        {
            _configuration = configuration;
            _connectionString = _configuration.GetConnectionString("OracleConn");
        }

        // ĐỊNH NGHĨA CLASS NHẬN ĐƠN HÀNG TỪ POS.JS
        public class OrderRequest
        {
            public string ProductId { get; set; }
            public string Size { get; set; }
            public decimal Total { get; set; }
            public string StaffEmail { get; set; }
        }

        [HttpPost("create")]
        public IActionResult CreateOrder([FromBody] OrderRequest request)
        {
            if (request == null) return BadRequest();

            using (OracleConnection conn = new OracleConnection(_connectionString))
            {
                conn.Open();
                // Dùng Transaction để đảm bảo lưu cả đơn hàng và chi tiết đơn hàng an toàn
                using (OracleTransaction trans = conn.BeginTransaction())
                {
                    try
                    {
                        // 1. TẠO MÃ ĐƠN HÀNG TỰ ĐỘNG (Ví dụ: ORD_123)
                        string orderId = "ORD" + DateTime.Now.ToString("yyyyMMddHHmmss");

                        // 2. CHÈN VÀO BẢNG ORDERS
                        string sqlOrder = "INSERT INTO ORDERS (ORDERID, ORDERDATE, STAFF_EMAIL, TOTAL_AMOUNT) " +
                                          "VALUES (:id, CURRENT_TIMESTAMP, :email, :total)";
                        using (OracleCommand cmd = new OracleCommand(sqlOrder, conn))
                        {
                            cmd.Parameters.Add(new OracleParameter("id", orderId));
                            cmd.Parameters.Add(new OracleParameter("email", request.StaffEmail));
                            cmd.Parameters.Add(new OracleParameter("total", request.Total));
                            cmd.ExecuteNonQuery();
                        }

                        // 3. CHÈN VÀO BẢNG ORDER_DETAILS (Lưu cả Size khách chọn)
                        string sqlDetail = "INSERT INTO ORDER_DETAILS (ORDERID, PROID, PROSIZE, PRICE) " +
                                           "VALUES (:id, :proid, :size, :price)";
                        using (OracleCommand cmd = new OracleCommand(sqlDetail, conn))
                        {
                            cmd.Parameters.Add(new OracleParameter("id", orderId));
                            cmd.Parameters.Add(new OracleParameter("proid", request.ProductId));
                            cmd.Parameters.Add(new OracleParameter("size", request.Size));
                            cmd.Parameters.Add(new OracleParameter("price", request.Total));
                            cmd.ExecuteNonQuery();
                        }

                        // 4. CẬP NHẬT TỒN KHO (Giảm số lượng 1 sản phẩm)
                        string sqlUpdateStock = "UPDATE PRODUCT SET STOCK = STOCK - 1 WHERE PROID = :proid";
                        using (OracleCommand cmd = new OracleCommand(sqlUpdateStock, conn))
                        {
                            cmd.Parameters.Add(new OracleParameter("proid", request.ProductId));
                            cmd.ExecuteNonQuery();
                        }

                        trans.Commit(); // Hoàn tất lưu vào Oracle
                        return Ok(new { message = "Thanh toán thành công!", orderId = orderId });
                    }
                    catch (Exception ex)
                    {
                        trans.Rollback(); // Nếu lỗi thì hủy bỏ toàn bộ để tránh sai dữ liệu
                        return StatusCode(500, new { message = "Lỗi lưu đơn hàng: " + ex.Message });
                    }
                }
            }
        }
    }
}