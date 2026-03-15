# Thuật Toán Dijkstra Cải Tiến

[< Quay lại README](../README.md) | [< Kiến trúc](architecture.md)

## Tổng Quan

Hệ thống sử dụng thuật toán **Dijkstra cải tiến** để tìm đường đi ngắn nhất giữa hai ga. Điểm khác biệt so với Dijkstra cổ điển:

1. **Không gian trạng thái mở rộng**: `(station_id, arriving_line)` thay vì chỉ `station_id`
2. **Phạt chuyển tuyến**: Cộng thêm `TRANSFER_COST = 3` khi đổi tuyến
3. **Trọng số thực (km)**: Mỗi cạnh có trọng số `float` là khoảng cách thực tính bằng km
4. **Predecessor tracing**: Dùng bảng tiền nhiệm thay vì sao chép path tại mỗi bước
5. **Lọc trạng thái hoạt động**: Bỏ qua ga và kết nối bị vô hiệu hóa

## Tại Sao Cần Không Gian Trạng Thái Mở Rộng?

Trong Dijkstra cổ điển, mỗi đỉnh chỉ được thăm một lần. Nhưng trong bài toán MRT, chi phí đến một ga phụ thuộc vào **tuyến mà hành khách đang đi** khi đến ga đó.

**Ví dụ:** Ga Zhongshan (`G06`) là ga trung chuyển giữa Tuyến Đỏ (R) và Tuyến Xanh Lá (G).

- Nếu đến bằng Tuyến Đỏ: chi phí chuyển sang Tuyến Xanh = +3
- Nếu đến bằng Tuyến Xanh: tiếp tục trên Tuyến Xanh = +0

Do đó, `(G06, R)` và `(G06, G)` là hai trạng thái khác nhau trong không gian tìm kiếm.

## Cấu Trúc Dữ Liệu

### Hàng đợi ưu tiên (Min-Heap)

Mỗi phần tử trong hàng đợi là một tuple 4 thành phần:

```
(chi_phí, bộ_đếm, mã_ga, tuyến_đến)
```

| Thành phần | Kiểu | Mô tả |
|------------|------|-------|
| `chi_phí` | `float` | Tổng chi phí từ ga xuất phát đến ga hiện tại (km) |
| `bộ_đếm` | `int` | Bộ đếm tăng dần, dùng làm tiêu chí phụ khi cùng chi phí |
| `mã_ga` | `str` | Mã định danh ga hiện tại |
| `tuyến_đến` | `str \| None` | Tuyến mà hành khách đang đi khi đến ga này (`None` tại ga xuất phát) |

### Bảng tiền nhiệm (Predecessor Table)

```python
predecessors: dict[tuple[str, Optional[str]], tuple[tuple[str, Optional[str]], str] | None]
# state -> (prev_state, line_used) hoặc None (tại ga xuất phát)
```

Thay vì sao chép toàn bộ đường đi `path: list[str]` tại mỗi bước (tốn bộ nhớ O(V) cho mỗi trạng thái), hệ thống dùng bảng tiền nhiệm và truy vết ngược sau khi tìm thấy đích.

### Bảng chi phí tốt nhất

```python
best_cost: dict[tuple[str, Optional[str]], float]
# state -> chi phí tốt nhất đã biết
```

Dùng để tránh thêm trạng thái vào hàng đợi nếu đã có chi phí tốt hơn.

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
    priority_queue = [(0.0, 0, start_id, None)]
    visited = {}
    predecessors = {(start_id, None): None}
    best_cost = {(start_id, None): 0.0}

    while priority_queue không rỗng:
        (cost, _, current_id, current_line) = lấy phần tử nhỏ nhất

        // Đã đến đích?
        if current_id == end_id:
            path, lines = trace_path(predecessors, (current_id, current_line))
            return xây_dựng_kết_quả(path, lines, cost)

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

            // Tính chi phí (trọng số thực bằng km)
            edge_cost = connection.weight  // float, đơn vị km
            if current_line != None VÀ connection.line != current_line:
                edge_cost += TRANSFER_COST  // +3 cho đổi tuyến

            new_cost = cost + edge_cost
            new_state = (neighbor.id, connection.line)

            if new_state chưa trong visited VÀ new_cost < best_cost[new_state]:
                best_cost[new_state] = new_cost
                predecessors[new_state] = (state, connection.line)
                thêm (new_cost, counter++, neighbor.id, connection.line)
                vào priority_queue

    return None  // Không tìm được đường
```

## Truy Vết Đường Đi

Sau khi Dijkstra tìm được ga đích, hàm `_trace_path()` truy vết ngược từ bảng tiền nhiệm:

```python
def _trace_path(predecessors, end_state):
    path_ids = []
    segment_lines = []
    state = end_state

    while state is not None:
        station_id, _ = state
        path_ids.append(station_id)
        prev = predecessors[state]
        if prev is not None:
            _, line_used = prev
            segment_lines.append(line_used)
        state = prev[0] if prev else None

    path_ids.reverse()
    segment_lines.reverse()
    return path_ids, segment_lines
```

## Ví Dụ Minh Họa

### Tìm đường từ Taipei Zoo (`BR01`) đến Taipei Main Station (`BL12`)

**Lộ trình tối ưu:**
```
BR01 (Taipei Zoo) → ... → BL15 (Zhongxiao Fuxing) → ... → BL12 (Taipei Main Station)
      Tuyến Nâu                   đổi tuyến (+3)                Tuyến Xanh Dương
```

**Tính chi phí thực (km):**
- BR01 → BL15 (Zhongxiao Fuxing): ~9.3 km trên Tuyến Nâu
- Chuyển tuyến tại BL15: BR → BL = +3
- BL15 → BL12 (Taipei Main Station): ~2.0 km trên Tuyến Xanh Dương
- **Tổng: 9.3 + 3 + 2.0 = 14.3 km**

### Chi phí chuyển tuyến ảnh hưởng thế nào?

Với `TRANSFER_COST = 3` (tương đương ~3 km), thuật toán sẽ **ưu tiên** lộ trình ít đổi tuyến hơn khi chênh lệch khoảng cách <= 3 km. Điều này phản ánh thực tế: đổi tuyến mất thời gian chờ đợi và đi bộ giữa các sân ga.

## Xây Dựng Kết Quả

Sau khi truy vết đường đi, hàm `_reconstruct_result_from_segments()` thực hiện:

1. **Chuyển mã ga → đối tượng Station**: `path_ids` → `path_stations`
2. **Xác định tuyến từng đoạn**: Sử dụng `segment_lines` từ bảng tiền nhiệm
3. **Gộp đoạn liên tiếp cùng tuyến**: Các ga liên tiếp trên cùng một tuyến được gộp thành một "segment"
4. **Tính số lần đổi tuyến**: `num_transfers = len(segments) - 1`

### Cấu trúc kết quả trả về

```python
{
    "path": [Station, Station, ...],      # Danh sách đối tượng Station
    "station_ids": ["BR01", "BR02", ...], # Danh sách mã ga
    "total_cost": 14.3,                   # Tổng chi phí (float, km)
    "num_transfers": 1,                   # Số lần đổi tuyến
    "lines_used": [                       # Các đoạn tuyến đã đi
        {"line": "BR", "from": "BR01", "to": "BL15", "transport_mode": "metro"},
        {"line": "BL", "from": "BL15", "to": "BL12", "transport_mode": "metro"},
    ],
    "num_stops": 12,                      # Số ga đi qua (không tính ga xuất phát)
}
```

## Độ Phức Tạp

| Đại lượng | Giá trị |
|-----------|---------|
| V (số đỉnh) | ~108 ga x số tuyến tại mỗi ga ~ 120 trạng thái |
| E (số cạnh) | ~115 kết nối x 2 (vô hướng) = 230 |
| Thời gian | O((V + E) log V) ~ rất nhanh với quy mô nhỏ |
| Bộ nhớ | O(V) cho visited + O(V) cho hàng đợi + O(V) cho predecessors |

Với quy mô mạng lưới MRT Đài Bắc (~108 ga), thuật toán chạy gần như tức thì (< 1ms).

---

[Tiếp: Tham chiếu API -->](api-reference.md)
