# Thuật Toán Dijkstra Cải Tiến

[< Quay lại README](../README.md) | [< Kiến trúc](architecture.md)

## Tổng Quan

Hệ thống sử dụng thuật toán **Dijkstra cải tiến** để tìm đường đi ngắn nhất giữa hai ga. Điểm khác biệt so với Dijkstra cổ điển:

1. **Không gian trạng thái mở rộng**: `(station_id, arriving_line)` thay vì chỉ `station_id`
2. **Phạt chuyển tuyến**: Cộng thêm `TRANSFER_COST = 3` khi đổi tuyến
3. **Lọc trạng thái hoạt động**: Bỏ qua ga và kết nối bị vô hiệu hóa

## Tại Sao Cần Không Gian Trạng Thái Mở Rộng?

Trong Dijkstra cổ điển, mỗi đỉnh chỉ được thăm một lần. Nhưng trong bài toán MRT, chi phí đến một ga phụ thuộc vào **tuyến mà hành khách đang đi** khi đến ga đó.

**Ví dụ:** Ga Zhongshan (`G06`) là ga trung chuyển giữa Tuyến Đỏ (R) và Tuyến Xanh Lá (G).

- Nếu đến bằng Tuyến Đỏ: chi phí chuyển sang Tuyến Xanh = +3
- Nếu đến bằng Tuyến Xanh: tiếp tục trên Tuyến Xanh = +0

Do đó, `(G06, R)` và `(G06, G)` là hai trạng thái khác nhau trong không gian tìm kiếm.

## Cấu Trúc Dữ Liệu

### Hàng đợi ưu tiên (Min-Heap)

Mỗi phần tử trong hàng đợi là một tuple 5 thành phần:

```
(chi_phí, bộ_đếm, mã_ga, tuyến_đến, đường_đi)
```

| Thành phần | Kiểu | Mô tả |
|------------|------|-------|
| `chi_phí` | `int` | Tổng chi phí từ ga xuất phát đến ga hiện tại |
| `bộ_đếm` | `int` | Bộ đếm tăng dần, dùng làm tiêu chí phụ khi cùng chi phí |
| `mã_ga` | `str` | Mã định danh ga hiện tại |
| `tuyến_đến` | `str \| None` | Tuyến mà hành khách đang đi khi đến ga này (`None` tại ga xuất phát) |
| `đường_đi` | `list[str]` | Danh sách mã ga đã đi qua theo thứ tự |

### Tập hợp đã thăm

```python
visited: set[tuple[str, Optional[str]]]
# Ví dụ: {("BL12", "BL"), ("BL12", "R"), ("G06", None)}
```

## Mã Giả Thuật Toán

```
function dijkstra_mrt(network, start_id, end_id):
    // Kiểm tra đầu vào
    if start_id hoặc end_id không tồn tại hoặc bị đóng:
        return None
    if start_id == end_id:
        return kết_quả_trực_tiếp

    // Khởi tạo
    priority_queue = [(0, 0, start_id, None, [start_id])]
    visited = {}

    while priority_queue không rỗng:
        (cost, _, current_id, current_line, path) = lấy phần tử nhỏ nhất

        // Đã đến đích?
        if current_id == end_id:
            return xây_dựng_kết_quả(path, cost)

        // Đã thăm trạng thái này?
        state = (current_id, current_line)
        if state trong visited:
            continue
        thêm state vào visited

        // Duyệt các kết nối liền kề
        for connection trong adjacency_list[current_id]:
            if connection bị vô hiệu hóa:
                continue

            neighbor = connection.get_other(current_id)
            if neighbor bị vô hiệu hóa:
                continue

            // Tính chi phí
            edge_cost = connection.weight
            if current_line != None VÀ connection.line != current_line:
                edge_cost += TRANSFER_COST    // +3 cho đổi tuyến

            new_cost = cost + edge_cost
            new_state = (neighbor.id, connection.line)

            if new_state chưa trong visited:
                thêm (new_cost, counter++, neighbor.id, connection.line, path + [neighbor.id])
                vào priority_queue

    return None  // Không tìm được đường
```

## Ví Dụ Minh Họa

### Tìm đường từ Tamsui (`R02`) đến Ximen (`BL11`)

**Lộ trình tối ưu:**
```
R02 (Tamsui) → ... → R22/BL12 (Taipei Main Station) → BL11 (Ximen)
         Tuyến Đỏ                  đổi tuyến (+3)        Tuyến Xanh Dương
```

**Tính chi phí:**
- R02 → BL12 (Taipei Main Station): 20 ga trên Tuyến Đỏ = chi phí 20
- Chuyển tuyến tại BL12: R → BL = +3
- BL12 → BL11 (Ximen): 1 ga trên Tuyến Xanh Dương = chi phí 1
- **Tổng: 20 + 3 + 1 = 24**

### Chi phí chuyển tuyến ảnh hưởng thế nào?

Với `TRANSFER_COST = 3`, thuật toán sẽ **ưu tiên** lộ trình ít đổi tuyến hơn khi chênh lệch khoảng cách <= 3 ga. Điều này phản ánh thực tế: đổi tuyến mất thời gian chờ đợi và đi bộ.

## Xây Dựng Kết Quả

Sau khi tìm được đường đi, hàm `_reconstruct_result()` thực hiện:

1. **Chuyển mã ga → đối tượng Station**: `path_ids` → `path_stations`
2. **Xác định tuyến từng đoạn**: Duyệt từng cặp ga liên tiếp, tìm kết nối hoạt động giữa chúng (`_find_connection_line()`)
3. **Gộp đoạn liên tiếp cùng tuyến**: Các ga liên tiếp trên cùng một tuyến được gộp thành một "segment"
4. **Tính số lần đổi tuyến**: `num_transfers = len(segments) - 1`

### Cấu trúc kết quả trả về

```python
{
    "path": [Station, Station, ...],      # Danh sách đối tượng Station
    "station_ids": ["R02", "R04", ...],   # Danh sách mã ga
    "total_cost": 24,                     # Tổng chi phí
    "num_transfers": 1,                   # Số lần đổi tuyến
    "lines_used": [                       # Các đoạn tuyến
        {"line": "R", "from": "R02", "to": "BL12"},
        {"line": "BL", "from": "BL12", "to": "BL11"},
    ],
    "num_stops": 21,                      # Số ga đi qua (không tính ga xuất phát)
}
```

## Độ Phức Tạp

| Đại lượng | Giá trị |
|-----------|---------|
| V (số đỉnh) | ~100 ga x số tuyến tại mỗi ga ≈ 120 trạng thái |
| E (số cạnh) | ~117 kết nối x 2 (vô hướng) ≈ 234 |
| Thời gian | O((V + E) log V) ≈ rất nhanh với quy mô nhỏ |
| Bộ nhớ | O(V) cho visited + O(V) cho hàng đợi |

Với quy mô mạng lưới MRT Đài Bắc (~100 ga), thuật toán chạy gần như tức thì (< 1ms).

---

[Tiếp: Tham chiếu API →](api-reference.md)
