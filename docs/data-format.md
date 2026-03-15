# Định Dạng Dữ Liệu JSON

[< Quay lại README](../README.md) | [< Hướng dẫn sử dụng](user-guide.md)

## Tổng Quan

Toàn bộ dữ liệu bản đồ MRT Đài Bắc được lưu trong file `data/mrt_map.json`. File này chứa 3 phần chính:

```json
{
  "lines": [...],
  "stations": [...],
  "connections": [...]
}
```

## Phần `lines` — Thông Tin Tuyến

Mỗi tuyến có 4 trường:

```json
{"id": "BR", "name": "Wenhu Line", "color": "brown", "number": 1}
```

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | `string` | Mã tuyến (BR, R, G, O, BL) |
| `name` | `string` | Tên tiếng Anh của tuyến |
| `color` | `string` | Tên màu (brown, red, green, orange, blue) |
| `number` | `int` | Số thứ tự tuyến (1-5) |

**Danh sách 5 tuyến:**

| # | Mã | Tên | Màu hiển thị |
|---|-----|------|-------------|
| 1 | BR | Wenhu Line | `#C48C31` |
| 2 | R | Tamsui-Xinyi Line | `#E3002C` |
| 3 | G | Songshan-Xindian Line | `#008659` |
| 4 | O | Zhonghe-Xinlu Line | `#F8B61C` |
| 5 | BL | Bannan Line | `#0070BD` |

## Phần `stations` — Danh Sách Ga

Mỗi ga có 7 trường:

```json
{
  "id": "BL12",
  "name": "Taipei Main Station",
  "lat": 25.0478,
  "lng": 121.5170,
  "lines": ["R", "BL"],
  "is_transfer": true,
  "is_terminal": false
}
```

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | `string` | Mã định danh duy nhất (VD: `BR01`, `R02`, `BL12`) |
| `name` | `string` | Tên ga tiếng Anh |
| `lat` | `float` | Vĩ độ GPS (VD: `25.0478`) |
| `lng` | `float` | Kinh độ GPS (VD: `121.5170`) |
| `lines` | `string[]` | Danh sách mã tuyến đi qua ga |
| `is_transfer` | `bool` | Ga trung chuyển (>= 2 tuyến) |
| `is_terminal` | `bool` | Ga đầu/cuối tuyến |

**Thống kê:**
- Tổng cộng ~130 ga thô trong JSON
- Sau khi gộp qua `TRANSFER_ID_MAP` → 108 ga duy nhất
- 12 ga trung chuyển (nằm trên 2 tuyến)
- Phạm vi tọa độ: Lat 24.9535 – 25.1690, Lng 121.4151 – 121.6167

### Số ga theo tuyến

| Tuyến | Số ga | Ga đầu/cuối |
|-------|-------|-------------|
| BR | 24 | BR01 (Taipei Zoo) |
| R | 27 | R02 (Tamsui), R30 (Xiangshan), R22A (Xinbeitou) |
| G | 20 | G01 (Songshan), G19 (Xindian), G03A (Xiaobitan) |
| O | 26 | O01 (Nanshijiao), O18 (Luzhou), O38 (Sanzhong) |
| BL | 23 | BL01 (Dingpu), BL23 (Nangang Exhibition Center) |

### Quy Ước Mã Ga

| Tiền tố | Tuyến | Ví dụ |
|---------|-------|-------|
| `BR` | Tuyến Nâu | BR01 → BR24 |
| `R` | Tuyến Đỏ | R02 → R30, R22A |
| `G` | Tuyến Xanh Lá | G01 → G19, G03A |
| `O` | Tuyến Cam | O01 → O38 |
| `BL` | Tuyến Xanh Dương | BL01 → BL23 |

**Lưu ý đặc biệt:**
- `R22A` (Xinbeitou) là ga nhánh nối từ R10 (Beitou)
- `G03A` (Xiaobitan) là ga nhánh nối từ G17 (Qizhang)
- Một số số bị bỏ qua (VD: R03, R09) do quy ước đánh số thực tế

## Phần `connections` — Danh Sách Kết Nối

Mỗi kết nối có 4 trường:

```json
{"station_a": "BR01", "station_b": "BR02", "line": "BR", "weight": 0.85}
```

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `station_a` | `string` | Mã ga đầu tiên |
| `station_b` | `string` | Mã ga thứ hai |
| `line` | `string` | Mã tuyến mà kết nối thuộc về |
| `weight` | `float` | Khoảng cách tính bằng km (VD: `0.85`, `1.20`, `2.50`) |

**Thống kê:** 115 kết nối, trọng số từ 0.30 km đến 3.40 km.

**Lưu ý:**
- Kết nối chỉ liệt kê **một chiều** trong JSON, nhưng hệ thống tự động tạo cả hai chiều khi nạp
- Trọng số là khoảng cách thực giữa các ga tính bằng km (không phải đồng nhất)

### Phân bố kết nối theo tuyến

| Tuyến | Số kết nối |
|-------|-----------|
| BR | 23 |
| R | 26 |
| G | 19 |
| O | 25 |
| BL | 22 |

## Bảng Ánh Xạ Ga Trung Chuyển

12 cặp ánh xạ trong `TRANSFER_ID_MAP` (`utils/data_loader.py`):

| ID thay thế | → ID chính | Tên ga | Tuyến |
|-------------|-----------|--------|-------|
| `BR24` | `BL23` | Nangang Exhibition Center | BR + BL |
| `BR10` | `BL15` | Zhongxiao Fuxing | BR + BL |
| `BR11` | `G04` | Nanjing Fuxing | BR + G |
| `R22` | `BL12` | Taipei Main Station | R + BL |
| `R21` | `G06` | Zhongshan | R + G |
| `R24` | `G10` | Chiang Kai-Shek Memorial Hall | R + G |
| `R19` | `O11` | Minquan West Road | R + O |
| `R25` | `O06` | Dongmen | R + O |
| `G08` | `BL11` | Ximen | G + BL |
| `G05` | `O08` | Songjiang Nanjing | G + O |
| `G11` | `O05` | Guting | G + O |
| `O07` | `BL14` | Zhongxiao Xinsheng | BL + O |

## Cách Mở Rộng Dữ Liệu

### Thêm ga mới

1. Thêm đối tượng ga vào mảng `stations` (bao gồm tọa độ GPS):
```json
{
  "id": "BR25",
  "name": "New Station",
  "lat": 25.0500,
  "lng": 121.5800,
  "lines": ["BR"],
  "is_transfer": false,
  "is_terminal": false
}
```

2. Thêm kết nối tương ứng vào mảng `connections` (với trọng số km):
```json
{"station_a": "BR24", "station_b": "BR25", "line": "BR", "weight": 1.20}
```

3. Nếu ga mới là ga đầu/cuối, đặt `"is_terminal": true`

### Thêm ga trung chuyển

1. Thêm ga với ID mới vào `stations`
2. Thêm ánh xạ vào `TRANSFER_ID_MAP` trong `utils/data_loader.py`:
```python
"NEW_ID": "EXISTING_ID",  # Tên ga (Tuyến A + Tuyến B)
```

### Tính trọng số kết nối

Trọng số là khoảng cách thực giữa 2 ga (km). Có thể tính bằng:
- Công thức Haversine từ tọa độ GPS (hàm `haversine()` trong `data_loader.py`)
- Tra cứu khoảng cách thực tế từ Taipei Metro

---

[< Quay lại README](../README.md)
