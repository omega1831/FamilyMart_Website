using Microsoft.AspNetCore.Mvc;
using Oracle.ManagedDataAccess.Client;
using System.Data;

namespace FamilyMart_Project.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly IConfiguration _configuration;
        private readonly string _connectionString;

        public AuthController(IConfiguration configuration)
        {
            _configuration = configuration;
            // Lấy chuỗi kết nối Oracle từ file appsettings.json
            _connectionString = _configuration.GetConnectionString("OracleConn");
        }

        // ĐỊNH NGHĨA CLASS NHẬN DỮ LIỆU TỪ FRONTEND
        public class LoginRequest
        {
            public string Email { get; set; }
            public string Password { get; set; }
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginRequest request)
        {
            if (request == null || string.IsNullOrEmpty(request.Email))
                return BadRequest(new { message = "Dữ liệu không hợp lệ!" });

            try
            {
                using (OracleConnection conn = new OracleConnection(_connectionString))
                {
                    conn.Open();
                    // TRUY VẤN KIỂM TRA TÀI KHOẢN TRONG ORACLE
                    string sql = "SELECT EMPNAME, ROLE FROM EMPLOYEE WHERE EMAIL = :email AND PASSWORD = :pass";
                    
                    using (OracleCommand cmd = new OracleCommand(sql, conn))
                    {
                        cmd.Parameters.Add(new OracleParameter("email", request.Email));
                        cmd.Parameters.Add(new OracleParameter("pass", request.Password)); // Lưu ý: Nên dùng Password Hashing thực tế

                        using (OracleDataReader reader = cmd.ExecuteReader())
                        {
                            if (reader.Read())
                            {
                                // ĐĂNG NHẬP THÀNH CÔNG
                                var userData = new
                                {
                                    fullName = reader["EMPNAME"].ToString(),
                                    role = reader["ROLE"].ToString(),
                                    token = "FM-JWT-" + Guid.NewGuid().ToString(), // Token giả lập
                                    message = "Đăng nhập thành công!"
                                };
                                return Ok(userData);
                            }
                        }
                    }
                }
                // SAI THÔNG TIN
                return Unauthorized(new { message = "Email hoặc mật khẩu không chính xác!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Lỗi Database: " + ex.Message });
            }
        }
    }
}