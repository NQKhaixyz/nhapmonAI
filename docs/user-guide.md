# Hướng Dẫn Sử Dụng

[< Quay lại README](../README.md) | [< Tham chiếu API](api-reference.md)

## Mục Lục

- [Giao diện dòng lệnh (CLI)](#giao-diện-dòng-lệnh-cli)
  - [Menu chính](#menu-chính)
  - [Chế độ người dùng](#chế-độ-người-dùng)
  - [Chế độ quản trị](#chế-độ-quản-trị)
- [Giao diện Web](#giao-diện-web)
  - [Trang tìm đường](#trang-tìm-đường)
  - [Bản đồ SVG tương tác](#bản-đồ-svg-tương-tác)
  - [Trang quản trị](#trang-quản-trị)

---

## Giao Diện Dòng Lệnh (CLI)

### Khởi chạy

```bash
python main.py
```

Hệ thống sẽ nạp dữ liệu MRT từ `data/mrt_map.json` và hiển thị thống kê.

### Menu Chính

```
========================================
  HỆ THỐNG ĐỊNH TUYẾN MRT ĐÀI BẮC
========================================
  [1] Người dùng  - Tìm đường đi
  [2] Quản trị    - Quản lý mạng lưới
  [3] Thoát
========================================
```

### Chế Độ Người Dùng

Nhập `1` tại menu chính để vào chế độ người dùng.

```
========================================
  MENU NGƯỜI DÙNG - Tìm Đường Đi
========================================
  [1] Tìm đường giữa hai ga
  [2] Danh sách tất cả các ga
  [3] Danh sách ga theo tuyến
  [4] Xem trạng thái mạng lưới
  [0] Quay lại menu chính
========================================
```

#### Tìm đường đi

1. Chọn `[1]`
2. Nhập ga xuất phát: có thể nhập **mã ga** (VD: `BL12`) hoặc **tên ga** (VD: `Taipei`)
3. Nếu nhập tên, hệ thống tìm kiếm (không phân biệt hoa/thường):
   - Tìm thấy 1 kết quả → tự động chọn
   - Tìm thấy nhiều → hiển thị danh sách để chọn
4. Nhập ga đích tương tự
5. Kết quả hiển thị chi tiết lộ trình theo từng đoạn tuyến

**Ví dụ kết quả:**

```
========================================
  ĐÃ TÌM THẤY ĐƯỜNG ĐI
========================================
Từ:  R02 - Tamsui
Đến: BL11 - Ximen

Tổng số ga:      21
Số lần đổi tuyến: 1
Tổng chi phí:     24

Chi tiết lộ trình:
────────────────────────────────────────
  [Tuyến Đỏ (Đạm Thủy-Tín Nghĩa)]
    R02 Tamsui
    R04 Hongshulin
    ...
    BL12 Taipei Main Station
  ~~~ Đổi sang Tuyến Xanh Dương (Bản Nam) ~~~
  [Tuyến Xanh Dương (Bản Nam)]
    BL12 Taipei Main Station
    BL11 Ximen
────────────────────────────────────────
```

#### Xem danh sách ga

- `[2]` Hiển thị tất cả ga với mã, tên, tuyến, trạng thái (HOẠT ĐỘNG/ĐÓNG CỬA)
- `[3]` Nhập mã tuyến (BR, R, G, O, BL) → hiển thị ga trên tuyến đó

#### Xem trạng thái mạng lưới

Chọn `[4]` để xem tổng quan: số ga, số kết nối, trạng thái hoạt động.

### Chế Độ Quản Trị

Nhập `2` tại menu chính để vào chế độ quản trị.

```
========================================
  MENU QUẢN TRỊ - Quản Lý Mạng Lưới
========================================
  [1] Xem trạng thái mạng lưới
  [2] Đóng cửa một ga
  [3] Mở lại một ga
  [4] Đóng một kết nối
  [5] Mở lại một kết nối
  [6] Đóng toàn bộ một tuyến
  [7] Mở lại toàn bộ một tuyến
  [8] Xem các phần tử đang đóng
  [9] Đặt lại tất cả (mở lại mọi thứ)
  [0] Quay lại menu chính
========================================
```

**Các thao tác:**

| Lệnh | Mô tả | Nhập liệu |
|-------|--------|-----------|
| `[2]` Đóng ga | Đóng ga + tất cả kết nối liên quan | Mã ga (VD: `BL12`) |
| `[3]` Mở ga | Mở ga + chỉ kết nối mà đầu kia cũng mở | Mã ga |
| `[4]` Đóng kết nối | Đóng kết nối giữa 2 ga | 2 mã ga |
| `[5]` Mở kết nối | Mở lại kết nối giữa 2 ga | 2 mã ga |
| `[6]` Đóng tuyến | Đóng tất cả kết nối trên tuyến | Mã tuyến (VD: `R`) |
| `[7]` Mở tuyến | Mở tất cả kết nối trên tuyến | Mã tuyến |
| `[8]` Xem đóng | Liệt kê ga/kết nối đang đóng | Không |
| `[9]` Đặt lại | Mở lại toàn bộ (cần xác nhận `c`) | Không |

---

## Giao Diện Web

### Khởi chạy

```bash
python web/app.py
```

Server chạy tại `http://localhost:5000`.

### Trang Tìm Đường

**URL:** http://localhost:5000

Giao diện gồm 3 phần chính:

1. **Thanh tìm kiếm** (bên trái): 2 ô nhập liệu với autocomplete
   - Nhập tên hoặc mã ga → gợi ý tự động
   - Nút "Tìm đường" để tìm lộ trình
   - Nút "Đảo ngược" để hoán đổi ga xuất phát/đích

2. **Kết quả lộ trình** (bên trái, phía dưới):
   - Tổng số ga, số lần đổi tuyến, tổng chi phí
   - Chi tiết từng đoạn tuyến với mã màu
   - Danh sách ga trong mỗi đoạn

3. **Bản đồ SVG** (bên phải): Bản đồ tương tác hiển thị toàn bộ mạng lưới

### Bản Đồ SVG Tương Tác

Bản đồ SVG (`map.js`, 919 dòng) hiển thị toàn bộ mạng lưới MRT với các tính năng:

#### Tương tác chuột

| Thao tác | Hành động |
|----------|----------|
| **Kéo chuột** | Di chuyển bản đồ (pan) |
| **Cuộn chuột** | Thu/phóng bản đồ (zoom) |
| **Rê chuột vào ga** | Hiển thị tooltip với tên ga và mã tuyến |
| **Nhấp vào ga** | Chọn ga làm điểm xuất phát hoặc đích |

#### Hiển thị lộ trình

Khi tìm được đường đi, bản đồ tự động:
- Tô sáng các ga và kết nối trên lộ trình
- Các phần không thuộc lộ trình bị mờ đi
- Mã màu theo tuyến tương ứng

#### Thông tin kỹ thuật

- ViewBox: `0 0 1400 1100`
- Tọa độ ga được mã hóa cứng trong `STATION_POSITIONS` (`map.js`)
- Mỗi ga hiển thị dưới dạng hình tròn: ga thường `r=5`, ga trung chuyển `r=7`
- Đường kết nối là đường thẳng `<line>` với màu theo tuyến
- Module xuất ra `window.mapModule` với các phương thức:
  - `mapModule.highlightRoute(stationIds, segments)` — tô sáng lộ trình
  - `mapModule.clearHighlight()` — xóa tô sáng
  - `mapModule.onStationClick(callback)` — đăng ký sự kiện nhấp ga

### Trang Quản Trị

**URL:** http://localhost:5000/admin

Giao diện quản trị gồm các phần:

#### 1. Thẻ thống kê (Statistics Cards)

Hiển thị ở đầu trang:
- Tổng số ga / Đang hoạt động / Đã đóng
- Tổng kết nối / Đang hoạt động / Đã đóng
- Thống kê theo từng tuyến

#### 2. Điều khiển ga (Station Controls)

- Dropdown chọn ga (nhóm theo tuyến)
- Nút "Đóng cửa ga" / "Mở lại ga"
- Danh sách ga đang đóng cửa

#### 3. Điều khiển tuyến (Line Controls)

- Dropdown chọn tuyến
- Nút "Đóng toàn bộ tuyến" / "Mở toàn bộ tuyến"

#### 4. Điều khiển kết nối (Connection Controls)

- 2 dropdown chọn ga A và ga B
- Nút "Đóng kết nối" / "Mở kết nối"
- Danh sách kết nối đang đóng

#### 5. Nút đặt lại

- "Đặt lại toàn bộ" — khôi phục mạng lưới về trạng thái ban đầu

#### Thông báo Toast

Mỗi thao tác quản trị hiển thị thông báo toast ở góc dưới bên phải:
- Xanh lá: thành công
- Đỏ: lỗi
- Tự động ẩn sau 3 giây

---

[Tiếp: Định dạng dữ liệu →](data-format.md)
