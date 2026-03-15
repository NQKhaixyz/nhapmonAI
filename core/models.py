"""
Mô-đun chứa các lớp cốt lõi cho hệ thống định tuyến MRT Đài Bắc.

Bao gồm các lớp biểu diễn ga tàu, kết nối giữa các ga,
và mạng lưới tàu điện ngầm dưới dạng đồ thị vô hướng có trọng số.
"""

# Chi phí chuyển tuyến (số phút phạt khi đổi tuyến)
TRANSFER_COST = 3


class Station:
    """Biểu diễn một ga tàu điện ngầm MRT (đỉnh trong đồ thị)."""

    def __init__(
        self,
        id: str,
        name: str,
        lines: list[str],
        is_transfer: bool = False,
        is_terminal: bool = False,
    ):
        """
        Khởi tạo một ga tàu điện ngầm.

        Tham số:
            id: Mã định danh duy nhất của ga (ví dụ: 'BL12', 'R10').
            name: Tên hiển thị của ga (ví dụ: 'Taipei Main Station').
            lines: Danh sách các tuyến đi qua ga này.
            is_transfer: Ga có phải là ga chuyển tuyến hay không.
            is_terminal: Ga có phải là ga đầu/cuối tuyến hay không.
        """
        self.id = id
        self.name = name
        self.lines = lines
        self.is_transfer = is_transfer
        self.is_terminal = is_terminal
        # Trạng thái hoạt động trong thời gian chạy
        self.is_active = True

    def __repr__(self) -> str:
        """Trả về chuỗi biểu diễn của ga để gỡ lỗi."""
        return f"Station(id='{self.id}', name='{self.name}', lines={self.lines})"

    def __eq__(self, other: object) -> bool:
        """So sánh hai ga dựa trên mã định danh."""
        if not isinstance(other, Station):
            return NotImplemented
        return self.id == other.id

    def __hash__(self) -> int:
        """Trả về giá trị băm dựa trên mã định danh của ga."""
        return hash(self.id)


class Connection:
    """Biểu diễn một kết nối đường ray giữa hai ga liền kề (cạnh trong đồ thị)."""

    def __init__(
        self,
        station_a: Station,
        station_b: Station,
        line: str,
        weight: int = 1,
    ):
        """
        Khởi tạo một kết nối giữa hai ga.

        Tham số:
            station_a: Ga đầu tiên của kết nối.
            station_b: Ga thứ hai của kết nối.
            line: Tên tuyến mà kết nối này thuộc về.
            weight: Trọng số của kết nối (mặc định là 1).
        """
        self.station_a = station_a
        self.station_b = station_b
        self.line = line
        self.weight = weight
        # Trạng thái hoạt động trong thời gian chạy
        self.is_active = True

    def get_other(self, station: Station) -> Station:
        """
        Cho một đầu mút, trả về đầu mút còn lại của kết nối.

        Tham số:
            station: Một trong hai ga của kết nối.

        Trả về:
            Ga ở đầu còn lại của kết nối.

        Ngoại lệ:
            ValueError: Nếu ga truyền vào không thuộc kết nối này.
        """
        if station == self.station_a:
            return self.station_b
        elif station == self.station_b:
            return self.station_a
        else:
            raise ValueError(
                f"Ga '{station.id}' không thuộc kết nối này "
                f"({self.station_a.id} - {self.station_b.id})"
            )

    def __repr__(self) -> str:
        """Trả về chuỗi biểu diễn của kết nối để gỡ lỗi."""
        return (
            f"Connection({self.station_a.id} <--[{self.line}, w={self.weight}]--> "
            f"{self.station_b.id})"
        )


class SubwayNetwork:
    """
    Biểu diễn toàn bộ mạng lưới MRT dưới dạng đồ thị vô hướng có trọng số.

    Quản lý các ga, kết nối, và cung cấp các chức năng quản trị
    cũng như truy vấn mạng lưới.
    """

    def __init__(self):
        """Khởi tạo mạng lưới tàu điện ngầm rỗng."""
        # Từ điển ánh xạ mã ga -> đối tượng Station
        self.stations: dict[str, Station] = {}
        # Từ điển ánh xạ mã ga -> danh sách các kết nối liền kề
        self.adjacency_list: dict[str, list[Connection]] = {}

    # ----------------------------------------------------------------
    # Quản lý ga tàu
    # ----------------------------------------------------------------

    def add_station(self, station: Station) -> None:
        """
        Thêm một ga vào mạng lưới.

        Tham số:
            station: Đối tượng ga cần thêm.

        Ngoại lệ:
            ValueError: Nếu ga với mã định danh này đã tồn tại.
        """
        if station.id in self.stations:
            raise ValueError(
                f"Ga với mã '{station.id}' đã tồn tại trong mạng lưới"
            )
        self.stations[station.id] = station
        self.adjacency_list[station.id] = []

    def get_station(self, station_id: str) -> Station | None:
        """
        Tìm và trả về ga theo mã định danh.

        Tham số:
            station_id: Mã định danh của ga cần tìm.

        Trả về:
            Đối tượng Station nếu tìm thấy, None nếu không.
        """
        return self.stations.get(station_id)

    # ----------------------------------------------------------------
    # Quản lý kết nối
    # ----------------------------------------------------------------

    def add_connection(
        self,
        station_a_id: str,
        station_b_id: str,
        line: str,
        weight: int = 1,
    ) -> Connection:
        """
        Thêm một kết nối hai chiều giữa hai ga.

        Tham số:
            station_a_id: Mã định danh của ga đầu tiên.
            station_b_id: Mã định danh của ga thứ hai.
            line: Tên tuyến mà kết nối thuộc về.
            weight: Trọng số của kết nối (mặc định là 1).

        Trả về:
            Đối tượng Connection vừa được tạo.

        Ngoại lệ:
            ValueError: Nếu một trong hai ga không tồn tại trong mạng lưới.
        """
        if station_a_id not in self.stations:
            raise ValueError(
                f"Không tìm thấy ga với mã '{station_a_id}' trong mạng lưới"
            )
        if station_b_id not in self.stations:
            raise ValueError(
                f"Không tìm thấy ga với mã '{station_b_id}' trong mạng lưới"
            )

        station_a = self.stations[station_a_id]
        station_b = self.stations[station_b_id]

        connection = Connection(station_a, station_b, line, weight)

        # Kết nối hai chiều: thêm vào danh sách kề của cả hai ga
        self.adjacency_list[station_a_id].append(connection)
        self.adjacency_list[station_b_id].append(connection)

        return connection

    # ----------------------------------------------------------------
    # Điều khiển quản trị (vô hiệu hóa / kích hoạt)
    # ----------------------------------------------------------------

    def disable_station(self, station_id: str) -> bool:
        """
        Vô hiệu hóa một ga (đánh dấu là không hoạt động).

        Tham số:
            station_id: Mã định danh của ga cần vô hiệu hóa.

        Trả về:
            True nếu ga được tìm thấy và vô hiệu hóa thành công,
            False nếu ga không tồn tại.
        """
        station = self.stations.get(station_id)
        if station is None:
            return False
        station.is_active = False
        # Vô hiệu hóa tất cả kết nối liên quan đến ga này
        for connection in self.adjacency_list.get(station_id, []):
            connection.is_active = False
        return True

    def enable_station(self, station_id: str) -> bool:
        """
        Kích hoạt lại một ga (đánh dấu là hoạt động).

        Chỉ kích hoạt lại các kết nối mà ga ở đầu kia cũng đang hoạt động,
        để tránh vô tình mở lại các kết nối đã bị vô hiệu hóa độc lập.

        Tham số:
            station_id: Mã định danh của ga cần kích hoạt.

        Trả về:
            True nếu ga được tìm thấy và kích hoạt thành công,
            False nếu ga không tồn tại.
        """
        station = self.stations.get(station_id)
        if station is None:
            return False
        station.is_active = True
        # Chỉ kích hoạt lại kết nối nếu ga ở đầu kia cũng đang hoạt động
        for connection in self.adjacency_list.get(station_id, []):
            other = connection.get_other(station)
            if other.is_active:
                connection.is_active = True
        return True

    def disable_line(self, line: str) -> int:
        """
        Vô hiệu hóa tất cả kết nối thuộc một tuyến cụ thể.

        Tham số:
            line: Tên tuyến cần vô hiệu hóa.

        Trả về:
            Số lượng kết nối thực tế bị vô hiệu hóa (mỗi kết nối chỉ tính một lần).
        """
        affected = 0
        for connections in self.adjacency_list.values():
            for connection in connections:
                if connection.line == line and connection.is_active:
                    connection.is_active = False
                    affected += 1
        # Mỗi kết nối xuất hiện trong danh sách kề của cả hai ga,
        # nên chia đôi để ra số kết nối thực tế
        return affected // 2

    def enable_line(self, line: str) -> int:
        """
        Kích hoạt lại tất cả kết nối thuộc một tuyến cụ thể.

        Tham số:
            line: Tên tuyến cần kích hoạt.

        Trả về:
            Số lượng kết nối thực tế được kích hoạt (mỗi kết nối chỉ tính một lần).
        """
        affected = 0
        for connections in self.adjacency_list.values():
            for connection in connections:
                if connection.line == line and not connection.is_active:
                    connection.is_active = True
                    affected += 1
        # Mỗi kết nối xuất hiện trong danh sách kề của cả hai ga,
        # nên chia đôi để ra số kết nối thực tế
        return affected // 2

    def disable_connection(
        self, station_a_id: str, station_b_id: str
    ) -> bool:
        """
        Vô hiệu hóa kết nối giữa hai ga cụ thể.

        Tham số:
            station_a_id: Mã định danh của ga đầu tiên.
            station_b_id: Mã định danh của ga thứ hai.

        Trả về:
            True nếu tìm thấy và vô hiệu hóa ít nhất một kết nối,
            False nếu không tìm thấy kết nối nào.
        """
        found = False
        for connection in self.adjacency_list.get(station_a_id, []):
            other = connection.get_other(self.stations[station_a_id])
            if other.id == station_b_id:
                connection.is_active = False
                found = True
        return found

    def enable_connection(
        self, station_a_id: str, station_b_id: str
    ) -> bool:
        """
        Kích hoạt lại kết nối giữa hai ga cụ thể.

        Tham số:
            station_a_id: Mã định danh của ga đầu tiên.
            station_b_id: Mã định danh của ga thứ hai.

        Trả về:
            True nếu tìm thấy và kích hoạt ít nhất một kết nối,
            False nếu không tìm thấy kết nối nào.
        """
        found = False
        for connection in self.adjacency_list.get(station_a_id, []):
            other = connection.get_other(self.stations[station_a_id])
            if other.id == station_b_id:
                connection.is_active = True
                found = True
        return found

    # ----------------------------------------------------------------
    # Phương thức truy vấn
    # ----------------------------------------------------------------

    def get_all_stations(self) -> list[Station]:
        """
        Trả về danh sách tất cả các ga trong mạng lưới.

        Trả về:
            Danh sách các đối tượng Station.
        """
        return list(self.stations.values())

    def get_stations_by_line(self, line: str) -> list[Station]:
        """
        Trả về danh sách các ga thuộc một tuyến cụ thể.

        Tham số:
            line: Tên tuyến cần lọc.

        Trả về:
            Danh sách các ga thuộc tuyến đã chỉ định.
        """
        return [
            station
            for station in self.stations.values()
            if line in station.lines
        ]

    def get_active_connections(self, station_id: str) -> list[Connection]:
        """
        Trả về danh sách các kết nối đang hoạt động của một ga.

        Tham số:
            station_id: Mã định danh của ga cần truy vấn.

        Trả về:
            Danh sách các kết nối đang hoạt động liên quan đến ga.
        """
        return [
            connection
            for connection in self.adjacency_list.get(station_id, [])
            if connection.is_active
        ]

    def get_network_status(self) -> dict:
        """
        Trả về thông tin tổng quan về trạng thái hiện tại của mạng lưới.

        Trả về:
            Từ điển chứa số liệu thống kê mạng lưới bao gồm:
            - total_stations: Tổng số ga
            - active_stations: Số ga đang hoạt động
            - closed_stations: Số ga đã đóng
            - total_connections: Tổng số kết nối
            - active_connections: Số kết nối đang hoạt động
            - closed_connections: Số kết nối đã đóng
        """
        total_stations = len(self.stations)
        active_stations = sum(
            1 for station in self.stations.values() if station.is_active
        )
        closed_stations = total_stations - active_stations

        # Thu thập tất cả kết nối duy nhất (tránh đếm trùng do danh sách kề hai chiều)
        all_connections: set[int] = set()
        active_connection_ids: set[int] = set()

        for connections in self.adjacency_list.values():
            for connection in connections:
                conn_id = id(connection)
                all_connections.add(conn_id)
                if connection.is_active:
                    active_connection_ids.add(conn_id)

        total_connections = len(all_connections)
        active_connections = len(active_connection_ids)
        closed_connections = total_connections - active_connections

        return {
            "total_stations": total_stations,
            "active_stations": active_stations,
            "closed_stations": closed_stations,
            "total_connections": total_connections,
            "active_connections": active_connections,
            "closed_connections": closed_connections,
        }

    # ----------------------------------------------------------------
    # Tìm đường đi
    # ----------------------------------------------------------------

    def find_shortest_path(self, start_id: str, end_id: str):
        """
        Tìm đường đi ngắn nhất giữa hai ga.

        Ủy quyền cho thuật toán tìm đường trong mô-đun algorithms.

        Tham số:
            start_id: Mã định danh của ga xuất phát.
            end_id: Mã định danh của ga đích.

        Trả về:
            Kết quả tìm đường từ thuật toán (xem mô-đun algorithms).
        """
        from .algorithms import find_shortest_path as _find_path

        return _find_path(self, start_id, end_id)
