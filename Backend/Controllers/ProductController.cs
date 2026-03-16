using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using System.Collections.Generic;
using System.Data;

namespace FamilyMart_Project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ProductController : ControllerBase
    {
        private readonly string _connectionString;

        public ProductController(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("OracleConn");
        }

        // Class để định dạng dữ liệu trả về cho Frontend
        public class ProductDTO
        {
            public string Id { get; set; }
            public string Name { get; set; }
            public decimal BasePrice { get; set; }
            public string Img { get; set; }
            public string Desc { get; set; }
            public Dictionary<string, decimal> Sizes { get; set; } = new Dictionary<string, decimal>();
        }

        [HttpGet]
        public IActionResult GetAllProducts()
        {
            var products = new List<ProductDTO>();

            try
            {
                using (OracleConnection conn = new OracleConnection(_connectionString))
                {
                    conn.Open();
                    // Câu lệnh SQL JOIN để lấy cả thông tin món và các size đi kèm
                    string sql = @"SELECT p.PROID, p.PRONAME, p.BASEPRICE, p.IMAGE_URL, p.DESCRIPTION, 
                                          s.SIZE_NAME, s.EXTRA_PRICE 
                                   FROM PRODUCT p 
                                   LEFT JOIN PRODUCT_SIZES s ON p.PROID = s.PROID 
                                   ORDER BY p.PROID";

                    using (OracleCommand cmd = new OracleCommand(sql, conn))
                    {
                        using (OracleDataReader reader = cmd.ExecuteReader())
                        {
                            ProductDTO currentProduct = null;

                            while (reader.Read())
                            {
                                string proId = reader["PROID"].ToString();

                                // Nếu là sản phẩm mới (do 1 sản phẩm có nhiều dòng size)
                                if (currentProduct == null || currentProduct.Id != proId)
                                {
                                    currentProduct = new ProductDTO
                                    {
                                        Id = proId,
                                        Name = reader["PRONAME"].ToString(),
                                        BasePrice = Convert.ToDecimal(reader["BASEPRICE"]),
                                        Img = reader["IMAGE_URL"].ToString(),
                                        Desc = reader["DESCRIPTION"].ToString()
                                    };
                                    products.Add(currentProduct);
                                }

                                // Thêm thông tin size vào Dictionary nếu có
                                if (reader["SIZE_NAME"] != DBNull.Value)
                                {
                                    currentProduct.Sizes.Add(
                                        reader["SIZE_NAME"].ToString(), 
                                        Convert.ToDecimal(reader["EXTRA_PRICE"])
                                    );
                                }
                            }
                        }
                    }
                }
                return Ok(products);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi Oracle: " + ex.Message });
            }
        }
    }
}