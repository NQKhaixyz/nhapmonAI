import json
import math
from pathlib import Path
from core.models import Station, SubwayNetwork


# Bảng ánh xạ ID ga trung chuyển
# Ánh xạ các ID thay thế sang ID chính thức để mỗi ga vật lý chỉ là MỘT nút trong đồ thị.
TRANSFER_ID_MAP = {
    # Ga Triển lãm Nam Cảng (BR + BL)
    "BR24": "BL23",
    # Ga Trung Hiếu Phục Hưng (BR + BL)
    "BR10": "BL15",
    # Ga Nam Kinh Phục Hưng (BR + G)
    "BR11": "G04",
    # Ga Đại An (BR + G) -- BR09 là ID chính
    # Ga Đài Bắc (R + BL)
    "R22": "BL12",
    # Ga Trung Sơn (R + G)
    "R21": "G06",
    # Ga Tưởng Giới Thạch (R + G)
    "R24": "G10",
    # Ga Dân Quyền Tây (R + O)
    "R19": "O11",
    # Ga Đông Môn (R + O)
    "R25": "O06",
    # Ga Tây Môn (G + BL)
    "G08": "BL11",
    # Ga Tùng Giang Nam Kinh (G + O)
    "G05": "O08",
    # Ga Cổ Đình (G + O)
    "G11": "O05",
    # Ga Trung Hiếu Tân Sinh (BL + O)
    "O07": "BL14",
}


def resolve_station_id(raw_id: str) -> str:
    """Chuyển đổi mã ga thô sang mã ga chính thức thông qua bảng ánh xạ trung chuyển."""
    return TRANSFER_ID_MAP.get(raw_id, raw_id)


def haversine(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    """
    Tính khoảng cách giữa hai tọa độ GPS theo công thức Haversine.

    Args:
        lat1: Vĩ độ của điểm thứ nhất (đơn vị: độ).
        lng1: Kinh độ của điểm thứ nhất (đơn vị: độ).
        lat2: Vĩ độ của điểm thứ hai (đơn vị: độ).
        lng2: Kinh độ của điểm thứ hai (đơn vị: độ).

    Returns:
        Khoảng cách giữa hai điểm tính bằng kilômét (km).
    """
    R = 6371.0  # Bán kính Trái Đất tính bằng km

    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)

    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2
    )
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def load_network(json_path: str = "data/mrt_map.json") -> SubwayNetwork:
    """
    Đọc dữ liệu bản đồ MRT từ file JSON và trả về đối tượng SubwayNetwork.

    Các bước:
        1. Đọc file JSON
        2. Tạo các đối tượng Station (gộp ga trung chuyển)
        3. Tạo các đối tượng Connection
        4. Trả về SubwayNetwork đã được xây dựng hoàn chỉnh

    Args:
        json_path: Đường dẫn đến file dữ liệu JSON.

    Returns:
        Đối tượng SubwayNetwork đã được xây dựng đầy đủ.

    Raises:
        FileNotFoundError: Nếu file JSON không tồn tại.
        json.JSONDecodeError: Nếu JSON bị lỗi cú pháp.
        ValueError: Nếu kiểm tra tính toàn vẹn dữ liệu thất bại.
    """
    # Bước 1: Đọc JSON
    path = Path(json_path)
    if not path.exists():
        raise FileNotFoundError(f"Không tìm thấy file dữ liệu: {json_path}")

    with open(path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    network = SubwayNetwork()

    # Bước 2: Nạp các ga
    for station_data in data["stations"]:
        raw_id = station_data["id"]
        canonical_id = resolve_station_id(raw_id)

        # Nếu ga chính thức đã tồn tại, gộp các tuyến
        # Giữ nguyên tọa độ của mục nhập đầu tiên (không ghi đè)
        existing = network.get_station(canonical_id)
        if existing is not None:
            for line in station_data.get("lines", []):
                if line not in existing.lines:
                    existing.lines.append(line)
            existing.is_transfer = True
            continue

        # Tạo ga mới với tọa độ GPS
        station = Station(
            id=canonical_id,
            name=station_data["name"],
            lines=station_data.get("lines", []),
            is_transfer=station_data.get("is_transfer", False),
            is_terminal=station_data.get("is_terminal", False),
            lat=station_data.get("lat"),
            lng=station_data.get("lng"),
        )
        network.add_station(station)

    # Bước 3: Nạp các kết nối
    for conn_data in data["connections"]:
        station_a_id = resolve_station_id(conn_data["station_a"])
        station_b_id = resolve_station_id(conn_data["station_b"])
        line = conn_data["line"]
        weight = float(conn_data.get("weight", 1.0))

        # Bỏ qua vòng lặp tự thân (xảy ra khi 2 ID ánh xạ cùng ga)
        if station_a_id == station_b_id:
            continue

        network.add_connection(station_a_id, station_b_id, line, weight)

    # Bước 4: Kiểm tra tính toàn vẹn
    _validate_network(network)

    return network


def _validate_network(network: SubwayNetwork) -> None:
    """
    Chạy kiểm tra tính toàn vẹn cơ bản trên mạng lưới đã nạp.
    Ném ValueError nếu có vấn đề nghiêm trọng (ga cô lập).
    """
    status = network.get_network_status()
    print(f"Loaded {status['total_stations']} stations, "
          f"{status['total_connections']} connections.")

    errors = []

    # Check for isolated stations (no connections)
    for sid, conns in network.adjacency_list.items():
        if len(conns) == 0:
            errors.append(f"Station {sid} has no connections (isolated node)")

    # Check transfer stations have multiple lines
    for station in network.stations.values():
        if station.is_transfer and len(station.lines) < 2:
            print(f"  WARNING: Transfer station {station.id} ({station.name}) "
                  f"only has {len(station.lines)} line(s)")

    if errors:
        for err in errors:
            print(f"  ERROR: {err}")
        raise ValueError(
            f"Integrity check failed with {len(errors)} error(s): "
            + "; ".join(errors)
        )
