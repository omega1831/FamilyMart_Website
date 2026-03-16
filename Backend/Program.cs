using Microsoft.OpenApi.Models;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// 1. CẤU HÌNH KẾT NỐI ORACLE
// Lấy chuỗi kết nối từ appsettings.json
var connectionString = builder.Configuration.GetConnectionString("OracleConn");

// 2. CẤU HÌNH CORS (Cho phép Frontend truy cập API)
// Lưu ý: Thay đổi URL nếu Live Server của bạn chạy ở cổng khác (ví dụ 5501)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend",
        policy =>
        {
            policy.WithOrigins("http://127.0.0.1:5500", "http://localhost:5500")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

// 3. CẤU HÌNH CONTROLLERS & JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // Giữ nguyên kiểu chữ của thuộc tính (để JS nhận đúng ProId, BasePrice...)
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

// 4. CẤU HÌNH SWAGGER (Để bạn test API trực tiếp trên web)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "FamilyMart POS API", Version = "v1" });
});

var app = builder.Build();

// 5. CẤU HÌNH PIPELINE (THỨ TỰ XỬ LÝ)
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Kích hoạt CORS trước khi xử lý Routing
app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();