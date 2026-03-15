// ==========================================
// Ban do MRT Dai Bac tuong tac (Leaflet)
// Hien thi mang luoi tren ban do tile,
// ho tro to sang tuyen di chuyen
// Bam 2 diem bat ky tren ban do de tim duong
// ==========================================

// ==========================================
// Tien ich chong XSS
// ==========================================
function escapeHtmlMap(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(String(str)));
    return div.innerHTML;
}

// Mau cua tung tuyen
const MAP_LINE_COLORS = {
    'BR': '#C48C31',
    'R':  '#E3002C',
    'G':  '#008659',
    'O':  '#F8B61C',
    'BL': '#0070BD'
};

// ==========================================
// Trang thai module ban do
// ==========================================
let leafletMap = null;
let graphData = null;
let connectionLayers = [];   // Cac polyline ket noi
let stationMarkers = {};     // Ma ga -> circle marker
let highlightLayers = [];    // Cac layer to sang tuyen
let routeHighlighted = false;

// ==========================================
// Trang thai click-to-route (bam 2 diem)
// ==========================================
let clickMarkerA = null;     // Marker diem A (xuat phat)
let clickMarkerB = null;     // Marker diem B (dich)
let walkingLineA = null;     // Duong di bo tu A den ga gan nhat
let walkingLineB = null;     // Duong di bo tu ga gan nhat den B
let nearestStationA = null;  // Ga MRT gan nhat voi A
let nearestStationB = null;  // Ga MRT gan nhat voi B
let clickState = 0;          // 0 = chua bam, 1 = da bam A, 2 = da bam A+B

// ==========================================
// Khoi tao ban do khi trang tai xong
// ==========================================
function initLeafletMap() {
    // Tranh khoi tao lap
    if (leafletMap) {
        console.warn('Ban do da duoc khoi tao, bo qua.');
        return;
    }

    // Kiem tra Leaflet da duoc tai chua, neu chua thi tu dong tai
    if (typeof L === 'undefined') {
        console.warn('Leaflet (L) chua duoc tai. Tu dong tai tu CDN...');
        // Tai CSS cua Leaflet
        if (!document.querySelector('link[href*="leaflet"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            document.head.appendChild(link);
        }
        // Tai JS cua Leaflet
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => {
            console.log('Leaflet da tai xong, khoi tao ban do...');
            initLeafletMap(); // Goi lai sau khi tai xong
        };
        script.onerror = () => {
            console.error('Khong the tai Leaflet tu CDN.');
        };
        document.head.appendChild(script);
        return;
    }

    // Tim hoac tao phan tu #leaflet-map
    let mapContainer = document.getElementById('leaflet-map');

    // Neu khong tim thay (vi trinh duyet cache HTML cu), tu dong tao moi
    if (!mapContainer) {
        console.warn('#leaflet-map khong ton tai, tu dong tao trong #map-container');
        const parent = document.getElementById('map-container');
        if (!parent) {
            console.error('Khong tim thay ca #leaflet-map lan #map-container. Khong the khoi tao ban do.');
            return;
        }
        // Xoa noi dung cu (VD: SVG cu da cache)
        parent.innerHTML = '';
        // Tao div moi cho Leaflet
        mapContainer = document.createElement('div');
        mapContainer.id = 'leaflet-map';
        parent.appendChild(mapContainer);
    }

    // Dam bao container co kich thuoc (can thiet de Leaflet render tile)
    // Dung calc() truc tiep tren element de khong phu thuoc vao CSS cache
    if (mapContainer.offsetHeight < 10) {
        mapContainer.style.width = '100%';
        mapContainer.style.height = 'calc(100vh - 280px)';
        mapContainer.style.minHeight = '400px';
    }

    console.log('Leaflet container:', mapContainer.offsetWidth, 'x', mapContainer.offsetHeight);

    // Khoi tao Leaflet map, trung tam tai Dai Bac
    leafletMap = L.map(mapContainer, {
        center: [25.048, 121.517],
        zoom: 12,
        zoomControl: true
    });

    // Them tile layer — OpenStreetMap DE (nhan tieng Anh / Latin cho khu vuc chau A)
    L.tileLayer('https://tile.openstreetmap.de/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
    }).addTo(leafletMap);

    // Dam bao Leaflet tinh lai kich thuoc container
    setTimeout(() => { leafletMap.invalidateSize(); }, 200);
    setTimeout(() => { leafletMap.invalidateSize(); }, 1000);

    // Dung ResizeObserver de tu dong cap nhat khi container thay doi kich thuoc
    if (window.ResizeObserver) {
        new ResizeObserver(() => { leafletMap.invalidateSize(); }).observe(mapContainer);
    }

    // Them su kien click tren ban do de chon 2 diem A, B
    leafletMap.on('click', onMapClick);

    // Hien thi huong dan ban dau
    showMapInstruction('Bam vao ban do de chon diem xuat phat (A)');

    loadAndRenderMap();
}

// Khoi chay khi DOM san sang, hoac ngay lap tuc neu da san sang
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initLeafletMap);
} else {
    // DOM da san sang (DOMContentLoaded da fire truoc khi script nay chay)
    initLeafletMap();
}

// ==========================================
// Tai du lieu do thi va ve ban do
// ==========================================
async function loadAndRenderMap() {
    try {
        const response = await fetch('/api/graph');
        if (!response.ok) throw new Error(`Loi HTTP: ${response.status}`);
        graphData = await response.json();

        // Tao ban do tra cuu ga theo id
        const stationMap = {};
        for (const station of graphData.stations) {
            stationMap[station.id] = station;
        }

        // Ve ket noi (duong noi giua cac ga)
        renderConnections(graphData.connections, stationMap);

        // Ve cac ga (circle marker)
        renderStations(graphData.stations);

        console.log(`Ban do da ve: ${graphData.stations.length} ga, ${graphData.connections.length} ket noi. Click-to-route san sang!`);
    } catch (error) {
        console.error('Khong the tai du lieu ban do:', error);
    }
}

// ==========================================
// Tinh khoang cach haversine (km)
// ==========================================
function haversineKm(lat1, lng1, lat2, lng2) {
    const R = 6371; // Ban kinh Trai Dat (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ==========================================
// Tim ga MRT gan nhat voi 1 toa do
// ==========================================
function findNearestStation(lat, lng) {
    if (!graphData || !graphData.stations) return null;
    let best = null;
    let bestDist = Infinity;
    for (const station of graphData.stations) {
        if (station.lat == null || station.lng == null) continue;
        if (!station.is_active) continue;
        const d = haversineKm(lat, lng, station.lat, station.lng);
        if (d < bestDist) {
            bestDist = d;
            best = station;
        }
    }
    return best ? { station: best, distance: bestDist } : null;
}

// ==========================================
// Hien thi huong dan tren ban do
// ==========================================
function showMapInstruction(text) {
    let instrEl = document.getElementById('map-instruction');
    if (!instrEl) {
        instrEl = document.createElement('div');
        instrEl.id = 'map-instruction';
        instrEl.style.cssText = `
            position: absolute; top: 10px; left: 50%; transform: translateX(-50%);
            z-index: 1000; background: rgba(15,23,42,0.88); color: #fff;
            padding: 8px 18px; border-radius: 20px; font-size: 13px; font-weight: 500;
            pointer-events: none; white-space: nowrap; backdrop-filter: blur(6px);
            box-shadow: 0 2px 12px rgba(0,0,0,0.2); transition: opacity 0.3s;
        `;
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            mapContainer.style.position = 'relative';
            mapContainer.appendChild(instrEl);
        }
    }
    instrEl.textContent = text;
    instrEl.style.opacity = '1';
}

function hideMapInstruction() {
    const instrEl = document.getElementById('map-instruction');
    if (instrEl) instrEl.style.opacity = '0';
}

// ==========================================
// Xoa trang thai click-to-route
// ==========================================
function clearClickToRoute() {
    if (clickMarkerA) { leafletMap.removeLayer(clickMarkerA); clickMarkerA = null; }
    if (clickMarkerB) { leafletMap.removeLayer(clickMarkerB); clickMarkerB = null; }
    if (walkingLineA) { leafletMap.removeLayer(walkingLineA); walkingLineA = null; }
    if (walkingLineB) { leafletMap.removeLayer(walkingLineB); walkingLineB = null; }
    nearestStationA = null;
    nearestStationB = null;
    clickState = 0;
}

// ==========================================
// Tao custom icon cho marker A/B
// ==========================================
function createPointIcon(label, color) {
    return L.divIcon({
        className: 'click-point-icon',
        html: `<div style="
            width:32px; height:32px; border-radius:50%; background:${color};
            color:#fff; display:flex; align-items:center; justify-content:center;
            font-weight:700; font-size:14px; font-family:Inter,sans-serif;
            box-shadow:0 2px 8px rgba(0,0,0,0.35); border:2px solid #fff;
        ">${label}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

// ==========================================
// Xu ly khi bam vao ban do (click-to-route)
// ==========================================
function onMapClick(e) {
    console.log('=== MAP CLICK ===', e.latlng, 'clickState:', clickState, 'graphData:', !!graphData);

    if (!graphData) {
        console.warn('graphData chua san sang, bo qua click');
        return;
    }

    const lat = e.latlng.lat;
    const lng = e.latlng.lng;

    if (clickState === 0 || clickState === 2) {
        // Bam lan 1 (hoac reset): Chon diem A
        // Xoa trang thai cu
        clearClickToRoute();
        if (window.mapModule) window.mapModule.clearHighlight();

        // An ket qua tuyen cu
        const resultDiv = document.getElementById('route-result');
        if (resultDiv) resultDiv.style.display = 'none';
        const errorDiv = document.getElementById('route-error');
        if (errorDiv) errorDiv.style.display = 'none';

        // Tim ga gan nhat
        const nearest = findNearestStation(lat, lng);
        if (!nearest) return;
        nearestStationA = nearest;

        // Dat marker A (khong tuong tac de khong chan map click)
        clickMarkerA = L.marker([lat, lng], {
            icon: createPointIcon('A', '#E3002C'),
            interactive: false
        }).addTo(leafletMap);

        // Ve duong di bo tu A den ga gan nhat
        walkingLineA = L.polyline(
            [[lat, lng], [nearest.station.lat, nearest.station.lng]],
            { color: '#666', weight: 3, opacity: 0.8, dashArray: '6, 6' }
        ).addTo(leafletMap);

        // Cap nhat form
        const startInput = document.getElementById('start-input');
        if (startInput) {
            startInput.value = `${nearest.station.id} - ${nearest.station.name}`;
        }
        if (typeof selectedStart !== 'undefined') {
            selectedStart = { id: nearest.station.id, name: nearest.station.name };
        }

        clickState = 1;
        showMapInstruction('Bam vao ban do de chon diem den (B)');

    } else if (clickState === 1) {
        // Bam lan 2: Chon diem B
        const nearest = findNearestStation(lat, lng);
        if (!nearest) return;
        nearestStationB = nearest;

        // Dat marker B
        clickMarkerB = L.marker([lat, lng], { icon: createPointIcon('B', '#0070BD') })
            .addTo(leafletMap)
            .bindPopup(`<strong>Diem B</strong><br>Ga gan nhat: ${escapeHtmlMap(nearest.station.name)} (${escapeHtmlMap(nearest.station.id)})<br>Khoang cach: ${nearest.distance.toFixed(2)} km`);

        // Ve duong di bo tu ga gan nhat den B
        walkingLineB = L.polyline(
            [[nearest.station.lat, nearest.station.lng], [lat, lng]],
            { color: '#666', weight: 3, opacity: 0.8, dashArray: '6, 6' }
        ).addTo(leafletMap);

        // Cap nhat form
        const endInput = document.getElementById('end-input');
        if (endInput) {
            endInput.value = `${nearest.station.id} - ${nearest.station.name}`;
        }
        if (typeof selectedEnd !== 'undefined') {
            selectedEnd = { id: nearest.station.id, name: nearest.station.name };
        }

        clickState = 2;
        showMapInstruction('Dang tim duong...');

        // Tu dong tim tuyen
        autoFindRouteFromClicks();
    }
}

// ==========================================
// Tu dong tim tuyen sau khi chon 2 diem
// ==========================================
async function autoFindRouteFromClicks() {
    if (!nearestStationA || !nearestStationB) return;

    const stA = nearestStationA.station;
    const stB = nearestStationB.station;

    // Kiem tra 2 ga co trung nhau khong
    if (stA.id === stB.id) {
        showMapInstruction('2 diem cung gan 1 ga — hay di bo!');
        displayRouteError('Ga xuat phat va ga dich trung nhau. Ban chi can di bo!');
        return;
    }

    // Hien thi loading
    const btn = document.getElementById('find-route-btn');
    let originalText = '';
    if (btn) {
        originalText = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Dang tim tuyen...';
        btn.classList.add('loading');
    }

    try {
        const response = await fetch('/api/find-route', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ start: stA.id, end: stB.id })
        });

        const data = await response.json();

        if (data.success && data.route) {
            // Tinh khoang cach di bo
            const walkA = nearestStationA.distance;
            const walkB = nearestStationB.distance;

            // Hien thi ket qua voi thong tin di bo
            displayClickRouteResult(data.route, walkA, walkB);

            // To sang tuyen tren ban do
            highlightClickRoute(data.route);

            showMapInstruction('Bam lai ban do de tim tuyen moi');
        } else {
            displayRouteError(data.error || 'Khong tim duoc tuyen di chuyen.');
            showMapInstruction('Khong tim duoc tuyen. Bam lai de thu lai.');
        }
    } catch (error) {
        console.error('Loi tim tuyen:', error);
        displayRouteError('Loi ket noi may chu. Vui long thu lai.');
        showMapInstruction('Loi ket noi. Bam lai de thu lai.');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalText;
            btn.classList.remove('loading');
        }
    }
}

// ==========================================
// Hien thi ket qua tim tuyen voi thong tin di bo
// ==========================================
function displayClickRouteResult(route, walkDistA, walkDistB) {
    const resultDiv = document.getElementById('route-result');
    const errorDiv = document.getElementById('route-error');
    if (!resultDiv) return;
    if (errorDiv) errorDiv.style.display = 'none';

    const totalWalk = walkDistA + walkDistB;
    const totalDistance = route.total_cost + totalWalk;

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
                <span class="summary-value">${totalDistance.toFixed(1)} km</span>
                <span class="summary-label">Tong quang duong</span>
            </div>
        </div>
    `;

    // Thong tin di bo
    html += '<div class="route-timeline">';

    // Doan di bo A -> ga xuat phat
    if (walkDistA > 0.01) {
        html += `
            <div class="segment walking-segment">
                <div class="segment-line" style="background:#666"></div>
                <div class="segment-header">
                    <span class="walking-badge"><span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">directions_walk</span>Di bo</span>
                    <span>${walkDistA.toFixed(2)} km den ga</span>
                </div>
                <div class="station-stop first-stop">
                    <div class="station-dot" style="border-color:#E3002C"></div>
                    <span class="station-id">A</span>
                    <span class="station-name">Diem xuat phat</span>
                </div>
                <div class="station-stop last-stop">
                    <div class="station-dot" style="border-color:#E3002C"></div>
                    <span class="station-id">${escapeHtmlMap(nearestStationA.station.id)}</span>
                    <span class="station-name">${escapeHtmlMap(nearestStationA.station.name)}</span>
                </div>
            </div>
            <div class="transfer-marker">
                <span class="material-symbols-outlined">directions_subway</span>
                <span>Len tau tai ${escapeHtmlMap(nearestStationA.station.name)}</span>
            </div>
        `;
    }

    // Cac doan MRT
    route.segments.forEach((segment, segIndex) => {
        const isWalking = segment.transport_mode === 'walking';
        const segColor = isWalking ? '#666' : (segment.color || MAP_LINE_COLORS[segment.line] || '#888');
        const segmentClass = isWalking ? 'segment walking-segment' : 'segment';

        html += `
            <div class="${segmentClass}">
                <div class="segment-line" style="background:${escapeHtmlMap(segColor)}"></div>
                <div class="segment-header">
        `;

        if (isWalking) {
            html += `
                    <span class="walking-badge"><span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">directions_walk</span>Di bo</span>
                    <span>Di bo</span>
            `;
        } else {
            html += `
                    <span class="line-badge" style="background:${escapeHtmlMap(segColor)}">${escapeHtmlMap(segment.line)}</span>
                    <span>${escapeHtmlMap(segment.line_name)}</span>
            `;
        }

        html += '</div>';

        segment.stations.forEach((station, stIndex) => {
            const isFirst = stIndex === 0;
            const isLast = stIndex === segment.stations.length - 1;
            let stopClass = 'station-stop';
            if (isFirst) stopClass += ' first-stop';
            if (isLast) stopClass += ' last-stop';

            html += `
                <div class="${stopClass}">
                    <div class="station-dot" style="border-color:${escapeHtmlMap(segColor)}"></div>
                    <span class="station-id">${escapeHtmlMap(station.id)}</span>
                    <span class="station-name">${escapeHtmlMap(station.name)}</span>
                </div>
            `;
        });

        html += '</div>';

        if (segIndex < route.segments.length - 1) {
            html += `
                <div class="transfer-marker">
                    <span class="material-symbols-outlined">transfer_within_a_station</span>
                    <span>Doi tuyen tai ${escapeHtmlMap(segment.to_name)}</span>
                </div>
            `;
        }
    });

    // Doan di bo ga dich -> B
    if (walkDistB > 0.01) {
        html += `
            <div class="transfer-marker">
                <span class="material-symbols-outlined">directions_walk</span>
                <span>Xuong tau tai ${escapeHtmlMap(nearestStationB.station.name)}</span>
            </div>
            <div class="segment walking-segment">
                <div class="segment-line" style="background:#666"></div>
                <div class="segment-header">
                    <span class="walking-badge"><span class="material-symbols-outlined" style="font-size:14px;margin-right:4px">directions_walk</span>Di bo</span>
                    <span>${walkDistB.toFixed(2)} km den dich</span>
                </div>
                <div class="station-stop first-stop">
                    <div class="station-dot" style="border-color:#0070BD"></div>
                    <span class="station-id">${escapeHtmlMap(nearestStationB.station.id)}</span>
                    <span class="station-name">${escapeHtmlMap(nearestStationB.station.name)}</span>
                </div>
                <div class="station-stop last-stop">
                    <div class="station-dot" style="border-color:#0070BD"></div>
                    <span class="station-id">B</span>
                    <span class="station-name">Diem den</span>
                </div>
            </div>
        `;
    }

    html += '</div>';

    resultDiv.innerHTML = html;
    resultDiv.style.display = 'none';
    resultDiv.style.opacity = '0';
    resultDiv.style.transform = 'translateY(-10px)';
    resultDiv.style.display = 'block';
    requestAnimationFrame(() => {
        resultDiv.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
        resultDiv.style.opacity = '1';
        resultDiv.style.transform = 'translateY(0)';
    });
}

// ==========================================
// To sang tuyen tren ban do (bao gom duong di bo)
// ==========================================
function highlightClickRoute(route) {
    if (!graphData || !leafletMap) return;

    // Xoa highlight cu (nhung giu lai click markers va walking lines)
    for (const hl of highlightLayers) {
        leafletMap.removeLayer(hl);
    }
    highlightLayers = [];
    routeHighlighted = true;

    const stationSet = new Set(route.station_ids);

    // Lam mo tat ca ket noi va ga
    for (const polyline of connectionLayers) {
        polyline.setStyle({ opacity: 0.15 });
    }
    for (const id in stationMarkers) {
        const m = stationMarkers[id];
        m.setStyle({ fillOpacity: 0.15, opacity: 0.15 });
    }

    // To sang cac ga tren tuyen
    for (const id of stationSet) {
        const m = stationMarkers[id];
        if (!m) continue;
        m.setStyle({ fillOpacity: 1, opacity: 1 });
        m.setRadius(m._mrtData.origRadius + 3);
    }

    // Ve duong highlight cho tung doan tuyen
    const boundsCoords = [];

    // Them toa do diem A va B vao bounds
    if (clickMarkerA) boundsCoords.push(clickMarkerA.getLatLng());
    if (clickMarkerB) boundsCoords.push(clickMarkerB.getLatLng());

    for (const seg of route.segments) {
        const isWalking = seg.transport_mode === 'walking';
        const color = isWalking ? '#666' : (seg.color || MAP_LINE_COLORS[seg.line] || '#888');
        const segStations = seg.stations || [];

        for (let i = 0; i < segStations.length - 1; i++) {
            const mA = stationMarkers[segStations[i].id];
            const mB = stationMarkers[segStations[i + 1].id];
            if (!mA || !mB) continue;

            const latLngs = [mA.getLatLng(), mB.getLatLng()];
            boundsCoords.push(latLngs[0], latLngs[1]);

            const opts = {
                color: color,
                weight: 8,
                opacity: 1,
                lineCap: 'round'
            };

            if (isWalking) {
                opts.dashArray = '8, 8';
            }

            const hl = L.polyline(latLngs, opts).addTo(leafletMap);
            highlightLayers.push(hl);
        }
    }

    // Fit bounds bao gom ca diem A, B
    if (boundsCoords.length > 0) {
        const bounds = L.latLngBounds(boundsCoords);
        leafletMap.fitBounds(bounds, { padding: [60, 60] });
    }
}

// ==========================================
// Ve cac ket noi (polyline giua 2 ga)
// ==========================================
function renderConnections(connections, stationMap) {
    for (const conn of connections) {
        const stationA = stationMap[conn.from];
        const stationB = stationMap[conn.to];

        // Bo qua neu thieu toa do
        if (!stationA || !stationB) continue;
        if (stationA.lat == null || stationA.lng == null) continue;
        if (stationB.lat == null || stationB.lng == null) continue;

        const color = MAP_LINE_COLORS[conn.line] || '#999';
        const opacity = conn.is_active ? 1 : 0.25;
        const dashArray = conn.is_active ? null : '6, 4';

        const polyline = L.polyline(
            [[stationA.lat, stationA.lng], [stationB.lat, stationB.lng]],
            {
                color: color,
                weight: 4,
                opacity: opacity,
                dashArray: dashArray,
                lineCap: 'round'
            }
        ).addTo(leafletMap);

        // Luu metadata de phuc vu highlight/restore
        polyline._mrtData = {
            from: conn.from,
            to: conn.to,
            line: conn.line,
            is_active: conn.is_active,
            origOpacity: opacity
        };

        connectionLayers.push(polyline);
    }
}

// ==========================================
// Ve cac ga (circle marker + popup)
// ==========================================
function renderStations(stations) {
    for (const station of stations) {
        // Bo qua neu thieu toa do
        if (station.lat == null || station.lng == null) continue;

        const isTransfer = station.is_transfer;
        const isTerminal = station.is_terminal;
        const radius = isTransfer ? 8 : (isTerminal ? 7 : 5);

        // Mau vien cua ga = mau tuyen dau tien
        const primaryLine = station.lines[0] || 'BL';
        const strokeColor = station.is_active
            ? (MAP_LINE_COLORS[primaryLine] || '#999')
            : '#bbb';
        const fillColor = station.is_active ? '#fff' : '#eee';

        const marker = L.circleMarker([station.lat, station.lng], {
            radius: radius,
            fillColor: fillColor,
            color: strokeColor,
            weight: isTransfer ? 3 : 2,
            fillOpacity: 1,
            opacity: 1
        }).addTo(leafletMap);

        // Popup voi thong tin ga
        const lineNames = station.lines.map(l => {
            const safeL = escapeHtmlMap(l);
            return `<span style="color:${MAP_LINE_COLORS[l] || '#888'}">${safeL}</span>`;
        }).join(', ');

        let badges = '';
        if (isTransfer) badges += ' <span style="color:#7c4dff;font-size:11px">[Trung Chuyen]</span>';
        if (isTerminal) badges += ' <span style="color:#00897b;font-size:11px">[Ga Cuoi]</span>';

        const popupContent = `
            <strong>${escapeHtmlMap(station.name)}</strong> (${escapeHtmlMap(station.id)})${badges}<br>
            Tuyen: ${lineNames}
        `;
        marker.bindPopup(popupContent);

        // Click vao ga -> xu ly nhu click-to-route
        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);  // Ngan click lan ra ban do
            onStationClick(station);
        });

        // Luu metadata
        marker._mrtData = {
            id: station.id,
            isTransfer: isTransfer,
            isTerminal: isTerminal,
            origRadius: radius,
            origFillColor: fillColor,
            origStrokeColor: strokeColor,
            origWeight: isTransfer ? 3 : 2
        };

        // Permanent label (tooltip) — hien thi ten ga va ma ga
        const labelText = `${station.id} ${station.name}`;
        const tooltip = L.tooltip({
            permanent: true,
            direction: 'right',
            offset: [radius + 4, 0],
            className: isTransfer ? 'station-label transfer-label' : 'station-label',
            interactive: false
        });
        tooltip.setContent(labelText);
        marker.bindTooltip(tooltip);

        // Luu thong tin de dieu khien hien thi theo zoom
        marker._mrtData.minZoom = (isTransfer || isTerminal) ? 13 : 14;
        marker._mrtData.tooltip = tooltip;

        stationMarkers[station.id] = marker;
    }

    // Dang ky su kien zoom de bat/tat nhan ga theo muc zoom
    updateStationLabelsVisibility();
    leafletMap.on('zoomend', updateStationLabelsVisibility);
}

// ==========================================
// Bat/tat nhan ga theo muc zoom hien tai
// ==========================================
function updateStationLabelsVisibility() {
    if (!leafletMap) return;
    const zoom = leafletMap.getZoom();
    for (const id in stationMarkers) {
        const m = stationMarkers[id];
        const data = m._mrtData;
        if (!data.tooltip) continue;
        if (zoom >= data.minZoom) {
            if (!m.isTooltipOpen()) m.openTooltip();
        } else {
            if (m.isTooltipOpen()) m.closeTooltip();
        }
    }
}

// ==========================================
// Xu ly khi bam vao ga tren ban do
// (Dung nhu bam vao diem tren ban do, nhung dung chinh xac vi tri ga)
// ==========================================
function onStationClick(station) {
    if (!leafletMap || !graphData) return;

    // Mo phong click tai vi tri ga
    const fakeEvent = {
        latlng: L.latLng(station.lat, station.lng)
    };
    onMapClick(fakeEvent);
}

// ==========================================
// Module cong khai: to sang va xoa to sang tuyen
// ==========================================
window.mapModule = {
    /**
     * To sang tuyen di chuyen tren ban do
     * @param {string[]} stationIds - Danh sach ma ga tren tuyen
     * @param {object[]} segments - Danh sach cac doan tuyen
     */
    highlightRoute(stationIds, segments) {
        if (!graphData || !leafletMap) return;

        // Xoa highlight cu neu co
        this.clearHighlight();
        routeHighlighted = true;

        const stationSet = new Set(stationIds);

        // Lam mo tat ca ket noi va ga (opacity 0.15)
        for (const polyline of connectionLayers) {
            polyline.setStyle({ opacity: 0.15 });
        }
        for (const id in stationMarkers) {
            const m = stationMarkers[id];
            m.setStyle({ fillOpacity: 0.15, opacity: 0.15 });
        }

        // To sang cac ga tren tuyen
        for (const id of stationSet) {
            const m = stationMarkers[id];
            if (!m) continue;
            m.setStyle({ fillOpacity: 1, opacity: 1 });
            m.setRadius(m._mrtData.origRadius + 3);
        }

        // Ve duong highlight cho tung doan tuyen
        const boundsCoords = [];

        for (const seg of segments) {
            const isWalking = seg.transport_mode === 'walking';
            const color = isWalking ? '#666' : (seg.color || MAP_LINE_COLORS[seg.line] || '#888');
            const segStations = seg.stations || [];

            for (let i = 0; i < segStations.length - 1; i++) {
                const mA = stationMarkers[segStations[i].id];
                const mB = stationMarkers[segStations[i + 1].id];
                if (!mA || !mB) continue;

                const latLngs = [mA.getLatLng(), mB.getLatLng()];
                boundsCoords.push(latLngs[0], latLngs[1]);

                const opts = {
                    color: color,
                    weight: 8,
                    opacity: 1,
                    lineCap: 'round'
                };

                if (isWalking) {
                    opts.dashArray = '8, 8';
                }

                const hl = L.polyline(latLngs, opts).addTo(leafletMap);
                highlightLayers.push(hl);
            }
        }

        // Fit map bounds to show the entire route
        if (boundsCoords.length > 0) {
            const bounds = L.latLngBounds(boundsCoords);
            leafletMap.fitBounds(bounds, { padding: [50, 50] });
        }
    },

    /**
     * Xoa tat ca to sang, khoi phuc trang thai binh thuong
     */
    clearHighlight() {
        if (!leafletMap) return;

        // Xoa cac highlight layer
        for (const hl of highlightLayers) {
            leafletMap.removeLayer(hl);
        }
        highlightLayers = [];

        // Xoa click-to-route markers va walking lines
        clearClickToRoute();

        if (!routeHighlighted) return;
        routeHighlighted = false;

        // Khoi phuc opacity cua tat ca ket noi
        for (const polyline of connectionLayers) {
            const data = polyline._mrtData;
            polyline.setStyle({ opacity: data.origOpacity });
        }

        // Khoi phuc cac station marker
        for (const id in stationMarkers) {
            const m = stationMarkers[id];
            const data = m._mrtData;
            m.setStyle({ fillOpacity: 1, opacity: 1 });
            m.setRadius(data.origRadius);
        }

        showMapInstruction('Bam vao ban do de chon diem xuat phat (A)');
    }
};
