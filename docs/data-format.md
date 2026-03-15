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

| # | Mã | Tên | Màu |
|---|-----|------|------|
| 1 | BR | Wenhu Line | brown |
| 2 | R | Tamsui-Xinyi Line | red |
| 3 | G | Songshan-Xindian Line | green |
| 4 | O | Zhonghe-Xinlu Line | orange |
| 5 | BL | Bannan Line | blue |

## Phần `stations` — Danh Sách Ga

Mỗi ga có 5 trường:

```json
{
  "id": "BL12",
  "name": "Taipei Main Station",
  "lines": ["R", "BL"],
  "is_transfer": true,
  "is_terminal": false
}
```

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `id` | `string` | Mã định danh duy nhất (VD: `BR01`, `R02`, `BL12`) |
| `name` | `string` | Tên ga tiếng Anh |
| `lines` | `string[]` | Danh sách mã tuyến đi qua ga |
| `is_transfer` | `bool` | Ga trung chuyển (>= 2 tuyến) |
| `is_terminal` | `bool` | Ga đầu/cuối tuyến |

**Thống kê:**
- Tổng cộng ~130 ga thô trong JSON
- Sau khi gộp qua `TRANSFER_ID_MAP` → ~100 ga duy nhất
- 12 ga trung chuyển (nằm trên 2 tuyến)
- Các ga đầu/cuối: BR01, BL01, BL23, R02, R30, R22A, G01, G19, G03A, O01, O18, O38

### Quy Ước Mã Ga

| Tiền tố | Tuyến | Ví dụ |
|---------|-------|-------|
| `BR` | Tuyến Nâu | BR01 → BR24 (24 ga) |
| `R` | Tuyến Đỏ | R02 → R30, R22A (28 ga) |
| `G` | Tuyến Xanh Lá | G01 → G19, G03A (20 ga) |
| `O` | Tuyến Cam | O01 → O38 (28 ga) |
| `BL` | Tuyến Xanh Dương | BL01 → BL23 (23 ga) |

**Lưu ý đặc biệt:**
- `R22A` (Xinbeitou) là ga nhánh nối từ R10 (Beitou)
- `G03A` (Xiaobitan) là ga nhánh nối từ G17 (Qizhang)
- Một số số bị bỏ qua (VD: R03, R09, R26, O14, O19, O20) do quy ước đánh số thực tế

## Phần `connections` — Danh Sách Kết Nối

Mỗi kết nối có 4 trường:

```json
{"station_a": "BR01", "station_b": "BR02", "line": "BR", "weight": 1}
```

| Trường | Kiểu | Mô tả |
|--------|------|-------|
| `station_a` | `string` | Mã ga đầu tiên |
| `station_b` | `string` | Mã ga thứ hai |
| `line` | `string` | Mã tuyến mà kết nối thuộc về |
| `weight` | `int` | Trọng số (mặc định `1`, tương đương 1 đoạn ga) |

**Thống kê:** ~117 kết nối (mỗi kết nối là 1 đoạn đường ray giữa 2 ga liền kề).

**Lưu ý:**
- Kết nối chỉ liệt kê **một chiều** trong JSON, nhưng hệ thống tự động tạo cả hai chiều khi nạp
- Tất cả trọng số hiện tại đều bằng `1` (có thể mở rộng để phản ánh khoảng cách thực tế)

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

**Lưu ý:** Ga `BR09` (Daan) có `lines: ["BR", "G"]` trực tiếp trong JSON nên không cần ánh xạ.

## Cách Mở Rộng Dữ Liệu

### Thêm ga mới

1. Thêm đối tượng ga vào mảng `stations`:
```json
{"id": "BR25", "name": "New Station", "lines": ["BR"], "is_transfer": false, "is_terminal": false}
```

2. Thêm kết nối tương ứng vào mảng `connections`:
```json
{"station_a": "BR24", "station_b": "BR25", "line": "BR", "weight": 1}
```

3. Nếu ga mới là ga đầu/cuối, đặt `"is_terminal": true`

### Thêm ga trung chuyển

1. Thêm ga với ID mới vào `stations`
2. Thêm ánh xạ vào `TRANSFER_ID_MAP` trong `utils/data_loader.py`:
```python
"NEW_ID": "EXISTING_ID",  # Tên ga (Tuyến A + Tuyến B)
```

### Thay đổi trọng số

Thay `"weight": 1` bằng giá trị khác để phản ánh khoảng cách thực tế (VD: phút di chuyển):
```json
{"station_a": "BR01", "station_b": "BR02", "line": "BR", "weight": 3}
```

---

[< Quay lại README](../README.md)
