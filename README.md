# Hệ Thống Định Tuyến MRT Đài Bắc

Ứng dụng tìm đường đi ngắn nhất trên mạng lưới tàu điện ngầm MRT Đài Bắc (Taipei Metro), sử dụng thuật toán Dijkstra cải tiến với chi phí chuyển tuyến. Hỗ trợ cả giao diện dòng lệnh (CLI) và giao diện web với bản đồ Leaflet tương tác.

## Tính Năng Chính

- **Tìm đường đi ngắn nhất** giữa hai ga bất kỳ, tối ưu hóa khoảng cách thực (km) và số lần đổi tuyến
- **Bản đồ Leaflet tương tác** — bản đồ tile thật với tọa độ GPS chính xác cho tất cả 108 ga
- **Click-to-route** — bấm 2 điểm bất kỳ trên bản đồ → tìm ga gần nhất → hiển thị đi bộ + tàu MRT
- **5 tuyến MRT** với 108 ga (sau khi gộp ga trung chuyển) và 115 kết nối
- **Trọng số thực** — khoảng cách giữa các ga tính bằng km (0.30 – 3.40 km)
- **Giao diện CLI** cho người dùng (tìm đường) và quản trị viên (quản lý mạng lưới)
- **Trang quản trị web** cho phép đóng/mở ga, kết nối, toàn bộ tuyến trong thời gian thực
- **Thuật toán Dijkstra cải tiến** với không gian trạng thái `(ga, tuyến_đến)` và phạt chuyển tuyến

## Ảnh Chụp Màn Hình

### Bản đồ Leaflet với các tuyến MRT

Bản đồ hiển thị toàn bộ 5 tuyến MRT dưới dạng polyline màu trên nền bản đồ tile OpenStreetMap (nhãn tiếng Anh). Mỗi ga được đánh dấu bằng circle marker, ga trung chuyển lớn hơn. Nhãn tên ga hiện khi zoom >= 13.

### Click-to-route

Bấm điểm A (đỏ) → đường đi bộ đứt nét → tuyến MRT → đường đi bộ đứt nét → điểm B (xanh).

## Các Tuyến MRT

| Mã | Tên tuyến | Màu | Tên tiếng Anh | Số ga |
|----|-----------|------|----------------|-------|
| BR | Tuyến Nâu (Văn Hồ) | `#C48C31` | Wenhu Line | 24 |
| R  | Tuyến Đỏ (Đạm Thủy-Tín Nghĩa) | `#E3002C` | Tamsui-Xinyi Line | 27 |
| G  | Tuyến Xanh Lá (Tùng Sơn-Tân Điếm) | `#008659` | Songshan-Xindian Line | 20 |
| O  | Tuyến Cam (Trung Hòa-Tân Lô) | `#F8B61C` | Zhonghe-Xinlu Line | 26 |
| BL | Tuyến Xanh Dương (Bản Nam) | `#0070BD` | Bannan Line | 23 |

**Tổng cộng:** 108 ga duy nhất, 115 kết nối, 12 ga trung chuyển

## Yêu Cầu Hệ Thống

- **Python** 3.10 trở lên
- **Flask** 3.x (cho giao diện web)
- Không cần cơ sở dữ liệu — dữ liệu được nạp từ file JSON

## Cài Đặt và Chạy

### 1. Clone dự án

```bash
git clone https://github.com/NQKhaixyz/nhapmonAI.git
cd mrt_routing_project
```

### 2. Cài đặt thư viện

```bash
pip install -r requirements.txt
```

Hoặc cài thủ công:

```bash
pip install flask
```

### 3a. Chạy giao diện CLI

```bash
python main.py
```

Menu chính sẽ hiện ra với 3 lựa chọn:
- `[1]` Người dùng — Tìm đường đi
- `[2]` Quản trị — Quản lý mạng lưới
- `[3]` Thoát

### 3b. Chạy giao diện Web

```bash
python -m web.app
```

Truy cập:
- **Trang tìm đường:** http://localhost:5000
- **Trang quản trị:** http://localhost:5000/admin

## Cấu Trúc Thư Mục

```
mrt_routing_project/
├── main.py                  # Điểm khởi chạy CLI
├── requirements.txt         # Danh sách thư viện Python
├── data/
│   └── mrt_map.json         # Dữ liệu MRT (108 ga, 115 kết nối, tọa độ GPS, trọng số km)
├── core/
│   ├── __init__.py
│   ├── models.py            # Station (lat/lng), Connection (weight: km), SubwayNetwork
│   └── algorithms.py        # Dijkstra cải tiến (float costs, predecessor tracing)
├── utils/
│   ├── __init__.py
│   └── data_loader.py       # Nạp JSON, gộp ga trung chuyển, haversine, TRANSFER_ID_MAP
├── ui/
│   ├── __init__.py
│   ├── user_cli.py          # Giao diện CLI người dùng
│   └── admin_cli.py         # Giao diện CLI quản trị viên
├── web/
│   ├── app.py               # Flask server, 15 API routes
│   ├── templates/
│   │   ├── index.html       # Trang tìm đường (Leaflet + click-to-route)
│   │   └── admin.html       # Trang quản trị
│   └── static/
│       ├── css/
│       │   └── style.css    # Stylesheet toàn bộ
│       └── js/
│           ├── app.js       # Logic tìm đường + autocomplete
│           ├── map.js       # Bản đồ Leaflet tương tác + click-to-route (~916 dòng)
│           └── admin.js     # Logic trang quản trị
└── docs/
    ├── architecture.md      # Kiến trúc hệ thống + Mô hình dữ liệu
    ├── algorithm.md         # Thuật toán Dijkstra cải tiến
    ├── api-reference.md     # Tham chiếu API (15 endpoints)
    ├── user-guide.md        # Hướng dẫn sử dụng (CLI + Web)
    └── data-format.md       # Định dạng dữ liệu JSON
```

## Tài Liệu Chi Tiết

| Tài liệu | Nội dung |
|-----------|----------|
| [Kiến trúc hệ thống](docs/architecture.md) | Tổng quan kiến trúc, mô hình dữ liệu, xử lý ga trung chuyển, tọa độ GPS |
| [Thuật toán Dijkstra](docs/algorithm.md) | Không gian trạng thái, phạt chuyển tuyến, trọng số km, ví dụ minh họa |
| [Tham chiếu API](docs/api-reference.md) | Tất cả 15 API endpoints với request/response mẫu |
| [Hướng dẫn sử dụng](docs/user-guide.md) | Cách dùng CLI, Web, bản đồ Leaflet, click-to-route, trang quản trị |
| [Định dạng dữ liệu](docs/data-format.md) | Cấu trúc file `mrt_map.json`, bảng ánh xạ ga trung chuyển, tọa độ GPS |

## Công Nghệ Sử Dụng

| Thành phần | Công nghệ |
|------------|-----------|
| Backend | Python 3, Flask |
| Frontend | HTML5, CSS3, JavaScript (Vanilla) |
| Bản đồ | Leaflet.js + OpenStreetMap DE tiles (nhãn tiếng Anh) |
| Thuật toán | Dijkstra cải tiến với `heapq`, float costs (km) |
| Dữ liệu | JSON tĩnh với tọa độ GPS thực và khoảng cách km |

## Giấy Phép

Dự án này được phát triển cho mục đích học tập và nghiên cứu.
