from core.models import SubwayNetwork


LINE_NAMES = {
    "BR": "Tuyến Nâu (Văn Hồ)",
    "R": "Tuyến Đỏ (Đạm Thủy-Tín Nghĩa)",
    "G": "Tuyến Xanh Lá (Tùng Sơn-Tân Điếm)",
    "O": "Tuyến Cam (Trung Hòa-Tân Lô)",
    "BL": "Tuyến Xanh Dương (Bản Nam)",
}


def run_admin_cli(network: SubwayNetwork) -> None:
    """Vòng lặp chính giao diện quản trị viên."""
    while True:
        print("=" * 40)
        print("  MENU QUẢN TRỊ - Quản Lý Mạng Lưới")
        print("=" * 40)
        print("  [1] Xem trạng thái mạng lưới")
        print("  [2] Đóng cửa một ga")
        print("  [3] Mở lại một ga")
        print("  [4] Đóng một kết nối")
        print("  [5] Mở lại một kết nối")
        print("  [6] Đóng toàn bộ một tuyến")
        print("  [7] Mở lại toàn bộ một tuyến")
        print("  [8] Xem các phần tử đang đóng")
        print("  [9] Đặt lại tất cả (mở lại mọi thứ)")
        print("  [0] Quay lại menu chính")
        print("=" * 40)

        choice = input("Lựa chọn của bạn: ").strip()

        if choice == "1":
            view_network_status(network)
        elif choice == "2":
            disable_station_flow(network)
        elif choice == "3":
            enable_station_flow(network)
        elif choice == "4":
            disable_connection_flow(network)
        elif choice == "5":
            enable_connection_flow(network)
        elif choice == "6":
            disable_line_flow(network)
        elif choice == "7":
            enable_line_flow(network)
        elif choice == "8":
            view_disabled_elements(network)
        elif choice == "9":
            reset_all(network)
        elif choice == "0":
            break
        else:
            print("Lựa chọn không hợp lệ. Vui lòng thử lại.\n")


def view_network_status(network: SubwayNetwork) -> None:
    """Hiển thị trạng thái chi tiết mạng lưới."""
    status = network.get_network_status()
    print()
    print("=" * 40)
    print("  TRẠNG THÁI MẠNG LƯỚI")
    print("=" * 40)
    print(f"  Tổng số ga:         {status['total_stations']}")
    print(f"  Ga hoạt động:       {status['active_stations']}")
    print(f"  Ga đóng cửa:        {status['closed_stations']}")
    print(f"  Tổng kết nối:       {status['total_connections']}")
    print(f"  Kết nối hoạt động:  {status['active_connections']}")
    print(f"  Kết nối đóng:       {status['closed_connections']}")
    print("=" * 40)
    input("\nNhấn Enter để tiếp tục...")


def disable_station_flow(network: SubwayNetwork) -> None:
    """Nhập mã ga, đóng cửa ga, xác nhận."""
    station_id = input("\nNhập mã ga cần đóng cửa: ").strip().upper()
    station = network.get_station(station_id)
    if station is None:
        print(f"Không tìm thấy ga '{station_id}'.")
        input("\nNhấn Enter để tiếp tục...")
        return

    if not station.is_active:
        print(f"Ga {station_id} ({station.name}) đã đóng cửa từ trước.")
        input("\nNhấn Enter để tiếp tục...")
        return

    success = network.disable_station(station_id)
    if success:
        lines_str = ", ".join(station.lines)
        print(f"Ga {station_id} ({station.name}) đã được ĐÓNG CỬA.")
        if station.is_transfer:
            print(f"  Ga này là điểm trung chuyển của các tuyến: {lines_str}")
            print(f"  Cảnh báo: Điều này có thể ảnh hưởng đến việc tìm đường giữa các tuyến.")
    else:
        print(f"Không thể đóng cửa ga '{station_id}'.")
    input("\nNhấn Enter để tiếp tục...")


def enable_station_flow(network: SubwayNetwork) -> None:
    """Nhập mã ga, mở lại ga, xác nhận."""
    # Hiển thị các ga đang đóng cửa
    disabled = [s for s in network.stations.values() if not s.is_active]
    if not disabled:
        print("\nKhông có ga nào đang đóng cửa.")
        input("\nNhấn Enter để tiếp tục...")
        return

    print("\nCác ga đang đóng cửa:")
    for s in disabled:
        lines_str = ", ".join(s.lines)
        print(f"  {s.id:6} {s.name} ({lines_str})")

    station_id = input("\nNhập mã ga cần mở lại: ").strip().upper()
    success = network.enable_station(station_id)
    if success:
        station = network.get_station(station_id)
        print(f"Ga {station_id} ({station.name}) đã được MỞ LẠI.")
    else:
        print(f"Không tìm thấy ga '{station_id}' hoặc không thể mở lại.")
    input("\nNhấn Enter để tiếp tục...")


def disable_connection_flow(network: SubwayNetwork) -> None:
    """Nhập mã hai ga, đóng kết nối giữa chúng."""
    print("\nĐóng kết nối giữa hai ga")
    station_a = input("Nhập mã ga thứ nhất: ").strip().upper()
    station_b = input("Nhập mã ga thứ hai: ").strip().upper()

    if network.get_station(station_a) is None:
        print(f"Không tìm thấy ga '{station_a}'.")
        input("\nNhấn Enter để tiếp tục...")
        return
    if network.get_station(station_b) is None:
        print(f"Không tìm thấy ga '{station_b}'.")
        input("\nNhấn Enter để tiếp tục...")
        return

    success = network.disable_connection(station_a, station_b)
    if success:
        st_a = network.get_station(station_a)
        st_b = network.get_station(station_b)
        print(f"Kết nối {station_a} ({st_a.name}) <-> {station_b} ({st_b.name}) đã được ĐÓNG.")
    else:
        print(f"Không tìm thấy kết nối trực tiếp giữa {station_a} và {station_b}.")
    input("\nNhấn Enter để tiếp tục...")


def enable_connection_flow(network: SubwayNetwork) -> None:
    """Nhập mã hai ga, mở lại kết nối giữa chúng."""
    print("\nMở lại kết nối giữa hai ga")
    station_a = input("Nhập mã ga thứ nhất: ").strip().upper()
    station_b = input("Nhập mã ga thứ hai: ").strip().upper()

    if network.get_station(station_a) is None:
        print(f"Không tìm thấy ga '{station_a}'.")
        input("\nNhấn Enter để tiếp tục...")
        return
    if network.get_station(station_b) is None:
        print(f"Không tìm thấy ga '{station_b}'.")
        input("\nNhấn Enter để tiếp tục...")
        return

    success = network.enable_connection(station_a, station_b)
    if success:
        st_a = network.get_station(station_a)
        st_b = network.get_station(station_b)
        print(f"Kết nối {station_a} ({st_a.name}) <-> {station_b} ({st_b.name}) đã được MỞ LẠI.")
    else:
        print(f"Không tìm thấy kết nối trực tiếp giữa {station_a} và {station_b}.")
    input("\nNhấn Enter để tiếp tục...")


def disable_line_flow(network: SubwayNetwork) -> None:
    """Hiển thị các tuyến, đóng toàn bộ kết nối của một tuyến."""
    print("\nCác tuyến hiện có:")
    for lid, lname in LINE_NAMES.items():
        print(f"  [{lid:3}] {lname}")

    line_id = input("\nNhập mã tuyến cần đóng: ").strip().upper()
    if line_id not in LINE_NAMES:
        print(f"Mã tuyến không hợp lệ. Các mã hợp lệ: {', '.join(LINE_NAMES.keys())}")
        input("\nNhấn Enter để tiếp tục...")
        return

    count = network.disable_line(line_id)
    line_name = LINE_NAMES[line_id]
    print(f"Đã đóng {count} kết nối trên {line_name}.")
    input("\nNhấn Enter để tiếp tục...")


def enable_line_flow(network: SubwayNetwork) -> None:
    """Hiển thị các tuyến đã đóng, mở lại toàn bộ kết nối."""
    print("\nCác tuyến hiện có:")
    for lid, lname in LINE_NAMES.items():
        print(f"  [{lid:3}] {lname}")

    line_id = input("\nNhập mã tuyến cần mở lại: ").strip().upper()
    if line_id not in LINE_NAMES:
        print(f"Mã tuyến không hợp lệ. Các mã hợp lệ: {', '.join(LINE_NAMES.keys())}")
        input("\nNhấn Enter để tiếp tục...")
        return

    count = network.enable_line(line_id)
    line_name = LINE_NAMES[line_id]
    print(f"Đã mở lại {count} kết nối trên {line_name}.")
    input("\nNhấn Enter để tiếp tục...")


def view_disabled_elements(network: SubwayNetwork) -> None:
    """Liệt kê tất cả các ga và kết nối đang đóng cửa."""
    print()
    print("=" * 40)
    print("  CÁC PHẦN TỬ ĐANG ĐÓNG CỬA")
    print("=" * 40)

    # Ga đóng cửa
    closed_stations = [s for s in network.stations.values() if not s.is_active]
    print(f"\nGa đóng cửa ({len(closed_stations)}):")
    if closed_stations:
        for s in closed_stations:
            lines_str = ", ".join(s.lines)
            print(f"  - {s.id:6} {s.name} [{lines_str}]")
    else:
        print("  (không có)")

    # Kết nối đóng
    closed_connections = set()
    for conns in network.adjacency_list.values():
        for conn in conns:
            if not conn.is_active:
                pair = tuple(sorted([conn.station_a.id, conn.station_b.id]))
                closed_connections.add((pair, conn.line))

    print(f"\nKết nối đóng ({len(closed_connections)}):")
    if closed_connections:
        for (pair, line) in sorted(closed_connections):
            line_name = LINE_NAMES.get(line, line)
            print(f"  - {pair[0]} <-> {pair[1]} ({line_name})")
    else:
        print("  (không có)")

    print("=" * 40)
    input("\nNhấn Enter để tiếp tục...")


def reset_all(network: SubwayNetwork) -> None:
    """Mở lại tất cả các ga và kết nối."""
    confirm = input("\nBạn có chắc muốn đặt lại toàn bộ mạng lưới? (c/k): ").strip().lower()
    if confirm != 'c':
        print("Đã hủy thao tác.")
        input("\nNhấn Enter để tiếp tục...")
        return

    # Mở lại tất cả các ga
    for station in network.stations.values():
        station.is_active = True

    # Mở lại tất cả các kết nối
    for conns in network.adjacency_list.values():
        for conn in conns:
            conn.is_active = True

    print("Đã đặt lại toàn bộ mạng lưới. Tất cả các ga và kết nối đã được mở lại.")
    input("\nNhấn Enter để tiếp tục...")
