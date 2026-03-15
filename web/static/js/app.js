// ==========================================
// Ung dung tim duong MRT Dai Bac
// Tep JavaScript chinh cho trang tim tuyen
// ==========================================

// ==========================================
// Du lieu toan cuc
// ==========================================
var allStations = [];
var lineInfo = {};
var selectedStart = null; // {id, name}
var selectedEnd = null;   // {id, name}

// Mau cua tung tuyen tau
const LINE_COLORS = {
    'BR': '#C48C31',
    'R':  '#E3002C',
    'G':  '#008659',
    'O':  '#F8B61C',
    'BL': '#0070BD'
};

// ==========================================
// Khoi tao ung dung khi trang tai xong
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    // Tai du lieu ga va tuyen
    await loadStations();
    await loadLineInfo();
    await loadNetworkStatus();

    // Thiet lap tu dong hoan thanh cho o nhap ga di
    setupAutocomplete('start-input', 'start-dropdown', (station) => {
        selectedStart = station;
        document.getElementById('start-input').value = `${station.id} - ${station.name}`;
    }, () => {
        // Xoa lua chon cu khi nguoi dung chinh sua o nhap
        selectedStart = null;
    });

    // Thiet lap tu dong hoan thanh cho o nhap ga den
    setupAutocomplete('end-input', 'end-dropdown', (station) => {
        selectedEnd = station;
        document.getElementById('end-input').value = `${station.id} - ${station.name}`;
    }, () => {
        // Xoa lua chon cu khi nguoi dung chinh sua o nhap
        selectedEnd = null;
    });

    // Gan su kien cho nut tim tuyen
    document.getElementById('find-route-btn').addEventListener('click', findRoute);

    // Gan su kien cho nut doi cho ga
    document.getElementById('swap-btn').addEventListener('click', swapStations);

    // Nhan Enter de chuyen o nhap hoac tim tuyen
    document.getElementById('start-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') document.getElementById('end-input').focus();
    });
    document.getElementById('end-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') findRoute();
    });

    // An danh sach go y khi bam ra ngoai
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.input-wrapper')) {
            document.querySelectorAll('.station-dropdown').forEach(d => {
                d.style.display = 'none';
            });
        }
    });
});

// ==========================================
// Tai danh sach tat ca cac ga
// ==========================================
async function loadStations() {
    try {
        const response = await fetch('/api/stations');
        if (!response.ok) throw new Error(`Loi HTTP: ${response.status}`);
        allStations = await response.json();
    } catch (error) {
        console.error('Khong the tai danh sach ga:', error);
        allStations = [];
    }
}

// ==========================================
// Tai thong tin cac tuyen tau
// ==========================================
async function loadLineInfo() {
    try {
        const response = await fetch('/api/lines');
        if (!response.ok) throw new Error(`Loi HTTP: ${response.status}`);
        lineInfo = await response.json();
    } catch (error) {
        console.error('Khong the tai thong tin tuyen:', error);
        lineInfo = {};
    }
}

// ==========================================
// Tai va hien thi trang thai mang luoi
// ==========================================
async function loadNetworkStatus() {
    const container = document.getElementById('network-status');
    if (!container) return;

    try {
        const response = await fetch('/api/network-status');
        if (!response.ok) throw new Error(`Loi HTTP: ${response.status}`);
        const data = await response.json();
        const status = data.status;
        const lines = data.lines;

        // Tao luoi hien thi thong ke mang luoi
        let html = '<div class="status-grid">';
        html += `
            <div class="status-item">
                <span class="status-value">${status.total_stations}</span>
                <span class="status-label">Tong so ga</span>
            </div>
            <div class="status-item">
                <span class="status-value">${status.active_stations}</span>
                <span class="status-label">Ga hoat dong</span>
            </div>
        `;

        // Hien thi so tuyen neu co
        if (status.total_lines !== undefined) {
            html += `
                <div class="status-item">
                    <span class="status-value">${status.total_lines}</span>
                    <span class="status-label">So tuyen</span>
                </div>
            `;
        }

        // Hien thi so ga trung chuyen neu co
        if (status.transfer_stations !== undefined) {
            html += `
                <div class="status-item">
                    <span class="status-value">${status.transfer_stations}</span>
                    <span class="status-label">Ga trung chuyen</span>
                </div>
            `;
        }

        html += '</div>';

        // Hien thi trang thai tung tuyen
        if (lines && Object.keys(lines).length > 0) {
            html += '<div class="lines-status">';
            for (const [code, info] of Object.entries(lines)) {
                const color = LINE_COLORS[code] || '#888';
                html += `
                    <div class="line-status-item">
                        <span class="line-dot" style="background:${color}"></span>
                        <span class="line-code">${code}</span>
                        <span class="line-name-status">${info.name || ''}</span>
                        <span class="line-station-count">${info.active_stations ?? 0}/${info.stations ?? 0} ga</span>
                    </div>
                `;
            }
            html += '</div>';
        }

        container.innerHTML = html;
    } catch (error) {
        console.error('Khong the tai trang thai mang luoi:', error);
        container.innerHTML = '<p class="error-text">Khong the tai trang thai mang luoi</p>';
    }
}

// ==========================================
// Thiet lap tinh nang tu dong hoan thanh
// ==========================================
function setupAutocomplete(inputId, dropdownId, onSelect, onClear) {
    const input = document.getElementById(inputId);
    const dropdown = document.getElementById(dropdownId);
    if (!input || !dropdown) return;

    let activeIndex = -1; // Vi tri hien tai trong danh sach go y

    // Xu ly khi nguoi dung nhap van ban
    input.addEventListener('input', () => {
        const query = input.value.trim().toLowerCase();
        activeIndex = -1;

        // Xoa lua chon cu khi nguoi dung chinh sua o nhap
        if (onClear) onClear();

        if (query.length === 0) {
            dropdown.style.display = 'none';
            return;
        }

        // Loc ga theo ten hoac ma (khong phan biet hoa thuong)
        const matches = allStations.filter(station => {
            const nameMatch = station.name.toLowerCase().includes(query);
            const idMatch = station.id.toLowerCase().includes(query);
            return nameMatch || idMatch;
        }).slice(0, 8); // Gioi han toi da 8 ket qua

        if (matches.length === 0) {
            dropdown.innerHTML = '<div class="dropdown-empty">Khong tim thay ga phu hop</div>';
            dropdown.style.display = 'block';
            return;
        }

        // Tao danh sach go y
        dropdown.innerHTML = matches.map((station, index) => {
            return formatStationBadge(station, index);
        }).join('');

        dropdown.style.display = 'block';

        // Gan su kien cho tung muc trong danh sach
        dropdown.querySelectorAll('.dropdown-item').forEach((item, index) => {
            item.addEventListener('click', () => {
                onSelect(matches[index]);
                dropdown.style.display = 'none';
                activeIndex = -1;
            });

            // Hieu ung khi re chuot
            item.addEventListener('mouseenter', () => {
                clearActiveItem(dropdown);
                item.classList.add('active');
                activeIndex = index;
            });
        });
    });

    // Dieu huong bang ban phim: len/xuong de chon, Enter de xac nhan
    input.addEventListener('keydown', (e) => {
        const items = dropdown.querySelectorAll('.dropdown-item');
        if (items.length === 0 || dropdown.style.display === 'none') return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            activeIndex = (activeIndex + 1) % items.length;
            clearActiveItem(dropdown);
            items[activeIndex].classList.add('active');
            items[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            activeIndex = (activeIndex - 1 + items.length) % items.length;
            clearActiveItem(dropdown);
            items[activeIndex].classList.add('active');
            items[activeIndex].scrollIntoView({ block: 'nearest' });
        } else if (e.key === 'Enter') {
            e.preventDefault();
            // Lay du lieu ga tu danh sach loc
            const query = input.value.trim().toLowerCase();
            const matches = allStations.filter(station => {
                const nameMatch = station.name.toLowerCase().includes(query);
                const idMatch = station.id.toLowerCase().includes(query);
                return nameMatch || idMatch;
            }).slice(0, 8);

            if (activeIndex >= 0 && activeIndex < items.length && matches[activeIndex]) {
                // Chon muc dang duoc danh dau
                onSelect(matches[activeIndex]);
                dropdown.style.display = 'none';
                activeIndex = -1;
            } else if (matches.length === 1) {
                // Chi co dung 1 ket qua — tu dong chon
                onSelect(matches[0]);
                dropdown.style.display = 'none';
                activeIndex = -1;
            } else if (matches.length > 0 && activeIndex === -1) {
                // Nhieu ket qua nhung chua chon — chon muc dau tien
                onSelect(matches[0]);
                dropdown.style.display = 'none';
                activeIndex = -1;
            }
        } else if (e.key === 'Escape') {
            dropdown.style.display = 'none';
            activeIndex = -1;
        }
    });

    // Hien thi lai danh sach khi focus vao o nhap (neu co noi dung)
    input.addEventListener('focus', () => {
        if (input.value.trim().length > 0 && dropdown.children.length > 0) {
            dropdown.style.display = 'block';
        }
    });
}

// ==========================================
// Xoa trang thai active cua tat ca muc
// ==========================================
function clearActiveItem(dropdown) {
    dropdown.querySelectorAll('.dropdown-item.active').forEach(item => {
        item.classList.remove('active');
    });
}

// ==========================================
// Doi cho ga di va ga den
// ==========================================
function swapStations() {
    // Doi cho du lieu
    const temp = selectedStart;
    selectedStart = selectedEnd;
    selectedEnd = temp;

    // Cap nhat gia tri o nhap
    const startInput = document.getElementById('start-input');
    const endInput = document.getElementById('end-input');
    const tempValue = startInput.value;
    startInput.value = endInput.value;
    endInput.value = tempValue;

    // Hieu ung xoay nut doi cho
    const swapBtn = document.getElementById('swap-btn');
    if (swapBtn) {
        swapBtn.classList.add('rotating');
        setTimeout(() => {
            swapBtn.classList.remove('rotating');
        }, 400);
    }
}

// ==========================================
// Phan giai ga tu noi dung o nhap (du phong khi nguoi dung khong chon tu danh sach)
// ==========================================
function resolveStationFromInput(inputId) {
    const value = document.getElementById(inputId).value.trim().toLowerCase();
    if (!value) return null;

    // Thu khop chinh xac theo dinh dang "ID - Ten" hoac chi ID
    return allStations.find(station => {
        const formatted = `${station.id} - ${station.name}`.toLowerCase();
        return formatted === value || station.id.toLowerCase() === value;
    }) || null;
}

// ==========================================
// Tim tuyen di chuyen
// ==========================================
async function findRoute() {
    // Du phong: thu phan giai ga tu noi dung o nhap neu chua chon tu danh sach
    if (!selectedStart) {
        selectedStart = resolveStationFromInput('start-input');
    }
    if (!selectedEnd) {
        selectedEnd = resolveStationFromInput('end-input');
    }

    // Kiem tra da chon ca ga di va ga den chua
    if (!selectedStart) {
        displayRouteError('Vui long chon ga di.');
        return;
    }
    if (!selectedEnd) {
        displayRouteError('Vui long chon ga den.');
        return;
    }
    if (selectedStart.id === selectedEnd.id) {
        displayRouteError('Ga di va ga den khong duoc trung nhau.');
        return;
    }

    const btn = document.getElementById('find-route-btn');
    const originalText = btn.innerHTML;

    // Hien thi trang thai dang tai
    btn.disabled = true;
    btn.innerHTML = '<span class="loading-spinner"></span> Dang tim tuyen...';
    btn.classList.add('loading');

    try {
        const response = await fetch('/api/find-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                start: selectedStart.id,
                end: selectedEnd.id
            })
        });

        const data = await response.json();

        if (data.success && data.route) {
            displayRouteResult(data.route);
        } else {
            displayRouteError(data.error || 'Khong tim duoc tuyen di chuyen.');
        }
    } catch (error) {
        console.error('Loi khi tim tuyen:', error);
        displayRouteError('Loi ket noi may chu. Vui long thu lai.');
    } finally {
        // Khoi phuc trang thai nut
        btn.disabled = false;
        btn.innerHTML = originalText;
        btn.classList.remove('loading');
    }
}

// ==========================================
// Hien thi ket qua tuyen di chuyen
// ==========================================
function displayRouteResult(route) {
    const resultDiv = document.getElementById('route-result');
    const errorDiv = document.getElementById('route-error');
    if (!resultDiv) return;

    // An thong bao loi neu dang hien
    if (errorDiv) errorDiv.style.display = 'none';

    // Tao phan tom tat thong tin tuyen
    let html = `
        <div class="result-summary">
            <div class="summary-item">
                <span class="summary-value">${route.num_stops}</span>
                <span class="summary-label">So ga</span>
            </div>
            <div class="summary-item">
                <span class="summary-value">${route.num_transfers}</span>
                <span class="summary-label">Doi tuyen</span>
            </div>
            <div class="summary-item">
                <span class="summary-value">${route.total_cost}</span>
                <span class="summary-label">Chi phi</span>
            </div>
        </div>
    `;

    // Tao dong thoi gian tuyen di chuyen
    html += '<div class="route-timeline">';

    route.segments.forEach((segment, segIndex) => {
        const segColor = segment.color || LINE_COLORS[segment.line] || '#888';

        html += `
            <div class="segment">
                <div class="segment-line" style="background:${segColor}"></div>
                <div class="segment-header">
                    <span class="line-badge" style="background:${segColor}">${segment.line}</span>
                    <span>${segment.line_name}</span>
                </div>
        `;

        // Hien thi tung ga trong doan tuyen
        segment.stations.forEach((station, stIndex) => {
            const isFirst = stIndex === 0;
            const isLast = stIndex === segment.stations.length - 1;
            let stopClass = 'station-stop';
            if (isFirst) stopClass += ' first-stop';
            if (isLast) stopClass += ' last-stop';

            html += `
                <div class="${stopClass}">
                    <div class="station-dot" style="border-color:${segColor}"></div>
                    <span class="station-id">${station.id}</span>
                    <span class="station-name">${station.name}</span>
                </div>
            `;
        });

        html += '</div>'; // Dong .segment

        // Hien thi dau hieu doi tuyen (tru doan cuoi cung)
        if (segIndex < route.segments.length - 1) {
            html += `
                <div class="transfer-marker">
                    <span class="material-symbols-outlined">transfer_within_a_station</span>
                    <span>Doi tuyen tai ${segment.to_name}</span>
                </div>
            `;
        }
    });

    html += '</div>'; // Dong .route-timeline

    resultDiv.innerHTML = html;

    // Hieu ung hien thi ket qua (truot xuong)
    resultDiv.style.display = 'none';
    resultDiv.style.opacity = '0';
    resultDiv.style.transform = 'translateY(-10px)';
    resultDiv.style.display = 'block';

    // Kich hoat hieu ung chuyen dong
    requestAnimationFrame(() => {
        resultDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        resultDiv.style.opacity = '1';
        resultDiv.style.transform = 'translateY(0)';
    });

    // To sang tuyen tren ban do (neu co module ban do)
    highlightRouteOnMap(route);
}

// ==========================================
// Hien thi thong bao loi
// ==========================================
function displayRouteError(message) {
    const resultDiv = document.getElementById('route-result');
    const errorDiv = document.getElementById('route-error');

    // An ket qua cu neu dang hien
    if (resultDiv) resultDiv.style.display = 'none';

    if (!errorDiv) return;

    errorDiv.innerHTML = `
        <div class="error-content">
            <span class="material-symbols-outlined error-icon">warning</span>
            <span class="error-message">${message}</span>
        </div>
    `;

    // Hieu ung hien thi
    errorDiv.style.display = 'none';
    errorDiv.style.opacity = '0';
    errorDiv.style.display = 'block';

    requestAnimationFrame(() => {
        errorDiv.style.transition = 'opacity 0.3s ease';
        errorDiv.style.opacity = '1';
    });
}

// ==========================================
// To sang tuyen di chuyen tren ban do SVG
// ==========================================
function highlightRouteOnMap(route) {
    // Kiem tra module ban do da duoc tai chua
    if (window.mapModule && typeof window.mapModule.highlightRoute === 'function') {
        window.mapModule.highlightRoute(route.station_ids, route.segments);
    }
}

// ==========================================
// Xoa to sang tuyen tren ban do
// ==========================================
function clearRouteHighlight() {
    if (window.mapModule && typeof window.mapModule.clearHighlight === 'function') {
        window.mapModule.clearHighlight();
    }
}

// ==========================================
// Ham tro giup: Tao cac cham mau tuyen
// Tra ve HTML cac cham mau nho dai dien cho tung tuyen ma ga thuoc ve
// ==========================================
function createLineDots(lines) {
    if (!lines || lines.length === 0) return '';

    return lines.map(lineCode => {
        const color = LINE_COLORS[lineCode] || '#888';
        return `<span class="line-dot" style="background:${color}" title="Tuyen ${lineCode}"></span>`;
    }).join('');
}

// ==========================================
// Ham tro giup: Tao HTML hien thi ga trong danh sach go y
// Bao gom: cham mau tuyen, ma ga, ten ga, huy hieu trung chuyen
// ==========================================
function formatStationBadge(station, index) {
    const dots = createLineDots(station.lines);

    // Huy hieu trung chuyen cho ga co nhieu tuyen
    let transferBadge = '';
    if (station.is_transfer) {
        transferBadge = '<span class="transfer-badge">Trung Chuyen</span>';
    }

    // Huy hieu ga cuoi cho ga cuoi tuyen
    let terminalBadge = '';
    if (station.is_terminal) {
        terminalBadge = '<span class="terminal-badge">Ga Cuoi</span>';
    }

    // Trang thai hoat dong
    const inactiveClass = station.is_active === false ? ' inactive' : '';

    return `
        <div class="dropdown-item${inactiveClass}" data-index="${index}">
            <div class="dropdown-item-left">
                <div class="line-dots">${dots}</div>
                <span class="station-id-badge">${station.id}</span>
                <span class="station-name-text">${station.name}</span>
            </div>
            <div class="dropdown-item-right">
                ${transferBadge}
                ${terminalBadge}
            </div>
        </div>
    `;
}
