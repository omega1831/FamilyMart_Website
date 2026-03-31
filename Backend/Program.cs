using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// 1. Cấu hình Controllers và JSON (Giữ nguyên tên biến cho POS.js)
builder.Services.AddControllers()
    .AddJsonOptions(options => {
        options.JsonSerializerOptions.PropertyNamingPolicy = null; 
    });

// 2. Cấu hình CORS - Cho phép Frontend gọi API
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => {
        policy.AllowAnyOrigin()
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// 3. Cấu hình Swagger (Dùng Try-Catch hoặc viết tường minh để tránh lỗi build)
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo 
    { 
        Title = "FamilyMart POS API", 
        Version = "v1",
        Description = "API dành cho hệ thống quản lý FamilyMart"
    });
});

var app = builder.Build();

// 4. Kích hoạt Swagger UI (Kể cả trong môi trường Production để dễ test)
app.UseSwagger();
app.UseSwaggerUI(c => 
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "FamilyMart API V1");
    c.RoutePrefix = "swagger"; 
});

// 5. THỨ TỰ MIDDLEWARE CỰC KỲ QUAN TRỌNG
app.UseHttpsRedirection();

app.UseRouting(); // Thêm dòng này để định tuyến tốt hơn

app.UseCors("AllowAll"); // Cors phải đặt TRƯỚC Authorization

app.UseAuthorization();

app.MapControllers();

app.Run();