# Hệ Thống Định Tuyến MRT Đài Bắc

Ứng dụng tìm đường đi ngắn nhất trên mạng lưới tàu điện ngầm MRT Đài Bắc (Taipei Metro), sử dụng thuật toán Dijkstra cải tiến với chi phí chuyển tuyến. Hỗ trợ cả giao diện dòng lệnh (CLI) và giao diện web với bản đồ SVG tương tác.

## Tính Năng Chính

- **Tìm đường đi ngắn nhất** giữa hai ga bất kỳ, tối ưu hóa cả khoảng cách và số lần đổi tuyến
- **5 tuyến MRT** với khoảng 100 ga (sau khi gộp ga trung chuyển) và ~117 kết nối
- **Giao diện web** với bản đồ SVG tương tác, hỗ trợ kéo/thu phóng, tô sáng lộ trình
- **Giao diện CLI** cho người dùng (tìm đường) và quản trị viên (quản lý mạng lưới)
- **Trang quản trị** cho phép đóng/mở ga, kết nối, toàn bộ tuyến trong thời gian thực
- **Thuật toán Dijkstra cải tiến** với không gian trạng thái `(ga, tuyến_đến)` và phạt chuyển tuyến

## Các Tuyến MRT

| Mã | Tên tuyến | Màu | Tên tiếng Anh |
|----|-----------|------|----------------|
| BR | Tuyến Nâu (Văn Hồ) | Nâu `#C48C31` | Wenhu Line |
| R  | Tuyến Đỏ (Đạm Thủy-Tín Nghĩa) | Đỏ `#E3002C` | Tamsui-Xinyi Line |
| G  | Tuyến Xanh Lá (Tùng Sơn-Tân Điếm) | Xanh lá `#008659` | Songshan-Xindian Line |
| O  | Tuyến Cam (Trung Hòa-Tân Lô) | Cam `#F8B61C` | Zhonghe-Xinlu Line |
| BL | Tuyến Xanh Dương (Bản Nam) | Xanh dương `#0070BD` | Bannan Line |

## Yêu Cầu Hệ Thống

- **Python** 3.10 trở lên
- **Flask** 3.x (cho giao diện web)
- Không cần cơ sở dữ liệu — dữ liệu được nạp từ file JSON

## Cài Đặt và Chạy

### 1. Clone dự án

```bash
git clone <repository-url>
cd mrt_routing_project
```

### 2. Cài đặt thư viện

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
python web/app.py
```

Truy cập:
- **Trang tìm đường:** http://localhost:5000
- **Trang quản trị:** http://localhost:5000/admin

## Cấu Trúc Thư Mục

```
mrt_routing_project/
├── main.py                  # Điểm khởi chạy CLI
├── data/
│   └── mrt_map.json         # Dữ liệu bản đồ MRT (ga, kết nối, tuyến)
├── core/
│   ├── __init__.py           # Xuất các lớp/hàm cốt lõi
│   ├── models.py             # Station, Connection, SubwayNetwork (447 dòng)
│   └── algorithms.py         # Thuật toán Dijkstra cải tiến (227 dòng)
├── utils/
│   ├── __init__.py           # Xuất hàm load_network
│   └── data_loader.py        # Nạp JSON, gộp ga trung chuyển (137 dòng)
├── ui/
│   ├── user_cli.py           # Giao diện CLI người dùng (224 dòng)
│   └── admin_cli.py          # Giao diện CLI quản trị viên (265 dòng)
├── web/
│   ├── app.py                # Flask server, 15 API routes (578 dòng)
│   ├── templates/
│   │   ├── index.html        # Trang tìm đường (203 dòng)
│   │   └── admin.html        # Trang quản trị (216 dòng)
│   └── static/
│       ├── css/
│       │   └── style.css     # Stylesheet toàn bộ (1694 dòng)
│       └── js/
│           ├── app.js        # Logic tìm đường + autocomplete (595 dòng)
│           ├── map.js        # Bản đồ SVG tương tác (919 dòng)
│           └── admin.js      # Logic trang quản trị (260 dòng)
└── docs/
    ├── architecture.md       # Kiến trúc hệ thống + Mô hình dữ liệu
    ├── algorithm.md          # Thuật toán Dijkstra cải tiến
    ├── api-reference.md      # Tham chiếu API (15 endpoints)
    ├── user-guide.md         # Hướng dẫn sử dụng (CLI + Web)
    └── data-format.md        # Định dạng dữ liệu JSON
```

## Tài Liệu Chi Tiết

| Tài liệu | Nội dung |
|-----------|----------|
| [Kiến trúc hệ thống](docs/architecture.md) | Tổng quan kiến trúc, mô hình dữ liệu, các lớp cốt lõi, cách xử lý ga trung chuyển |
| [Thuật toán Dijkstra](docs/algorithm.md) | Giải thích chi tiết thuật toán tìm đường, không gian trạng thái, phạt chuyển tuyến, ví dụ minh họa |
| [Tham chiếu API](docs/api-reference.md) | Tất cả 15 API endpoints với request/response mẫu |
| [Hướng dẫn sử dụng](docs/user-guide.md) | Cách dùng giao diện CLI và Web, bản đồ SVG tương tác, trang quản trị |
| [Định dạng dữ liệu](docs/data-format.md) | Cấu trúc file `mrt_map.json`, bảng ánh xạ ga trung chuyển |

## Công Nghệ Sử Dụng

- **Backend:** Python 3, Flask
- **Frontend:** HTML5, CSS3, JavaScript (Vanilla)
- **Bản đồ:** SVG tương tác với pan/zoom, tọa độ ga được mã hóa cứng
- **Thuật toán:** Dijkstra cải tiến với hàng đợi ưu tiên (`heapq`)
- **Dữ liệu:** JSON tĩnh, không cần cơ sở dữ liệu

## Giấy Phép

Dự án này được phát triển cho mục đích học tập và nghiên cứu.
