"""
Ung dung web Flask cho he thong dinh tuyen MRT Dai Bac.

Cung cap cac API de tim duong, quan ly mang luoi,
va giao dien nguoi dung cho nguoi dung va quan tri vien.
"""

import sys
import os

# Them thu muc cha vao sys.path de import cac module cua du an
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from flask import Flask, render_template, jsonify, request
from core.models import SubwayNetwork, Station, TRANSFER_COST
from core.algorithms import find_shortest_path
from utils.data_loader import load_network

app = Flask(__name__)
app.config['TEMPLATES_AUTO_RELOAD'] = True
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0  # Khong cache static files

# Nap mang luoi MRT tu file du lieu JSON
network = load_network(os.path.join(os.path.dirname(__file__), '..', 'data', 'mrt_map.json'))

# Thong tin cac tuyen MRT (ten tieng Viet, ma mau, so thu tu)
LINE_INFO = {
    "BR": {"name": "Tuyến Nâu (Văn Hồ)", "color": "#C48C31", "number": 1},
    "R":  {"name": "Tuyến Đỏ (Đạm Thủy-Tín Nghĩa)", "color": "#E3002C", "number": 2},
    "G":  {"name": "Tuyến Xanh Lá (Tùng Sơn-Tân Điếm)", "color": "#008659", "number": 3},
    "O":  {"name": "Tuyến Cam (Trung Hòa-Tân Lô)", "color": "#F8B61C", "number": 4},
    "BL": {"name": "Tuyến Xanh Dương (Bản Nam)", "color": "#0070BD", "number": 5},
}


def _station_to_dict(station: Station) -> dict:
    """Chuyen doi doi tuong Station thanh tu dien de tra ve dang JSON."""
    return {
        "id": station.id,
        "name": station.name,
        "lines": station.lines,
        "is_transfer": station.is_transfer,
        "is_terminal": station.is_terminal,
        "is_active": station.is_active,
        "lat": station.lat,
        "lng": station.lng,
    }


# ================================================================
# Cac trang giao dien nguoi dung
# ================================================================

@app.after_request
def add_no_cache_headers(response):
    """Them header chong cache de dam bao trinh duyet luon tai phien ban moi nhat."""
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response


@app.route('/')
def index():
    """Trang chinh - giao dien tim duong di."""
    return render_template('index.html')


@app.route('/admin')
def admin():
    """Trang quan tri - quan ly mang luoi MRT."""
    return render_template('admin.html')


# ================================================================
# API - Thong tin ga va tuyen
# ================================================================

@app.route('/api/stations', methods=['GET'])
def api_stations():
    """
    Tra ve danh sach tat ca cac ga.

    Tham so truy van tuy chon:
        line (str): Loc theo tuyen (vi du: ?line=BL)

    Tra ve:
        JSON danh sach cac ga voi thong tin chi tiet.
    """
    line_filter = request.args.get('line')

    if line_filter:
        # Loc cac ga theo tuyen duoc chi dinh
        stations = network.get_stations_by_line(line_filter)
    else:
        # Lay tat ca cac ga
        stations = network.get_all_stations()

    result = [_station_to_dict(s) for s in stations]
    return jsonify(result)


@app.route('/api/lines', methods=['GET'])
def api_lines():
    """Tra ve thong tin tat ca cac tuyen MRT."""
    return jsonify(LINE_INFO)


# ================================================================
# API - Tim duong di
# ================================================================

@app.route('/api/find-route', methods=['POST'])
def api_find_route():
    """
    Tim duong di ngan nhat giua hai ga.

    Than yeu cau (JSON):
        start (str): Ma ga xuat phat.
        end (str): Ma ga dich.

    Tra ve:
        JSON ket qua tim duong hoac thong bao loi.
    """
    data = request.get_json()

    # Kiem tra du lieu dau vao
    if not data:
        return jsonify({
            "success": False,
            "error": "Dữ liệu yêu cầu không hợp lệ. Vui lòng gửi JSON với các trường 'start' và 'end'."
        }), 400

    start_id = data.get('start')
    end_id = data.get('end')

    if not start_id or not end_id:
        return jsonify({
            "success": False,
            "error": "Vui lòng cung cấp cả ga xuất phát ('start') và ga đích ('end')."
        }), 400

    # Kiem tra ga xuat phat co ton tai khong
    start_station = network.get_station(start_id)
    if start_station is None:
        return jsonify({
            "success": False,
            "error": f"Không tìm thấy ga xuất phát với mã '{start_id}'."
        }), 404

    # Kiem tra ga dich co ton tai khong
    end_station = network.get_station(end_id)
    if end_station is None:
        return jsonify({
            "success": False,
            "error": f"Không tìm thấy ga đích với mã '{end_id}'."
        }), 404

    # Kiem tra ga co dang hoat dong khong
    if not start_station.is_active:
        return jsonify({
            "success": False,
            "error": f"Ga xuất phát '{start_station.name}' ({start_id}) hiện đang đóng cửa."
        }), 400

    if not end_station.is_active:
        return jsonify({
            "success": False,
            "error": f"Ga đích '{end_station.name}' ({end_id}) hiện đang đóng cửa."
        }), 400

    # Tim duong di ngan nhat
    result = find_shortest_path(network, start_id, end_id)

    if result is None:
        return jsonify({
            "success": False,
            "error": "Không tìm thấy đường đi giữa hai ga. Có thể một số ga hoặc kết nối đã bị vô hiệu hóa."
        }), 404

    # Xay dung danh sach thong tin ga tren duong di
    stations_info = []
    for station in result["path"]:
        stations_info.append({
            "id": station.id,
            "name": station.name,
            "lines": station.lines,
            "lat": station.lat,
            "lng": station.lng,
        })

    # Xay dung cac doan tuyen chi tiet (segments) voi danh sach ga trong moi doan
    segments = _build_segments(result)

    return jsonify({
        "success": True,
        "route": {
            "station_ids": result["station_ids"],
            "stations": stations_info,
            "total_cost": result["total_cost"],
            "num_transfers": result["num_transfers"],
            "num_stops": result["num_stops"],
            "segments": segments,
        }
    })


def _build_segments(route_result: dict) -> list[dict]:
    """
    Xay dung danh sach cac doan tuyen chi tiet tu ket qua tim duong.

    Moi doan tuyen bao gom thong tin tuyen, ga dau, ga cuoi,
    va danh sach tat ca cac ga trong doan do.

    Tham so:
        route_result: Ket qua tra ve tu find_shortest_path.

    Tra ve:
        Danh sach cac tu dien mo ta tung doan tuyen.
    """
    segments = []
    lines_used = route_result["lines_used"]
    station_ids = route_result["station_ids"]
    path_stations = route_result["path"]

    for seg in lines_used:
        line_code = seg["line"]
        from_id = seg["from"]
        to_id = seg["to"]

        # Lay thong tin tuyen tu LINE_INFO
        line_info = LINE_INFO.get(line_code, {})
        line_name = line_info.get("name", line_code)
        line_color = line_info.get("color", "#999999")

        # Lay ten cac ga dau va cuoi cua doan
        from_station = network.get_station(from_id)
        to_station = network.get_station(to_id)

        # Tim cac ga trong doan tuyen nay (tu from_id den to_id trong danh sach duong di)
        from_idx = station_ids.index(from_id)
        to_idx = station_ids.index(to_id)
        segment_stations = []
        for i in range(from_idx, to_idx + 1):
            s = path_stations[i]
            segment_stations.append({
                "id": s.id,
                "name": s.name,
            })

        segments.append({
            "line": line_code,
            "line_name": line_name,
            "color": line_color,
            "from_id": from_id,
            "from_name": from_station.name if from_station else from_id,
            "to_id": to_id,
            "to_name": to_station.name if to_station else to_id,
            "stations": segment_stations,
            "transport_mode": seg.get("transport_mode", "metro"),
        })

    return segments


# ================================================================
# API - Trang thai mang luoi
# ================================================================

@app.route('/api/network-status', methods=['GET'])
def api_network_status():
    """Tra ve trang thai tong quan cua mang luoi MRT va thong tin cac tuyen."""
    status = network.get_network_status()

    # Bo sung so luong ga cho tung tuyen de hien thi tren giao dien
    lines_with_counts = {}
    for code, info in LINE_INFO.items():
        stations_on_line = network.get_stations_by_line(code)
        active_count = sum(1 for s in stations_on_line if s.is_active)
        lines_with_counts[code] = {
            **info,
            "stations": len(stations_on_line),
            "active_stations": active_count,
        }

    return jsonify({
        "status": status,
        "lines": lines_with_counts,
    })


# ================================================================
# API - Quan tri vien: Vo hieu hoa / Kich hoat
# ================================================================

@app.route('/api/admin/disable-station', methods=['POST'])
def api_disable_station():
    """
    Vo hieu hoa mot ga (danh dau la khong hoat dong).

    Than yeu cau (JSON):
        station_id (str): Ma dinh danh cua ga can vo hieu hoa.
    """
    data = request.get_json()
    if not data or 'station_id' not in data:
        return jsonify({
            "success": False,
            "error": "Vui lòng cung cấp 'station_id' trong yêu cầu."
        }), 400

    station_id = data['station_id']
    result = network.disable_station(station_id)

    if result:
        station = network.get_station(station_id)
        return jsonify({
            "success": True,
            "message": f"Đã vô hiệu hóa ga '{station.name}' ({station_id})."
        })
    else:
        return jsonify({
            "success": False,
            "error": f"Không tìm thấy ga với mã '{station_id}'."
        }), 404


@app.route('/api/admin/enable-station', methods=['POST'])
def api_enable_station():
    """
    Kich hoat lai mot ga (danh dau la hoat dong).

    Than yeu cau (JSON):
        station_id (str): Ma dinh danh cua ga can kich hoat.
    """
    data = request.get_json()
    if not data or 'station_id' not in data:
        return jsonify({
            "success": False,
            "error": "Vui lòng cung cấp 'station_id' trong yêu cầu."
        }), 400

    station_id = data['station_id']
    result = network.enable_station(station_id)

    if result:
        station = network.get_station(station_id)
        return jsonify({
            "success": True,
            "message": f"Đã kích hoạt lại ga '{station.name}' ({station_id})."
        })
    else:
        return jsonify({
            "success": False,
            "error": f"Không tìm thấy ga với mã '{station_id}'."
        }), 404


@app.route('/api/admin/disable-line', methods=['POST'])
def api_disable_line():
    """
    Vo hieu hoa tat ca ket noi thuoc mot tuyen cu the.

    Than yeu cau (JSON):
        line (str): Ma tuyen can vo hieu hoa (vi du: 'R', 'BL').
    """
    data = request.get_json()
    if not data or 'line' not in data:
        return jsonify({
            "success": False,
            "error": "Vui lòng cung cấp 'line' trong yêu cầu."
        }), 400

    line = data['line']
    affected = network.disable_line(line)

    line_name = LINE_INFO.get(line, {}).get("name", line)
    return jsonify({
        "success": True,
        "message": f"Đã vô hiệu hóa {affected} kết nối trên {line_name}.",
        "affected_connections": affected,
    })


@app.route('/api/admin/enable-line', methods=['POST'])
def api_enable_line():
    """
    Kich hoat lai tat ca ket noi thuoc mot tuyen cu the.

    Than yeu cau (JSON):
        line (str): Ma tuyen can kich hoat (vi du: 'R', 'BL').
    """
    data = request.get_json()
    if not data or 'line' not in data:
        return jsonify({
            "success": False,
            "error": "Vui lòng cung cấp 'line' trong yêu cầu."
        }), 400

    line = data['line']
    affected = network.enable_line(line)

    line_name = LINE_INFO.get(line, {}).get("name", line)
    return jsonify({
        "success": True,
        "message": f"Đã kích hoạt lại {affected} kết nối trên {line_name}.",
        "affected_connections": affected,
    })


@app.route('/api/admin/disable-connection', methods=['POST'])
def api_disable_connection():
    """
    Vo hieu hoa ket noi giua hai ga cu the.

    Than yeu cau (JSON):
        station_a (str): Ma dinh danh ga thu nhat.
        station_b (str): Ma dinh danh ga thu hai.
    """
    data = request.get_json()
    if not data or 'station_a' not in data or 'station_b' not in data:
        return jsonify({
            "success": False,
            "error": "Vui lòng cung cấp 'station_a' và 'station_b' trong yêu cầu."
        }), 400

    station_a = data['station_a']
    station_b = data['station_b']
    result = network.disable_connection(station_a, station_b)

    if result:
        sa = network.get_station(station_a)
        sb = network.get_station(station_b)
        name_a = sa.name if sa else station_a
        name_b = sb.name if sb else station_b
        return jsonify({
            "success": True,
            "message": f"Đã vô hiệu hóa kết nối giữa '{name_a}' ({station_a}) và '{name_b}' ({station_b})."
        })
    else:
        return jsonify({
            "success": False,
            "error": f"Không tìm thấy kết nối giữa ga '{station_a}' và '{station_b}'."
        }), 404


@app.route('/api/admin/enable-connection', methods=['POST'])
def api_enable_connection():
    """
    Kich hoat lai ket noi giua hai ga cu the.

    Than yeu cau (JSON):
        station_a (str): Ma dinh danh ga thu nhat.
        station_b (str): Ma dinh danh ga thu hai.
    """
    data = request.get_json()
    if not data or 'station_a' not in data or 'station_b' not in data:
        return jsonify({
            "success": False,
            "error": "Vui lòng cung cấp 'station_a' và 'station_b' trong yêu cầu."
        }), 400

    station_a = data['station_a']
    station_b = data['station_b']
    result = network.enable_connection(station_a, station_b)

    if result:
        sa = network.get_station(station_a)
        sb = network.get_station(station_b)
        name_a = sa.name if sa else station_a
        name_b = sb.name if sb else station_b
        return jsonify({
            "success": True,
            "message": f"Đã kích hoạt lại kết nối giữa '{name_a}' ({station_a}) và '{name_b}' ({station_b})."
        })
    else:
        return jsonify({
            "success": False,
            "error": f"Không tìm thấy kết nối giữa ga '{station_a}' và '{station_b}'."
        }), 404


@app.route('/api/admin/reset', methods=['POST'])
def api_reset():
    """
    Dat lai toan bo mang luoi ve trang thai ban dau.

    Kich hoat lai tat ca cac ga va ket noi da bi vo hieu hoa.
    """
    # Kich hoat lai tat ca cac ga
    for station in network.get_all_stations():
        station.is_active = True

    # Kich hoat lai tat ca cac ket noi
    for connections in network.adjacency_list.values():
        for conn in connections:
            conn.is_active = True

    return jsonify({
        "success": True,
        "message": "Đã đặt lại toàn bộ mạng lưới về trạng thái ban đầu. Tất cả ga và kết nối đã được kích hoạt."
    })


# ================================================================
# API - Danh sach cac thanh phan bi vo hieu hoa
# ================================================================

@app.route('/api/admin/disabled', methods=['GET'])
def api_disabled():
    """
    Tra ve danh sach cac ga va ket noi dang bi vo hieu hoa.

    Tra ve:
        JSON chua danh sach ga bi dong va ket noi bi dong.
    """
    # Tim cac ga bi vo hieu hoa
    disabled_stations = []
    for station in network.get_all_stations():
        if not station.is_active:
            disabled_stations.append(_station_to_dict(station))

    # Tim cac ket noi bi vo hieu hoa (loai bo trung lap)
    disabled_connections = []
    seen_connections: set[int] = set()

    for connections in network.adjacency_list.values():
        for conn in connections:
            conn_id = id(conn)
            if conn_id in seen_connections:
                continue
            seen_connections.add(conn_id)

            if not conn.is_active:
                disabled_connections.append({
                    "from": conn.station_a.id,
                    "from_name": conn.station_a.name,
                    "to": conn.station_b.id,
                    "to_name": conn.station_b.name,
                    "line": conn.line,
                })

    return jsonify({
        "disabled_stations": disabled_stations,
        "disabled_connections": disabled_connections,
    })


# ================================================================
# API - Du lieu do thi cho ban do map
# ================================================================

@app.route('/api/graph', methods=['GET'])
def api_graph():
    """
    Tra ve toan bo du lieu do thi de hien thi ban do map.

    Bao gom danh sach ga, ket noi (da loai trung lap), va thong tin tuyen.
    Moi ket noi chi xuat hien mot lan (khong trung lap).
    """
    # Danh sach tat ca cac ga
    stations = [_station_to_dict(s) for s in network.get_all_stations()]

    # Danh sach ket noi (loai trung lap - moi ket noi chi xuat hien mot lan)
    connections = []
    seen_connections: set[int] = set()

    for connections_list in network.adjacency_list.values():
        for conn in connections_list:
            conn_id = id(conn)
            if conn_id in seen_connections:
                continue
            seen_connections.add(conn_id)

            connections.append({
                "from": conn.station_a.id,
                "to": conn.station_b.id,
                "line": conn.line,
                "is_active": conn.is_active,
            })

    return jsonify({
        "stations": stations,
        "connections": connections,
        "lines": LINE_INFO,
    })


# ================================================================
# Diem khoi dong ung dung
# ================================================================

if __name__ == '__main__':
    print("Starting web server at http://0.0.0.0:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)
