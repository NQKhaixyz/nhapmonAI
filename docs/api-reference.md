# Tham Chiếu API

[< Quay lại README](../README.md) | [< Thuật toán](algorithm.md)

Tất cả API endpoint được phục vụ bởi Flask server tại `http://localhost:5000`. Các API trả về JSON với encoding UTF-8.

---

## Trang Giao Diện

### `GET /`

Trang chính — giao diện tìm đường đi với bản đồ Leaflet tương tác.

**Trả về:** HTML (render `index.html`)

### `GET /admin`

Trang quản trị — quản lý mạng lưới MRT.

**Trả về:** HTML (render `admin.html`)

---

## API Thông Tin

### `GET /api/stations`

Trả về danh sách tất cả các ga.

**Tham số truy vấn (tùy chọn):**

| Tham số | Kiểu | Mô tả |
|---------|------|-------|
| `line` | `string` | Lọc theo mã tuyến (VD: `?line=BL`) |

**Response `200`:**

```json
[
  {
    "id": "BL12",
    "name": "Taipei Main Station",
    "lines": ["R", "BL"],
    "is_transfer": true,
    "is_terminal": false,
    "is_active": true
  }
]
```

### `GET /api/lines`

Trả về thông tin tất cả các tuyến MRT.

**Response `200`:**

```json
{
  "BR": {"name": "Tuyến Nâu (Văn Hồ)", "color": "#C48C31", "number": 1},
  "R":  {"name": "Tuyến Đỏ (Đạm Thủy-Tín Nghĩa)", "color": "#E3002C", "number": 2},
  "G":  {"name": "Tuyến Xanh Lá (Tùng Sơn-Tân Điếm)", "color": "#008659", "number": 3},
  "O":  {"name": "Tuyến Cam (Trung Hòa-Tân Lô)", "color": "#F8B61C", "number": 4},
  "BL": {"name": "Tuyến Xanh Dương (Bản Nam)", "color": "#0070BD", "number": 5}
}
```

### `GET /api/graph`

Trả về toàn bộ dữ liệu đồ thị để hiển thị bản đồ Leaflet phía client. Bao gồm tọa độ GPS cho mỗi ga.

**Response `200`:**

```json
{
  "stations": [
    {
      "id": "BR01",
      "name": "Taipei Zoo",
      "lat": 24.9983,
      "lng": 121.5764,
      "lines": ["BR"],
      "is_transfer": false,
      "is_terminal": true,
      "is_active": true
    }
  ],
  "connections": [
    {
      "from": "BR01",
      "to": "BR02",
      "line": "BR",
      "is_active": true
    }
  ],
  "lines": {
    "BR": {"name": "Tuyến Nâu (Văn Hồ)", "color": "#C48C31", "number": 1}
  }
}
```

**Lưu ý:** Mỗi kết nối chỉ xuất hiện **một lần** (đã loại trùng lặp từ danh sách kề hai chiều).

---

## API Tìm Đường

### `POST /api/find-route`

Tìm đường đi ngắn nhất giữa hai ga.

**Request body (JSON):**

```json
{
  "start": "BR01",
  "end": "BL12"
}
```

**Response `200` (thành công):**

```json
{
  "success": true,
  "route": {
    "station_ids": ["BR01", "BR02", "...", "BL15", "...", "BL12"],
    "stations": [
      {"id": "BR01", "name": "Taipei Zoo", "lines": ["BR"]},
      {"id": "BL12", "name": "Taipei Main Station", "lines": ["R", "BL"]}
    ],
    "total_cost": 14.3,
    "num_transfers": 1,
    "num_stops": 12,
    "segments": [
      {
        "line": "BR",
        "line_name": "Tuyến Nâu (Văn Hồ)",
        "color": "#C48C31",
        "from_id": "BR01",
        "from_name": "Taipei Zoo",
        "to_id": "BL15",
        "to_name": "Zhongxiao Fuxing",
        "transport_mode": "metro",
        "stations": [
          {"id": "BR01", "name": "Taipei Zoo"},
          {"id": "BR02", "name": "Muzha"}
        ]
      },
      {
        "line": "BL",
        "line_name": "Tuyến Xanh Dương (Bản Nam)",
        "color": "#0070BD",
        "from_id": "BL15",
        "from_name": "Zhongxiao Fuxing",
        "to_id": "BL12",
        "to_name": "Taipei Main Station",
        "transport_mode": "metro",
        "stations": [
          {"id": "BL15", "name": "Zhongxiao Fuxing"},
          {"id": "BL14", "name": "Zhongxiao Xinsheng"},
          {"id": "BL13", "name": "Shandao Temple"},
          {"id": "BL12", "name": "Taipei Main Station"}
        ]
      }
    ]
  }
}
```

**Lưu ý:**
- `total_cost` là `float` (đơn vị km), bao gồm cả chi phí chuyển tuyến
- Mỗi segment có `transport_mode`: `"metro"` hoặc `"walking"`
- Phải sử dụng **ID chính thức** (canonical ID). VD: dùng `BL12` thay vì `R22` cho ga Taipei Main Station

**Response `400` (thiếu dữ liệu):**

```json
{
  "success": false,
  "error": "Vui lòng cung cấp cả ga xuất phát ('start') và ga đích ('end')."
}
```

**Response `404` (không tìm thấy ga hoặc đường đi):**

```json
{
  "success": false,
  "error": "Không tìm thấy ga xuất phát với mã 'XYZ'."
}
```

---

## API Trạng Thái Mạng Lưới

### `GET /api/network-status`

Trả về trạng thái tổng quan của mạng lưới và thông tin từng tuyến.

**Response `200`:**

```json
{
  "status": {
    "total_stations": 108,
    "active_stations": 106,
    "closed_stations": 2,
    "total_connections": 115,
    "active_connections": 113,
    "closed_connections": 2
  },
  "lines": {
    "BR": {
      "name": "Tuyến Nâu (Văn Hồ)",
      "color": "#C48C31",
      "number": 1,
      "stations": 24,
      "active_stations": 24
    }
  }
}
```

---

## API Quản Trị

Tất cả API quản trị sử dụng method `POST` và nhận dữ liệu JSON.

### `POST /api/admin/disable-station`

Vô hiệu hóa một ga và tất cả kết nối liên quan.

**Request:**
```json
{"station_id": "BL12"}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Đã vô hiệu hóa ga 'Taipei Main Station' (BL12)."
}
```

### `POST /api/admin/enable-station`

Kích hoạt lại một ga. Chỉ mở lại kết nối mà ga ở đầu kia cũng đang hoạt động.

**Request:**
```json
{"station_id": "BL12"}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Đã kích hoạt lại ga 'Taipei Main Station' (BL12)."
}
```

### `POST /api/admin/disable-line`

Vô hiệu hóa tất cả kết nối trên một tuyến.

**Request:**
```json
{"line": "R"}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Đã vô hiệu hóa 26 kết nối trên Tuyến Đỏ (Đạm Thủy-Tín Nghĩa).",
  "affected_connections": 26
}
```

### `POST /api/admin/enable-line`

Kích hoạt lại tất cả kết nối trên một tuyến.

**Request:**
```json
{"line": "R"}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Đã kích hoạt lại 26 kết nối trên Tuyến Đỏ (Đạm Thủy-Tín Nghĩa).",
  "affected_connections": 26
}
```

### `POST /api/admin/disable-connection`

Vô hiệu hóa kết nối giữa hai ga cụ thể.

**Request:**
```json
{
  "station_a": "BL11",
  "station_b": "BL12"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Đã vô hiệu hóa kết nối giữa 'Ximen' (BL11) và 'Taipei Main Station' (BL12)."
}
```

### `POST /api/admin/enable-connection`

Kích hoạt lại kết nối giữa hai ga cụ thể.

**Request:**
```json
{
  "station_a": "BL11",
  "station_b": "BL12"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "Đã kích hoạt lại kết nối giữa 'Ximen' (BL11) và 'Taipei Main Station' (BL12)."
}
```

### `POST /api/admin/reset`

Đặt lại toàn bộ mạng lưới — kích hoạt lại tất cả ga và kết nối.

**Request:** Không cần body.

**Response `200`:**
```json
{
  "success": true,
  "message": "Đã đặt lại toàn bộ mạng lưới về trạng thái ban đầu."
}
```

### `GET /api/admin/disabled`

Trả về danh sách các ga và kết nối đang bị vô hiệu hóa.

**Response `200`:**
```json
{
  "disabled_stations": [
    {
      "id": "BL12",
      "name": "Taipei Main Station",
      "lines": ["R", "BL"],
      "is_transfer": true,
      "is_terminal": false,
      "is_active": false
    }
  ],
  "disabled_connections": [
    {
      "from": "BL11",
      "from_name": "Ximen",
      "to": "BL12",
      "to_name": "Taipei Main Station",
      "line": "BL"
    }
  ]
}
```

---

## Tổng Kết API

| # | Method | Endpoint | Mô tả |
|---|--------|----------|-------|
| 1 | GET | `/` | Trang tìm đường (Leaflet map) |
| 2 | GET | `/admin` | Trang quản trị |
| 3 | GET | `/api/stations` | Danh sách ga (tùy chọn `?line=`) |
| 4 | GET | `/api/lines` | Thông tin tuyến |
| 5 | GET | `/api/graph` | Dữ liệu đồ thị (bao gồm lat/lng) |
| 6 | POST | `/api/find-route` | Tìm đường ngắn nhất |
| 7 | GET | `/api/network-status` | Trạng thái mạng lưới |
| 8 | POST | `/api/admin/disable-station` | Đóng ga |
| 9 | POST | `/api/admin/enable-station` | Mở ga |
| 10 | POST | `/api/admin/disable-line` | Đóng tuyến |
| 11 | POST | `/api/admin/enable-line` | Mở tuyến |
| 12 | POST | `/api/admin/disable-connection` | Đóng kết nối |
| 13 | POST | `/api/admin/enable-connection` | Mở kết nối |
| 14 | POST | `/api/admin/reset` | Đặt lại mạng lưới |
| 15 | GET | `/api/admin/disabled` | Liệt kê phần tử đang đóng |

---

[Tiếp: Hướng dẫn sử dụng -->](user-guide.md)
