// Quan ly giao dien quan tri MRT Dai Bac

let allStations = [];

document.addEventListener('DOMContentLoaded', async () => {
    await loadStations();
    populateStationSelects();
    await refreshDashboard();
});

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

function jsArg(str) {
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function loadStations() {
    try {
        const resp = await fetch('/api/stations');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        allStations = await resp.json();
        allStations.sort((a, b) => a.id.localeCompare(b.id));
    } catch (error) {
        console.error('Không thể tải danh sách ga:', error);
        allStations = [];
        showToast('Không thể tải danh sách ga.', 'error');
    }
}

function populateStationSelects() {
    const selects = ['station-select', 'conn-station-a', 'conn-station-b'];

    for (const selId of selects) {
        const sel = document.getElementById(selId);
        if (!sel) continue;

        sel.innerHTML = '<option value="">-- Chọn ga --</option>';

        for (const station of allStations) {
            const opt = document.createElement('option');
            opt.value = station.id;
            const status = station.is_active ? '' : ' [ĐÓNG CỬA]';
            opt.textContent = `${station.id} - ${station.name}${status}`;
            if (!station.is_active) opt.style.color = '#d94d57';
            sel.appendChild(opt);
        }
    }
}

async function refreshDashboard() {
    try {
        const resp = await fetch('/api/network-status');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const status = data.status;

        setText('stat-total-stations', status.total_stations);
        setText('stat-active-stations', status.active_stations);
        setText('stat-closed-stations', status.closed_stations);
        setText('stat-total-connections', status.total_connections);
        setText('stat-active-connections', status.active_connections);
        setText('stat-closed-connections', status.closed_connections);

        await refreshDisabledList();
    } catch (error) {
        console.error('Không thể tải trạng thái mạng lưới:', error);
        showToast('Không thể tải trạng thái mạng lưới.', 'error');
    }
}

function setText(cardId, value) {
    const card = document.getElementById(cardId);
    if (card) {
        card.querySelector('.stat-value').textContent = value ?? '-';
    }
}

async function refreshDisabledList() {
    const container = document.getElementById('disabled-list');
    if (!container) return;

    try {
        const resp = await fetch('/api/admin/disabled');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (data.disabled_stations.length === 0 && data.disabled_connections.length === 0) {
            container.innerHTML = '<p class="empty-state">Không có phần tử nào đang đóng cửa.</p>';
            return;
        }

        let html = '';

        if (data.disabled_stations.length > 0) {
            html += '<h4>Ga đóng cửa</h4>';
            html += '<div class="disabled-items">';
            for (const station of data.disabled_stations) {
                html += `<div class="disabled-item station-item">
                    <span class="material-symbols-outlined" aria-hidden="true">train</span>
                    <span class="item-id">${escapeHtml(station.id)}</span>
                    <span class="item-name">${escapeHtml(station.name)}</span>
                    <span class="item-lines">${escapeHtml(station.lines.join(', '))}</span>
                    <button class="btn btn-sm btn-success" onclick="enableStation('${jsArg(station.id)}')">
                        Mở lại
                    </button>
                </div>`;
            }
            html += '</div>';
        }

        if (data.disabled_connections.length > 0) {
            html += '<h4>Kết nối đóng</h4>';
            html += '<div class="disabled-items">';
            for (const conn of data.disabled_connections) {
                html += `<div class="disabled-item connection-item">
                    <span class="material-symbols-outlined" aria-hidden="true">conversion_path</span>
                    <span class="item-name">${escapeHtml(conn.from)} (${escapeHtml(conn.from_name)}) - ${escapeHtml(conn.to)} (${escapeHtml(conn.to_name)})</span>
                    <span class="item-lines">${escapeHtml(conn.line)}</span>
                    <button class="btn btn-sm btn-success" onclick="enableConnection('${jsArg(conn.from)}', '${jsArg(conn.to)}')">
                        Mở lại
                    </button>
                </div>`;
            }
            html += '</div>';
        }

        container.innerHTML = html;
    } catch (error) {
        console.error('Không thể tải danh sách đóng cửa:', error);
        container.innerHTML = '<p class="error-text">Không thể tải danh sách phần tử đang đóng cửa.</p>';
    }
}

async function postAdminAction(endpoint, body) {
    const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body ?? {})
    });

    const data = await resp.json();
    showToast(data.message || data.error || 'Yêu cầu đã được xử lý.', data.success ? 'success' : 'error');
    return data;
}

async function refreshAllAdminData() {
    await loadStations();
    populateStationSelects();
    await refreshDashboard();
}

async function disableStation(stationId) {
    const id = stationId || document.getElementById('station-select').value;
    if (!id) {
        showToast('Vui lòng chọn ga.', 'warning');
        return;
    }

    const data = await postAdminAction('/api/admin/disable-station', { station_id: id });
    if (data.success) await refreshAllAdminData();
}

async function enableStation(stationId) {
    const id = stationId || document.getElementById('station-select').value;
    if (!id) {
        showToast('Vui lòng chọn ga.', 'warning');
        return;
    }

    const data = await postAdminAction('/api/admin/enable-station', { station_id: id });
    if (data.success) await refreshAllAdminData();
}

async function disableLine() {
    const line = document.getElementById('line-select').value;
    if (!line) {
        showToast('Vui lòng chọn tuyến.', 'warning');
        return;
    }

    const data = await postAdminAction('/api/admin/disable-line', { line });
    if (data.success) await refreshDashboard();
}

async function enableLine() {
    const line = document.getElementById('line-select').value;
    if (!line) {
        showToast('Vui lòng chọn tuyến.', 'warning');
        return;
    }

    const data = await postAdminAction('/api/admin/enable-line', { line });
    if (data.success) await refreshDashboard();
}

async function disableConnection() {
    const stationA = document.getElementById('conn-station-a').value;
    const stationB = document.getElementById('conn-station-b').value;

    if (!stationA || !stationB) {
        showToast('Vui lòng chọn cả hai ga.', 'warning');
        return;
    }

    const data = await postAdminAction('/api/admin/disable-connection', {
        station_a: stationA,
        station_b: stationB
    });
    if (data.success) await refreshDashboard();
}

async function enableConnection(stationA, stationB) {
    const a = stationA || document.getElementById('conn-station-a').value;
    const b = stationB || document.getElementById('conn-station-b').value;

    if (!a || !b) {
        showToast('Vui lòng chọn cả hai ga.', 'warning');
        return;
    }

    const data = await postAdminAction('/api/admin/enable-connection', {
        station_a: a,
        station_b: b
    });
    if (data.success) await refreshDashboard();
}

async function resetAll() {
    if (!confirm('Bạn có chắc muốn đặt lại toàn bộ mạng lưới?')) return;

    const data = await postAdminAction('/api/admin/reset');
    if (data.success) await refreshAllAdminData();
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const iconMap = {
        success: 'check_circle',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };

    window.clearTimeout(toast._hideTimer);
    window.clearTimeout(toast._removeTimer);

    toast.innerHTML = `
        <span class="material-symbols-outlined" aria-hidden="true">${iconMap[type] || iconMap.info}</span>
        <span class="toast-message">${escapeHtml(message)}</span>
    `;
    toast.className = `toast toast-${type}`;
    toast.style.display = 'flex';

    requestAnimationFrame(() => {
        toast.classList.add('show');
    });

    toast._hideTimer = window.setTimeout(() => {
        toast.classList.remove('show');
        toast._removeTimer = window.setTimeout(() => {
            toast.style.display = 'none';
        }, 350);
    }, 3200);
}
