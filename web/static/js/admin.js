// ==========================================
// Quản lý giao diện quản trị MRT Đài Bắc
// ==========================================

let allStations = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadStations();
    await refreshDashboard();
    populateStationSelects();
});

async function loadStations() {
    const resp = await fetch('/api/stations');
    allStations = await resp.json();
    // Sắp xếp theo mã ga
    allStations.sort((a, b) => a.id.localeCompare(b.id));
}

function populateStationSelects() {
    const selects = ['station-select', 'conn-station-a', 'conn-station-b'];
    for (const selId of selects) {
        const sel = document.getElementById(selId);
        // Giữ lại tùy chọn mặc định đầu tiên
        sel.innerHTML = '<option value="">-- Chọn ga --</option>';
        for (const s of allStations) {
            const opt = document.createElement('option');
            opt.value = s.id;
            const status = s.is_active ? '' : ' [ĐÓNG CỬA]';
            opt.textContent = `${s.id} - ${s.name}${status}`;
            if (!s.is_active) opt.style.color = '#E3002C';
            sel.appendChild(opt);
        }
    }
}

async function refreshDashboard() {
    // Lấy trạng thái mạng lưới
    const resp = await fetch('/api/network-status');
    const data = await resp.json();
    const status = data.status;

    // Cập nhật các thẻ thống kê
    setText('stat-total-stations', status.total_stations);
    setText('stat-active-stations', status.active_stations);
    setText('stat-closed-stations', status.closed_stations);
    setText('stat-total-connections', status.total_connections);
    setText('stat-active-connections', status.active_connections);
    setText('stat-closed-connections', status.closed_connections);

    // Lấy và hiển thị danh sách phần tử đang đóng
    await refreshDisabledList();
}

function setText(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        card.querySelector('.stat-value').textContent = value;
    }
}

async function refreshDisabledList() {
    const resp = await fetch('/api/admin/disabled');
    const data = await resp.json();
    const container = document.getElementById('disabled-list');

    if (data.disabled_stations.length === 0 && data.disabled_connections.length === 0) {
        container.innerHTML = '<p class="empty-state">Không có phần tử nào đang đóng cửa.</p>';
        return;
    }

    let html = '';

    if (data.disabled_stations.length > 0) {
        html += '<h4>Ga đóng cửa</h4>';
        html += '<div class="disabled-items">';
        for (const s of data.disabled_stations) {
            html += `<div class="disabled-item station-item">
                <span class="material-symbols-outlined">train</span>
                <span class="item-id">${s.id}</span>
                <span class="item-name">${s.name}</span>
                <span class="item-lines">${s.lines.join(', ')}</span>
                <button class="btn btn-sm btn-success" onclick="enableStation('${s.id}')">
                    Mở lại
                </button>
            </div>`;
        }
        html += '</div>';
    }

    if (data.disabled_connections.length > 0) {
        html += '<h4>Kết nối đóng</h4>';
        html += '<div class="disabled-items">';
        for (const c of data.disabled_connections) {
            html += `<div class="disabled-item connection-item">
                <span class="material-symbols-outlined">conversion_path</span>
                <span class="item-name">${c.from} (${c.from_name}) ↔ ${c.to} (${c.to_name})</span>
                <span class="item-lines">${c.line}</span>
                <button class="btn btn-sm btn-success" onclick="enableConnection('${c.from}', '${c.to}')">
                    Mở lại
                </button>
            </div>`;
        }
        html += '</div>';
    }

    container.innerHTML = html;
}

// ==========================================
// Các thao tác quản trị
// ==========================================

async function disableStation(stationId) {
    if (!stationId) {
        stationId = document.getElementById('station-select').value;
    }
    if (!stationId) {
        showToast('Vui lòng chọn ga.', 'warning');
        return;
    }

    const resp = await fetch('/api/admin/disable-station', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({station_id: stationId})
    });
    const data = await resp.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) {
        await loadStations();
        populateStationSelects();
        await refreshDashboard();
    }
}

async function enableStation(stationId) {
    if (!stationId) {
        stationId = document.getElementById('station-select').value;
    }
    if (!stationId) {
        showToast('Vui lòng chọn ga.', 'warning');
        return;
    }

    const resp = await fetch('/api/admin/enable-station', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({station_id: stationId})
    });
    const data = await resp.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) {
        await loadStations();
        populateStationSelects();
        await refreshDashboard();
    }
}

async function disableLine() {
    const lineId = document.getElementById('line-select').value;
    if (!lineId) {
        showToast('Vui lòng chọn tuyến.', 'warning');
        return;
    }

    const resp = await fetch('/api/admin/disable-line', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({line: lineId})
    });
    const data = await resp.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) await refreshDashboard();
}

async function enableLine() {
    const lineId = document.getElementById('line-select').value;
    if (!lineId) {
        showToast('Vui lòng chọn tuyến.', 'warning');
        return;
    }

    const resp = await fetch('/api/admin/enable-line', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({line: lineId})
    });
    const data = await resp.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) await refreshDashboard();
}

async function disableConnection() {
    const a = document.getElementById('conn-station-a').value;
    const b = document.getElementById('conn-station-b').value;
    if (!a || !b) {
        showToast('Vui lòng chọn cả hai ga.', 'warning');
        return;
    }

    const resp = await fetch('/api/admin/disable-connection', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({station_a: a, station_b: b})
    });
    const data = await resp.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) await refreshDashboard();
}

async function enableConnection(a, b) {
    if (!a) a = document.getElementById('conn-station-a').value;
    if (!b) b = document.getElementById('conn-station-b').value;
    if (!a || !b) {
        showToast('Vui lòng chọn cả hai ga.', 'warning');
        return;
    }

    const resp = await fetch('/api/admin/enable-connection', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({station_a: a, station_b: b})
    });
    const data = await resp.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) await refreshDashboard();
}

async function resetAll() {
    if (!confirm('Bạn có chắc muốn đặt lại toàn bộ mạng lưới?')) return;

    const resp = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: {'Content-Type': 'application/json'}
    });
    const data = await resp.json();
    showToast(data.message, data.success ? 'success' : 'error');
    if (data.success) {
        await loadStations();
        populateStationSelects();
        await refreshDashboard();
    }
}

// ==========================================
// Thông báo toast
// ==========================================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'block';

    // Kích hoạt hiệu ứng chuyển tiếp bằng cách thêm lớp 'show' sau một frame
    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    // Tự động ẩn sau 3 giây
    setTimeout(() => {
        toast.classList.remove('show');
        // Ẩn hoàn toàn sau khi hiệu ứng chuyển tiếp kết thúc
        setTimeout(() => {
            toast.style.display = 'none';
        }, 400);
    }, 3000);
}
