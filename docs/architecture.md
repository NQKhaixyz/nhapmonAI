# Kiến Trúc Hệ Thống

[< Quay lại README](../README.md)

## Tổng Quan

Hệ thống được thiết kế theo kiến trúc phân tầng (layered architecture) với 4 tầng chính:

```
┌─────────────────────────────────────────────┐
│          Tầng Giao Diện (Presentation)      │
│  ┌──────────────┐  ┌─────────────────────┐  │
│  │  CLI (ui/)   │  │   Web (web/)        │  │
│  │  user_cli.py │  │   app.py (Flask)    │  │
│  │  admin_cli.py│  │   templates/ + js/  │  │
│  └──────────────┘  └─────────────────────┘  │
├─────────────────────────────────────────────┤
│          Tầng Nghiệp Vụ (Business Logic)    │
│  ┌──────────────────────────────────────┐   │
│  │  core/models.py    - SubwayNetwork   │   │
│  │  core/algorithms.py - Dijkstra       │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│          Tầng Dữ Liệu (Data Access)        │
│  ┌──────────────────────────────────────┐   │
│  │  utils/data_loader.py                │   │
│  │  Nạp JSON, gộp ga trung chuyển       │   │
│  └──────────────────────────────────────┘   │
├─────────────────────────────────────────────┤
│          Tầng Lưu Trữ (Storage)            │
│  ┌──────────────────────────────────────┐   │
│  │  data/mrt_map.json                   │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

## Luồng Dữ Liệu

### Khởi tạo hệ thống

```
mrt_map.json → data_loader.py → SubwayNetwork (trong bộ nhớ)
                                    ├── stations: dict[str, Station]
                                    └── adjacency_list: dict[str, list[Connection]]
```

1. `data_loader.py` đọc file JSON
2. Mỗi ga trong JSON được chuyển qua `resolve_station_id()` để gộp ga trung chuyển
3. Các đối tượng `Station` và `Connection` được tạo và thêm vào `SubwayNetwork`
4. `_validate_network()` kiểm tra tính toàn vẹn (ga cô lập, ga trung chuyển thiếu tuyến)

### Tìm đường đi (Web)

```
Trình duyệt → POST /api/find-route → app.py → find_shortest_path() → JSON response
                {start, end}                       ↓
                                            Dijkstra trên SubwayNetwork
                                                   ↓
                                            _reconstruct_result()
                                                   ↓
                                            _build_segments() (app.py)
                                                   ↓
                                            JSON với segments chi tiết
```

---

## Mô Hình Dữ Liệu

### Lớp `Station` (`core/models.py:12`)

Biểu diễn một ga tàu (đỉnh trong đồ thị).

| Thuộc tính | Kiểu | Mô tả |
|------------|------|-------|
| `id` | `str` | Mã định danh duy nhất (VD: `"BL12"`, `"BR09"`) |
| `name` | `str` | Tên hiển thị (VD: `"Taipei Main Station"`) |
| `lines` | `list[str]` | Danh sách mã tuyến đi qua ga (VD: `["R", "BL"]`) |
| `is_transfer` | `bool` | Ga trung chuyển (>= 2 tuyến) |
| `is_terminal` | `bool` | Ga đầu/cuối tuyến |
| `is_active` | `bool` | Trạng thái hoạt động (mặc định `True`) |

**Phương thức đặc biệt:**
- `__eq__`: So sánh theo `id`
- `__hash__`: Băm theo `id` → có thể dùng trong `set` và làm key của `dict`

### Lớp `Connection` (`core/models.py:56`)

Biểu diễn một kết nối đường ray giữa hai ga liền kề (cạnh trong đồ thị).

| Thuộc tính | Kiểu | Mô tả |
|------------|------|-------|
| `station_a` | `Station` | Ga đầu tiên |
| `station_b` | `Station` | Ga thứ hai |
| `line` | `str` | Mã tuyến (VD: `"BL"`, `"R"`) |
| `weight` | `int` | Trọng số (mặc định `1`) |
| `is_active` | `bool` | Trạng thái hoạt động (mặc định `True`) |

**Phương thức quan trọng:**
- `get_other(station)`: Cho một đầu mút, trả về đầu mút còn lại

### Lớp `SubwayNetwork` (`core/models.py:113`)

Biểu diễn toàn bộ mạng lưới MRT dưới dạng **đồ thị vô hướng có trọng số**.

| Thuộc tính | Kiểu | Mô tả |
|------------|------|-------|
| `stations` | `dict[str, Station]` | Ánh xạ mã ga → đối tượng Station |
| `adjacency_list` | `dict[str, list[Connection]]` | Danh sách kề: mã ga → danh sách kết nối |

**Lưu ý quan trọng:** Mỗi `Connection` xuất hiện trong danh sách kề của **cả hai** ga (đồ thị vô hướng). Khi đếm kết nối, cần chia đôi hoặc dùng `id(connection)` để loại trùng.

#### Các phương thức quản lý

| Phương thức | Mô tả |
|-------------|-------|
| `add_station(station)` | Thêm ga vào mạng lưới |
| `get_station(station_id)` | Tìm ga theo mã (trả về `None` nếu không tìm thấy) |
| `add_connection(a_id, b_id, line, weight)` | Thêm kết nối hai chiều |
| `get_all_stations()` | Trả về danh sách tất cả ga |
| `get_stations_by_line(line)` | Lọc ga theo tuyến |
| `get_active_connections(station_id)` | Lấy các kết nối đang hoạt động |
| `get_network_status()` | Thống kê mạng lưới (tổng/hoạt động/đóng) |

#### Các phương thức quản trị

| Phương thức | Mô tả |
|-------------|-------|
| `disable_station(id)` | Đóng ga + tất cả kết nối liên quan |
| `enable_station(id)` | Mở ga + chỉ mở kết nối mà đầu kia cũng đang hoạt động |
| `disable_line(line)` | Đóng tất cả kết nối trên một tuyến |
| `enable_line(line)` | Mở tất cả kết nối trên một tuyến |
| `disable_connection(a_id, b_id)` | Đóng một kết nối cụ thể |
| `enable_connection(a_id, b_id)` | Mở một kết nối cụ thể |

**Lưu ý về `enable_station()`:** Khi mở lại một ga, chỉ các kết nối mà ga ở đầu kia cũng đang hoạt động mới được mở lại. Điều này tránh vô tình mở lại các kết nối đã bị vô hiệu hóa độc lập.

---

## Xử Lý Ga Trung Chuyển

### Vấn đề

Trong dữ liệu JSON, một ga vật lý có thể xuất hiện với nhiều mã ID khác nhau trên các tuyến khác nhau. Ví dụ ga "Taipei Main Station" có:
- `R22` trên Tuyến Đỏ
- `BL12` trên Tuyến Xanh Dương

### Giải pháp: `TRANSFER_ID_MAP`

File `utils/data_loader.py` định nghĩa bảng ánh xạ `TRANSFER_ID_MAP` để gộp các ID thay thế sang một ID chính thức duy nhất:

```python
TRANSFER_ID_MAP = {
    "BR24": "BL23",  # Triển lãm Nam Cảng (BR + BL)
    "BR10": "BL15",  # Trung Hiếu Phục Hưng (BR + BL)
    "BR11": "G04",   # Nam Kinh Phục Hưng (BR + G)
    "R22":  "BL12",  # Đài Bắc (R + BL)
    "R21":  "G06",   # Trung Sơn (R + G)
    "R24":  "G10",   # Tưởng Giới Thạch (R + G)
    "R19":  "O11",   # Dân Quyền Tây (R + O)
    "R25":  "O06",   # Đông Môn (R + O)
    "G08":  "BL11",  # Tây Môn (G + BL)
    "G05":  "O08",   # Tùng Giang Nam Kinh (G + O)
    "G11":  "O05",   # Cổ Đình (G + O)
    "O07":  "BL14",  # Trung Hiếu Tân Sinh (BL + O)
}
```

**Kết quả:** 12 cặp ánh xạ → ~100 ga duy nhất (từ ~130 ga thô trong JSON).

Khi nạp dữ liệu:
1. Mã ga thô được chuyển qua `resolve_station_id(raw_id)`
2. Nếu ga chính thức đã tồn tại → gộp tuyến mới vào `station.lines` và đánh dấu `is_transfer = True`
3. Kết nối có cả hai đầu ánh xạ về cùng một ga (vòng lặp tự thân) → bị bỏ qua

---

## Hằng Số Quan Trọng

| Hằng số | Giá trị | File | Mô tả |
|---------|---------|------|-------|
| `TRANSFER_COST` | `3` | `core/models.py:9` | Chi phí phạt khi đổi tuyến (tương đương 3 ga) |

Hằng số này được sử dụng bởi thuật toán Dijkstra khi hành khách chuyển từ tuyến này sang tuyến khác tại ga trung chuyển. Xem chi tiết tại [Thuật toán Dijkstra](algorithm.md).

---

[Tiếp: Thuật toán Dijkstra →](algorithm.md)
