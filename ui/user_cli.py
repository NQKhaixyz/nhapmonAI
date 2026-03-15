"""
Giao diện dòng lệnh dành cho người dùng hệ thống tìm đường MRT Đài Bắc.
Cung cấp chức năng tìm đường, xem danh sách ga và trạng thái mạng lưới.
"""

from core.models import SubwayNetwork, Station
from core.algorithms import find_shortest_path


def run_user_cli(network: SubwayNetwork) -> None:
    """Vòng lặp chính giao diện người dùng."""
    while True:
        print("=" * 40)
        print("  MENU NGƯỜI DÙNG - Tìm Đường Đi")
        print("=" * 40)
        print("  [1] Tìm đường giữa hai ga")
        print("  [2] Danh sách tất cả các ga")
        print("  [3] Danh sách ga theo tuyến")
        print("  [4] Xem trạng thái mạng lưới")
        print("  [0] Quay lại menu chính")
        print("=" * 40)

        choice = input("Lựa chọn của bạn: ").strip()

        if choice == "1":
            find_route(network)
        elif choice == "2":
            list_all_stations(network)
        elif choice == "3":
            list_stations_by_line(network)
        elif choice == "4":
            display_network_status(network)
        elif choice == "0":
            break
        else:
            print("Lựa chọn không hợp lệ. Vui lòng thử lại.\n")


def search_station(network: SubwayNetwork, query: str) -> list:
    """Tìm ga theo tên (không phân biệt hoa thường)."""
    query_lower = query.lower()
    return [
        s for s in network.stations.values()
        if query_lower in s.name.lower() or query_lower in s.id.lower()
    ]


def prompt_station_id(network: SubwayNetwork, prompt_text: str) -> str:
    """Nhập mã ga với hỗ trợ tìm kiếm. Trả về mã ga hợp lệ hoặc None."""
    while True:
        user_input = input(prompt_text).strip()
        if not user_input:
            print("Đầu vào không được để trống.")
            continue

        # Kiểm tra xem có phải mã ga trực tiếp không
        station = network.get_station(user_input.upper())
        if station is not None:
            return station.id

        # Thử tìm kiếm theo tên
        matches = search_station(network, user_input)
        if len(matches) == 0:
            print(f"Không tìm thấy ga '{user_input}'. Dùng lệnh 'list' để xem tất cả các ga.")
            continue
        elif len(matches) == 1:
            print(f"  Tìm thấy: {matches[0].id} - {matches[0].name}")
            return matches[0].id
        else:
            print(f"  Tìm thấy nhiều kết quả:")
            for i, s in enumerate(matches, 1):
                lines_str = ", ".join(s.lines)
                print(f"    [{i}] {s.id} - {s.name} ({lines_str})")
            while True:
                sel = input(f"  Chọn (1-{len(matches)}): ").strip()
                if sel.isdigit() and 1 <= int(sel) <= len(matches):
                    return matches[int(sel) - 1].id
                print("  Lựa chọn không hợp lệ.")


def find_route(network: SubwayNetwork) -> None:
    """Nhập ga xuất phát và ga đích, hiển thị lộ trình."""
    print("\n--- Tìm Đường Đi ---")
    start_id = prompt_station_id(network, "Nhập ga xuất phát (mã hoặc tên): ")
    end_id = prompt_station_id(network, "Nhập ga đích (mã hoặc tên): ")

    result = find_shortest_path(network, start_id, end_id)

    if result is None:
        print()
        print("=" * 40)
        print("  KHÔNG TÌM THẤY ĐƯỜNG ĐI")
        print("=" * 40)
        start_st = network.get_station(start_id)
        end_st = network.get_station(end_id)
        s_name = start_st.name if start_st else start_id
        e_name = end_st.name if end_st else end_id
        print(f"Không tìm được đường từ {s_name} đến {e_name}.")
        print("Nguyên nhân có thể:")
        print("  - Một hoặc cả hai ga hiện đang đóng cửa")
        print("  - Các tuyến kết nối đang bảo trì")
        print("  - Các ga nằm trên đoạn bị ngắt kết nối")
        print("=" * 40)
    else:
        display_route_result(result, network)

    input("\nNhấn Enter để tiếp tục...")


# Bảng ánh xạ mã tuyến sang tên hiển thị tiếng Việt
LINE_NAMES = {
    "BR": "Tuyến Nâu (Văn Hồ)",
    "R": "Tuyến Đỏ (Đạm Thủy-Tín Nghĩa)",
    "G": "Tuyến Xanh Lá (Tùng Sơn-Tân Điếm)",
    "O": "Tuyến Cam (Trung Hòa-Tân Lô)",
    "BL": "Tuyến Xanh Dương (Bản Nam)",
}


def display_route_result(result: dict, network: SubwayNetwork) -> None:
    """Định dạng và hiển thị kết quả tìm đường."""
    print()
    print("=" * 40)
    print("  ĐÃ TÌM THẤY ĐƯỜNG ĐI")
    print("=" * 40)

    path = result["path"]
    start = path[0]
    end = path[-1]
    print(f"Từ:  {start.id} - {start.name}")
    print(f"Đến: {end.id} - {end.name}")
    print()
    print(f"Tổng số ga:      {result['num_stops']}")
    print(f"Số lần đổi tuyến: {result['num_transfers']}")
    print(f"Tổng chi phí:     {result['total_cost']}")
    print()
    print("Chi tiết lộ trình:")
    print("─" * 40)

    segments = result["lines_used"]
    for seg_idx, segment in enumerate(segments):
        line_id = segment["line"]
        line_display = LINE_NAMES.get(line_id, line_id)
        from_id = segment["from"]
        to_id = segment["to"]

        # Tìm tất cả các ga trong đoạn này từ danh sách đường đi
        in_segment = False
        for sid in result["station_ids"]:
            if sid == from_id:
                in_segment = True
            if in_segment:
                st = network.get_station(sid)
                name = st.name if st else sid
                if sid == from_id:
                    print(f"  [{line_display}]")
                print(f"    {sid} {name}")
            if sid == to_id and in_segment:
                in_segment = False
                break

        if seg_idx < len(segments) - 1:
            next_line = segments[seg_idx + 1]["line"]
            next_display = LINE_NAMES.get(next_line, next_line)
            print(f"  ~~~ Đổi sang {next_display} ~~~")

    print("─" * 40)
    print("=" * 40)


def list_all_stations(network: SubwayNetwork) -> None:
    """Hiển thị tất cả các ga theo thứ tự mã ga."""
    print("\n--- Danh Sách Tất Cả Các Ga ---")
    stations = network.get_all_stations()
    for s in stations:
        status = "HOẠT ĐỘNG" if s.is_active else "ĐÓNG CỬA"
        lines_str = ", ".join(s.lines)
        transfer = " [TRUNG CHUYỂN]" if s.is_transfer else ""
        terminal = " [GA CUỐI]" if s.is_terminal else ""
        print(f"  {s.id:6} {s.name:35} ({lines_str}){transfer}{terminal} - {status}")
    print(f"\nTổng cộng: {len(stations)} ga")
    input("\nNhấn Enter để tiếp tục...")


def list_stations_by_line(network: SubwayNetwork) -> None:
    """Nhập tuyến, hiển thị các ga trên tuyến đó."""
    print("\nCác tuyến hiện có:")
    for lid, lname in LINE_NAMES.items():
        print(f"  [{lid:3}] {lname}")

    line_id = input("\nNhập mã tuyến: ").strip().upper()
    if line_id not in LINE_NAMES:
        print(f"Mã tuyến không hợp lệ. Các mã hợp lệ: {', '.join(LINE_NAMES.keys())}")
        input("\nNhấn Enter để tiếp tục...")
        return

    stations = network.get_stations_by_line(line_id)
    stations.sort(key=lambda s: s.id)
    line_name = LINE_NAMES[line_id]
    print(f"\n--- Các ga trên {line_name} ---")
    for s in stations:
        status = "HOẠT ĐỘNG" if s.is_active else "ĐÓNG CỬA"
        transfer = " [TRUNG CHUYỂN]" if s.is_transfer else ""
        terminal = " [GA CUỐI]" if s.is_terminal else ""
        print(f"  {s.id:6} {s.name:35}{transfer}{terminal} - {status}")
    print(f"\nTổng cộng: {len(stations)} ga")
    input("\nNhấn Enter để tiếp tục...")


def display_network_status(network: SubwayNetwork) -> None:
    """Hiển thị tóm tắt trạng thái mạng lưới."""
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
