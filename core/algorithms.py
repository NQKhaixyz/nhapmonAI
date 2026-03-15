"""
Mô-đun chứa thuật toán tìm đường đi ngắn nhất cho hệ thống định tuyến MRT Đài Bắc.

Sử dụng thuật toán Dijkstra cải tiến với:
- Lọc trạng thái hoạt động: bỏ qua các ga và kết nối bị vô hiệu hóa.
- Phạt chuyển tuyến: cộng thêm chi phí TRANSFER_COST khi đổi tuyến tại ga trung chuyển.

Không gian trạng thái là các cặp (station_id, arriving_line) vì chi phí chuyển tuyến
phụ thuộc vào tuyến mà hành khách đang đi khi đến ga hiện tại.
"""

import heapq
from typing import Optional

from .models import SubwayNetwork, Station, TRANSFER_COST


def find_shortest_path(
    network: SubwayNetwork, start_id: str, end_id: str
) -> Optional[dict]:
    """
    Tìm đường đi ngắn nhất giữa hai ga sử dụng thuật toán Dijkstra cải tiến.

    Thuật toán mở rộng Dijkstra cổ điển bằng cách theo dõi tuyến hiện tại
    mà hành khách đang đi. Khi chuyển sang một kết nối thuộc tuyến khác,
    chi phí chuyển tuyến (TRANSFER_COST) sẽ được cộng thêm vào tổng chi phí.

    Args:
        network: Đồ thị mạng lưới MRT.
        start_id: Mã ga xuất phát.
        end_id: Mã ga đích.

    Returns:
        dict chứa:
            - "path": danh sách các đối tượng Station theo thứ tự
            - "station_ids": danh sách mã ga
            - "total_cost": tổng chi phí di chuyển
            - "num_transfers": số lần đổi tuyến
            - "lines_used": danh sách các đoạn tuyến đã đi
            - "num_stops": số ga đã đi qua (không tính ga xuất phát)
        Hoặc None nếu không tìm được đường đi.
    """
    # --- Kiểm tra điều kiện đầu vào ---

    # Kiểm tra ga xuất phát có tồn tại và đang hoạt động không
    start_station = network.get_station(start_id)
    if start_station is None or not start_station.is_active:
        return None

    # Kiểm tra ga đích có tồn tại và đang hoạt động không
    end_station = network.get_station(end_id)
    if end_station is None or not end_station.is_active:
        return None

    # Trường hợp đặc biệt: ga xuất phát trùng ga đích
    if start_id == end_id:
        return {
            "path": [start_station],
            "station_ids": [start_id],
            "total_cost": 0,
            "num_transfers": 0,
            "lines_used": [],
            "num_stops": 0,
        }

    # --- Khởi tạo thuật toán Dijkstra cải tiến ---

    # Bộ đếm dùng làm tiêu chí phụ khi hai phần tử có cùng chi phí
    counter = 0

    # Hàng đợi ưu tiên: (chi_phí, bộ_đếm, mã_ga, tuyến_đến)
    # tuyến_đến là None tại ga xuất phát vì chưa đi trên tuyến nào
    priority_queue: list[tuple[int, int, str, Optional[str]]] = []
    heapq.heappush(priority_queue, (0, counter, start_id, None))

    # Tập hợp các trạng thái đã thăm: (mã_ga, tuyến_đến)
    # Theo dõi cả tuyến đến để phân biệt các trạng thái khác nhau tại cùng một ga
    visited: set[tuple[str, Optional[str]]] = set()

    # Bảng tiền nhiệm: state -> (prev_state, line_used)
    # Dùng để truy vết đường đi thay vì sao chép toàn bộ đường đi tại mỗi bước
    predecessors: dict[tuple[str, Optional[str]], tuple[tuple[str, Optional[str]], str] | None] = {}
    start_state = (start_id, None)
    predecessors[start_state] = None

    # --- Vòng lặp chính của Dijkstra ---
    while priority_queue:
        # Lấy trạng thái có chi phí nhỏ nhất từ hàng đợi
        current_cost, _, current_id, current_line = heapq.heappop(
            priority_queue
        )

        # Kiểm tra đã đến ga đích chưa
        if current_id == end_id:
            # Truy vết đường đi từ bảng tiền nhiệm
            path_ids, segment_lines = _trace_path(
                predecessors, (current_id, current_line)
            )
            return _reconstruct_result_from_segments(
                network, path_ids, segment_lines, current_cost
            )

        # Bỏ qua nếu trạng thái này đã được thăm
        state = (current_id, current_line)
        if state in visited:
            continue
        visited.add(state)

        # Duyệt qua tất cả kết nối liền kề của ga hiện tại
        for connection in network.adjacency_list.get(current_id, []):
            # Bỏ qua kết nối bị vô hiệu hóa
            if not connection.is_active:
                continue

            # Xác định ga láng giềng
            neighbor = connection.get_other(network.stations[current_id])

            # Bỏ qua ga láng giềng bị vô hiệu hóa
            if not neighbor.is_active:
                continue

            # Tính chi phí di chuyển đến ga láng giềng
            edge_cost = connection.weight

            # Cộng thêm chi phí chuyển tuyến nếu đổi từ tuyến khác
            # (chỉ tính khi đã đang đi trên một tuyến cụ thể)
            if current_line is not None and connection.line != current_line:
                edge_cost += TRANSFER_COST

            new_cost = current_cost + edge_cost
            new_line = connection.line
            neighbor_state = (neighbor.id, new_line)

            # Chỉ thêm vào hàng đợi nếu trạng thái chưa được thăm
            if neighbor_state not in visited:
                counter += 1
                # Lưu tiền nhiệm nếu chưa có (lần đầu phát hiện luôn là tối ưu
                # trong Dijkstra khi trạng thái chưa bị thăm)
                if neighbor_state not in predecessors:
                    predecessors[neighbor_state] = (state, new_line)
                heapq.heappush(
                    priority_queue,
                    (new_cost, counter, neighbor.id, new_line),
                )

    # Không tìm được đường đi giữa hai ga
    return None


def _trace_path(
    predecessors: dict, end_state: tuple[str, Optional[str]]
) -> tuple[list[str], list[str]]:
    """
    Truy vết đường đi từ bảng tiền nhiệm.

    Returns:
        Tuple gồm:
            - path_ids: Danh sách mã ga theo thứ tự từ ga xuất phát đến ga đích.
            - segment_lines: Danh sách tuyến sử dụng cho mỗi đoạn liên tiếp
              (len = len(path_ids) - 1).
    """
    path_states = []
    current = end_state
    while current is not None:
        path_states.append(current)
        pred = predecessors.get(current)
        if pred is None:
            break
        current = pred[0]  # prev_state

    path_states.reverse()
    path_ids = [s[0] for s in path_states]

    # Trích xuất tuyến sử dụng cho mỗi bước di chuyển
    segment_lines = []
    for i in range(1, len(path_states)):
        pred_info = predecessors[path_states[i]]
        segment_lines.append(pred_info[1])  # line_used

    return path_ids, segment_lines


def _reconstruct_result_from_segments(
    network: SubwayNetwork,
    path_ids: list[str],
    segment_lines: list[str],
    total_cost: int,
) -> dict:
    """
    Xây dựng kết quả từ danh sách mã ga và tuyến đã xác định bởi Dijkstra.

    Sử dụng thông tin tuyến chính xác từ thuật toán tìm đường thay vì
    đoán lại từ danh sách kề, tránh lỗi chọn sai tuyến ở ga đa tuyến.

    Args:
        network: Đồ thị mạng lưới MRT.
        path_ids: Danh sách mã ga theo thứ tự đã đi qua.
        segment_lines: Danh sách tuyến sử dụng cho mỗi đoạn liên tiếp.
        total_cost: Tổng chi phí di chuyển đã tính bởi Dijkstra.

    Returns:
        dict chứa thông tin chi tiết về đường đi tìm được.
    """
    path_stations: list[Station] = [
        network.stations[sid] for sid in path_ids
    ]

    # Gộp các đoạn liên tiếp cùng tuyến
    merged_segments: list[dict[str, str]] = []
    for i, line in enumerate(segment_lines):
        if not merged_segments or merged_segments[-1]["line"] != line:
            merged_segments.append(
                {
                    "line": line,
                    "from": path_ids[i],
                    "to": path_ids[i + 1],
                }
            )
        else:
            merged_segments[-1]["to"] = path_ids[i + 1]

    num_transfers = max(0, len(merged_segments) - 1)

    return {
        "path": path_stations,
        "station_ids": path_ids,
        "total_cost": total_cost,
        "num_transfers": num_transfers,
        "lines_used": merged_segments,
        "num_stops": len(path_ids) - 1,
    }


def _reconstruct_result(
    network: SubwayNetwork, path_ids: list[str], total_cost: int
) -> dict:
    """
    Xây dựng kết quả từ danh sách mã ga đã đi qua.

    Phân tích đường đi để xác định các đoạn tuyến được sử dụng,
    gộp các đoạn liên tiếp cùng tuyến thành một đoạn duy nhất,
    và tính số lần đổi tuyến.

    Args:
        network: Đồ thị mạng lưới MRT.
        path_ids: Danh sách mã ga theo thứ tự đã đi qua.
        total_cost: Tổng chi phí di chuyển đã tính bởi Dijkstra.

    Returns:
        dict chứa thông tin chi tiết về đường đi tìm được.
    """
    # Xây dựng danh sách đối tượng Station từ danh sách mã ga
    path_stations: list[Station] = [
        network.stations[sid] for sid in path_ids
    ]

    # --- Xác định tuyến sử dụng cho từng đoạn liên tiếp ---
    # Duyệt qua từng cặp ga liên tiếp để tìm tuyến của kết nối giữa chúng
    segment_lines: list[str] = []
    for i in range(len(path_ids) - 1):
        from_id = path_ids[i]
        to_id = path_ids[i + 1]
        segment_line = _find_connection_line(network, from_id, to_id)
        segment_lines.append(segment_line)

    # --- Gộp các đoạn liên tiếp cùng tuyến ---
    # Mỗi đoạn gộp chứa tên tuyến, ga bắt đầu và ga kết thúc
    merged_segments: list[dict[str, str]] = []
    for i, line in enumerate(segment_lines):
        if not merged_segments or merged_segments[-1]["line"] != line:
            # Bắt đầu đoạn mới vì tuyến thay đổi hoặc đây là đoạn đầu tiên
            merged_segments.append(
                {
                    "line": line,
                    "from": path_ids[i],
                    "to": path_ids[i + 1],
                }
            )
        else:
            # Mở rộng đoạn hiện tại vì vẫn cùng tuyến
            merged_segments[-1]["to"] = path_ids[i + 1]

    # Số lần đổi tuyến = số đoạn tuyến - 1
    num_transfers = max(0, len(merged_segments) - 1)

    return {
        "path": path_stations,
        "station_ids": path_ids,
        "total_cost": total_cost,
        "num_transfers": num_transfers,
        "lines_used": merged_segments,
        "num_stops": len(path_ids) - 1,
    }


def _find_connection_line(
    network: SubwayNetwork, from_id: str, to_id: str
) -> str:
    """
    Tìm tên tuyến của kết nối đang hoạt động giữa hai ga liền kề.

    Duyệt qua danh sách kề của ga xuất phát để tìm kết nối
    đang hoạt động nối đến ga đích.

    Args:
        network: Đồ thị mạng lưới MRT.
        from_id: Mã ga xuất phát.
        to_id: Mã ga đích.

    Returns:
        Tên tuyến của kết nối tìm được.

    Raises:
        ValueError: Nếu không tìm thấy kết nối hoạt động giữa hai ga.
    """
    for connection in network.adjacency_list.get(from_id, []):
        if not connection.is_active:
            continue
        other = connection.get_other(network.stations[from_id])
        if other.id == to_id:
            return connection.line

    # Không tìm thấy kết nối hoạt động giữa hai ga
    raise ValueError(
        f"Không tìm thấy kết nối hoạt động giữa ga '{from_id}' và '{to_id}'"
    )
