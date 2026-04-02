using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using System;
using System.Collections.Generic;
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

        // --- ĐỊNH NGHĨA CLASS KHỚP VỚI JSON TỪ POS.JS ---
        public class ProductItem
        {
            public string ProductId { get; set; }
            public int Quantity { get; set; }
            public decimal Price { get; set; }
        }

        public class PaymentItem
        {
            public string PaymentMethod { get; set; }
            public decimal Amount { get; set; }
            public string ExtraInfo { get; set; }
        }

        public class OrderPayload
        {
            public string StoreId { get; set; }
            public string EmployeeId { get; set; }
            public List<ProductItem> Products { get; set; }
            public List<PaymentItem> Payments { get; set; }
        }

        // Đổi tên endpoint thành process-sale để khớp với pos.js của bạn
      [HttpPost("process-sale")]
public IActionResult ProcessSale([FromBody] OrderPayload request)
{
    // Kiểm tra dữ liệu đầu vào cơ bản
    if (request == null || request.Products == null || request.Products.Count == 0)
        return BadRequest(new { message = "Giỏ hàng đang trống!" });

    // Kiểm tra số lượng sản phẩm hợp lệ
    if (request.Products.Any(p => p.Quantity <= 0))
        return BadRequest(new { message = "Số lượng sản phẩm phải lớn hơn 0!" });

    string orderId = "ORD" + DateTime.Now.ToString("yyyyMMddHHmmss");
    decimal totalAmount = request.Products.Sum(p => p.Price * p.Quantity);

    try 
    {
        // Nếu không có chuỗi kết nối, nhảy thẳng xuống phần giả lập (Mock)
        if (string.IsNullOrEmpty(_connectionString)) throw new InvalidOperationException("No DB Connection");

        using (OracleConnection conn = new OracleConnection(_connectionString))
        {
            conn.Open();
            using (OracleTransaction trans = conn.BeginTransaction())
            {
                try
                {
                    // 1. Lưu đơn hàng tổng
                    string sqlOrder = "INSERT INTO ORDERS (ORDERID, ORDERDATE, STOREID, EMPID, TOTAL_AMOUNT, STATUS) " +
                                      "VALUES (:id, CURRENT_TIMESTAMP, :store, :emp, :total, 'COMPLETED')";
                    using (OracleCommand cmd = new OracleCommand(sqlOrder, conn))
                    {
                        cmd.Parameters.Add("id", orderId);
                        cmd.Parameters.Add("store", request.StoreId);
                        cmd.Parameters.Add("emp", request.EmployeeId);
                        cmd.Parameters.Add("total", totalAmount);
                        cmd.ExecuteNonQuery();
                    }

                    // 2. Lưu chi tiết từng món và trừ kho
                    foreach (var item in request.Products)
                    {
                        // Insert Details
                        string sqlDetail = "INSERT INTO ORDER_DETAILS (ORDERID, PROID, QUANTITY, PRICE) VALUES (:id, :proid, :qty, :price)";
                        using (OracleCommand cmd = new OracleCommand(sqlDetail, conn))
                        {
                            cmd.Parameters.Add("id", orderId);
                            cmd.Parameters.Add("proid", item.ProductId);
                            cmd.Parameters.Add("qty", item.Quantity);
                            cmd.Parameters.Add("price", item.Price);
                            cmd.ExecuteNonQuery();
                        }

                        // Update Stock
                        string sqlUpdate = "UPDATE PRODUCT SET STOCK = STOCK - :qty WHERE PROID = :proid";
                        using (OracleCommand cmd = new OracleCommand(sqlUpdate, conn))
                        {
                            cmd.Parameters.Add("qty", item.Quantity);
                            cmd.Parameters.Add("proid", item.ProductId);
                            cmd.ExecuteNonQuery();
                        }
                    }

                    trans.Commit();
                    return Ok(new { success = true, message = "Thanh toán thành công!", orderId = orderId });
                }
                catch (Exception ex)
                {
                    trans.Rollback();
                    return StatusCode(500, new { message = "Lỗi Database: " + ex.Message });
                }
            }
        }
    }
    catch (Exception ex)
            {
                // NẾU LỖI DATABASE, VẪN TRẢ VỀ THÀNH CÔNG GIẢ ĐỂ TEST FRONTEND
                Console.WriteLine("Lỗi Oracle: " + ex.Message);
                return Ok(new { 
                    message = "Thanh toán giả lập thành công!", 
                    orderId = orderId
                });
            }
        } // Đóng ngoặc của hàm ProcessSale
    } // Đóng ngoặc của class OrderController
} // Đóng ngoặc của namespace FamilyMart_Project.Controllers