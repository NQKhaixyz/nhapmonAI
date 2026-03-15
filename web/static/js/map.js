// ==========================================
// Ban do MRT Dai Bac tuong tac (SVG)
// Hien thi so do mang luoi, ho tro pan/zoom,
// va to sang tuyen di chuyen
// ==========================================

// Mau cua tung tuyen
const MAP_LINE_COLORS = {
    'BR': '#C48C31',
    'R':  '#E3002C',
    'G':  '#008659',
    'O':  '#F8B61C',
    'BL': '#0070BD'
};

// ==========================================
// Vi tri so do cac ga tren ban do (1400x1100 viewBox)
//
// PHIEN BAN 5 — Thiet ke lai chinh xac theo ban do chinh thuc Taipei MRT
// Tham khao: https://english.metro.taipei (ban do so do chinh thuc)
//
// Nguyen tac thiet ke tu ban do goc:
//   BL (Xanh Duong) = ngang qua giua (y=580), cheo NE o phia tay
//   R  (Do)         = doc tu bac NW (Tamsui) -> trung tam -> cheo SE (Xiangshan)
//   G  (Xanh La)    = ngang y=510 (Songshan->Ximen), re doc xuong nam, cheo SW
//   O  (Cam)        = cheo NE tu SW -> trung tam, doc len bac, chia nhanh NW
//   BR (Nau)        = cung lon tu SE (Zoo) -> trung tam -> NE (Neihu) -> xuong Nangang
//
// TRUC CHINH:
//   Green ngang: y=510 (tu G01 den BL11/Ximen)
//   Blue ngang:  y=580 (tu BL09 den BL23), cheo NE phia tay
//   Red doc:     x=530 (tu R14 den BL12)
//   Orange doc:  x=650 (tu O08 den BL14)
//   Brown doc:   x=740 (tu G04 den BL15)
//
// Thu tu tren truc Red (bac -> nam):
//   R18(470) -> O11(490) -> R20(510) -> G06(530) -> BL12(580)
//   BL12(580) -> R23(600) -> G10(640) -> O06(670) -> R27(700)
//
// Cac ga trung chuyen DUNG CHUNG vi tri.
// ==========================================
const STATION_POSITIONS = {

    // ===================================================
    // TUYEN XANH DUONG (BL) — Bannan Line
    // Cheo NE phia tay (BL01-BL08), ngang y=580 tu BL09->BL23
    // ===================================================
    'BL01': { x:  80, y: 750 },   // Dingpu (terminal, tay-nam)
    'BL02': { x: 115, y: 730 },
    'BL03': { x: 150, y: 710 },   // Tucheng
    'BL04': { x: 185, y: 690 },   // Haishan
    'BL05': { x: 220, y: 670 },   // Banqiao
    'BL06': { x: 260, y: 650 },   // Fuzhong
    'BL07': { x: 300, y: 630 },   // Far Eastern Hospital
    'BL08': { x: 340, y: 610 },   // Xinpu
    'BL09': { x: 380, y: 590 },   // Jiangzicui
    'BL10': { x: 420, y: 580 },   // Longshan Temple — bat dau ngang
    'BL11': { x: 470, y: 580 },   // G+BL (Ximen)
    'BL12': { x: 530, y: 580 },   // R+BL (Taipei Main Station)
    'BL13': { x: 590, y: 580 },   // Shandao Temple
    'BL14': { x: 650, y: 580 },   // O+BL (Zhongxiao Xinsheng)
    'BL15': { x: 740, y: 580 },   // BR+BL (Zhongxiao Fuxing)
    'BL16': { x: 790, y: 580 },   // Zhongxiao Dunhua
    'BL17': { x: 840, y: 580 },   // Sun Yat-Sen Memorial Hall
    'BL18': { x: 890, y: 580 },   // Taipei City Hall
    'BL19': { x: 940, y: 580 },   // Yongchun
    'BL20': { x: 990, y: 580 },   // Houshanpi
    'BL21': { x: 1040, y: 580 },  // Kunyang
    'BL22': { x: 1090, y: 580 },  // Nangang
    'BL23': { x: 1160, y: 580 },  // BR+BL (Nangang Exhibition Center, terminal)

    // ===================================================
    // TUYEN DO (R) — Tamsui-Xinyi Line
    // Bac (NW) -> trung tam (doc x=530) -> nam (cheo SE)
    //
    // Thu tu khu trung tam (bac -> nam, tren truc x=530):
    //   R18(470) -> O11(490) -> R20(510) -> G06(530) -> R_skip
    //   -> BL12(580) -> R23(600) -> G10(640) -> O06(670) -> R27(700)
    // ===================================================
    'R02':  { x: 400, y:  55 },   // Tamsui (terminal, NW)
    'R04':  { x: 412, y:  95 },   // Hongshulin
    'R05':  { x: 424, y: 130 },   // Zhuwei
    'R06':  { x: 436, y: 165 },   // Guandu
    'R07':  { x: 450, y: 200 },   // Zhongyi
    'R08':  { x: 464, y: 240 },   // Fuxinggang
    'R10':  { x: 480, y: 280 },   // Beitou — nhanh R22A
    'R22A': { x: 410, y: 240 },   // Xinbeitou (terminal, nhanh NW)
    'R11':  { x: 494, y: 315 },   // Qiyan
    'R12':  { x: 505, y: 345 },   // Qilian
    'R13':  { x: 515, y: 375 },   // Shipai
    'R14':  { x: 525, y: 400 },   // Mingde
    'R15':  { x: 530, y: 420 },   // Zhishan — gan thang doc
    'R16':  { x: 530, y: 440 },   // Shilin
    'R17':  { x: 530, y: 458 },   // Jiantan
    'R18':  { x: 530, y: 474 },   // Yuanshan
    // O11 (R+O, Minquan W Rd) — x=530, y=492
    'R20':  { x: 530, y: 510 },   // Shuanglian
    // G06 (R+G, Zhongshan) — x=530, y=530
    // G07 (Beimen) ngay phia tay G06
    // BL12 (R+BL, Taipei Main) — x=530, y=580
    'R23':  { x: 530, y: 605 },   // NTU Hospital
    // G10 (R+G, CKS Memorial Hall) — x=490, y=635
    // O06 (R+O, Dongmen) — x=540, y=665
    'R27':  { x: 610, y: 700 },   // Daan Park — re SE
    'R28':  { x: 650, y: 730 },   // Xinyi Anhe
    'R29':  { x: 690, y: 760 },   // Taipei 101/World Trade Center
    'R30':  { x: 730, y: 790 },   // Xiangshan (terminal, SE)

    // ===================================================
    // TUYEN XANH LA (G) — Songshan-Xindian Line
    //
    // Doan ngang y=510: G01(Songshan) -> G04 -> O08 -> G06
    // Cheo xuong: G06(530,530) -> G07(490,555) -> BL11(470,580) (gap BL)
    // Doc xuong: BL11 -> G09 -> G10 -> O05
    // Cheo SW: O05 -> G12 -> ... -> G19(Xindian)
    // ===================================================
    'G01':  { x: 850, y: 510 },   // Songshan (terminal, dong)
    'G02':  { x: 810, y: 510 },   // Nanjing Sanmin
    'G03':  { x: 770, y: 510 },   // Taipei Arena
    'G04':  { x: 740, y: 510 },   // BR+G (Nanjing Fuxing)
    // O08 (G+O, Songjiang Nanjing) — x=650, y=510
    // G06 (R+G, Zhongshan) — x=530, y=530 (nhe xuong tu y=510)
    'G07':  { x: 495, y: 555 },   // Beimen — cheo xuong giua G06 va BL11
    // BL11 (G+BL, Ximen) — x=470, y=580
    'G09':  { x: 475, y: 615 },   // Xiaonanmen — doc xuong
    // G10 (R+G, CKS Memorial Hall) — x=490, y=635
    // O05 (G+O, Guting) — x=460, y=680
    'G12':  { x: 445, y: 710 },   // Taipower Building
    'G13':  { x: 425, y: 740 },   // Gongguan
    'G14':  { x: 405, y: 775 },   // Wanlong
    'G15':  { x: 400, y: 810 },   // Jingmei
    'G16':  { x: 420, y: 845 },   // Dapinglin — chuyen huong SE nhe
    'G17':  { x: 445, y: 878 },   // Qizhang — nhanh G03A
    'G03A': { x: 500, y: 895 },   // Xiaobitan (terminal, nhanh SE)
    'G18':  { x: 468, y: 910 },   // Xindian City Hall
    'G19':  { x: 490, y: 945 },   // Xindian (terminal)

    // ===================================================
    // TUYEN CAM (O) — Zhonghe-Xinlu Line
    //
    // O01(Nanshijiao, SW) cheo NE -> O05(Guting) -> O06(Dongmen)
    // O06 cheo NE -> BL14(Zhongxiao Xinsheng)
    // BL14 doc len -> O08(Songjiang Nanjing)
    // O08 cheo NW -> O09 -> O10 -> O11(Minquan)
    // O11 -> O12(Daqiaotou) -> chia nhanh
    // Luzhou: cheo NW
    // Huilong: ngang sang trai (cheo nhe SW)
    // ===================================================
    'O01':  { x: 280, y: 840 },   // Nanshijiao (terminal, SW)
    'O02':  { x: 315, y: 810 },   // Jingan
    'O03':  { x: 355, y: 780 },   // Yongan Market
    'O04':  { x: 400, y: 745 },   // Dingxi
    // O05 (G+O, Guting) — x=460, y=680
    // O06 (R+O, Dongmen) — x=540, y=665
    // Cheo NE: O06(540,665) -> BL14(650,580) — qua BL
    // BL14 (O+BL, Zhongxiao Xinsheng) — x=650, y=580
    // Doc len bac (x=650):
    // O08 (G+O, Songjiang Nanjing) — x=650, y=510
    // Cheo NW: O08 -> O09 -> O10
    'O09':  { x: 610, y: 490 },   // Xingtian Temple
    'O10':  { x: 570, y: 480 },   // Zhongshan Elementary School
    // O11 (R+O, Minquan W Rd) — x=530, y=492
    'O12':  { x: 480, y: 435 },   // Daqiaotou — tu O11 cheo NW, chia 2 nhanh

    // Nhanh Luzhou (cheo NW): O12 -> O13 -> ... -> O18
    'O13':  { x: 445, y: 405 },   // Sanchong Elementary School
    'O15':  { x: 410, y: 375 },   // Sanhe Junior High
    'O16':  { x: 375, y: 345 },   // St. Ignatius
    'O17':  { x: 340, y: 315 },   // Sanchong
    'O18':  { x: 305, y: 285 },   // Luzhou (terminal)

    // Nhanh Huilong (cheo SW nhe, gan ngang):
    // O12 -> O21 -> O31 -> ... -> O38
    'O21':  { x: 435, y: 445 },   // Sanmin Senior High
    'O31':  { x: 390, y: 455 },   // Sanchong
    'O32':  { x: 345, y: 465 },   // Xianse Temple
    'O33':  { x: 300, y: 475 },   // Touqianzhuang
    'O34':  { x: 255, y: 485 },   // Xinzhuang
    'O35':  { x: 210, y: 495 },   // Fu Jen University
    'O36':  { x: 165, y: 505 },   // Danfeng
    'O37':  { x: 120, y: 515 },   // Huilong
    'O38':  { x:  65, y: 525 },   // Sanzhong (terminal)

    // ===================================================
    // TUYEN NAU (BR) — Wenhu Line
    //
    // Cung lon: BR01(Zoo, SE) cheo NW -> BL15 -> G04
    //           G04 cheo NE -> BR12..BR18 (arc)
    //           BR18..BR23 cong xuong dong
    //           BR23 -> BL23
    // ===================================================
    'BR01': { x: 870, y: 830 },   // Taipei Zoo (terminal, SE)
    'BR02': { x: 850, y: 800 },   // Muzha
    'BR03': { x: 830, y: 770 },   // Wanfang Community
    'BR04': { x: 810, y: 740 },   // Wanfang Hospital
    'BR05': { x: 790, y: 710 },   // Xinhai
    'BR06': { x: 770, y: 685 },   // Linguang
    'BR07': { x: 755, y: 655 },   // Liuzhangli
    'BR08': { x: 745, y: 630 },   // Technology Building
    'BR09': { x: 740, y: 605 },   // Daan
    // BL15 (BR+BL, Zhongxiao Fuxing) — x=740, y=580
    // G04 (BR+G, Nanjing Fuxing) — x=740, y=510
    // Cheo NE:
    'BR12': { x: 780, y: 485 },   // Zhongshan Jr High School
    'BR13': { x: 820, y: 465 },   // Songshan Airport
    'BR14': { x: 870, y: 445 },   // Dazhi
    'BR15': { x: 920, y: 425 },   // Jiannan Road
    'BR16': { x: 970, y: 410 },   // Xihu
    'BR17': { x: 1020, y: 400 },  // Gangqian
    'BR18': { x: 1070, y: 395 },  // Wende — dinh cung
    'BR19': { x: 1120, y: 400 },  // Neihu — bat dau cong xuong
    'BR20': { x: 1160, y: 420 },  // Dahu Park
    'BR21': { x: 1190, y: 450 },  // Huzhou
    'BR22': { x: 1210, y: 480 },  // Donghu
    'BR23': { x: 1215, y: 515 },  // Nangang Software Park
    // BL23 (BR+BL, Nangang Exhibition Center) — x=1160, y=580

    // ===================================================
    // GA TRUNG CHUYEN — dung chung vi tri giua 2 tuyen
    //
    // Tren truc Red (x=530):
    //   R18(474) -> O11(492) -> R20(510) -> G06(530) -> [gap 50px]
    //   -> BL12(580) -> R23(605) -> G10(635) -> O06(665) -> R27(700)
    //
    // Truc Orange doc (x=650): O08(510) -> BL14(580)
    // Truc Brown doc (x=740): G04(510) -> BL15(580)
    // ===================================================
    'O11':  { x: 530, y: 492 },   // R+O (Minquan West Road)
    'G06':  { x: 530, y: 530 },   // R+G (Zhongshan) — tren truc Green/Red
    'G10':  { x: 490, y: 635 },   // R+G (CKS Memorial Hall) — giua truc Green va Red
    'O06':  { x: 540, y: 665 },   // R+O (Dongmen) — phia dong G10, tren truc Red SE
    'O05':  { x: 460, y: 680 },   // G+O (Guting) — phia tay, tren truc Green
    'O08':  { x: 650, y: 510 },   // G+O (Songjiang Nanjing) — tren truc Green ngang
};

// ==========================================
// Trang thai module ban do
// ==========================================
let graphData = null;
let svgElement = null;
let currentViewBox = { x: 0, y: 0, w: 1400, h: 1100 };
const defaultViewBox = { x: 0, y: 0, w: 1400, h: 1100 };
let isPanning = false;
let panStartPoint = { x: 0, y: 0 };
let panStartViewBox = { x: 0, y: 0 };
let currentScale = 1;
let routeHighlighted = false;

// ==========================================
// Khoi tao ban do khi trang tai xong
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
    svgElement = document.getElementById('mrt-map');
    if (!svgElement) {
        console.warn('Khong tim thay phan tu SVG #mrt-map');
        return;
    }

    await loadAndRenderMap();
    setupPanZoom();
    setupZoomButtons();
});

// ==========================================
// Tai du lieu do thi va ve ban do
// ==========================================
async function loadAndRenderMap() {
    try {
        const response = await fetch('/api/graph');
        if (!response.ok) throw new Error(`Loi HTTP: ${response.status}`);
        graphData = await response.json();

        // Xoa noi dung cu (giu lai title va desc)
        const title = svgElement.querySelector('title');
        const desc = svgElement.querySelector('desc');
        svgElement.innerHTML = '';
        if (title) svgElement.appendChild(title);
        if (desc) svgElement.appendChild(desc);

        // Tao cac nhom SVG
        const gConnections = createSvgElement('g', { id: 'connections-layer' });
        const gStations = createSvgElement('g', { id: 'stations-layer' });
        const gLabels = createSvgElement('g', { id: 'labels-layer' });
        const gHighlight = createSvgElement('g', { id: 'highlight-layer' });

        svgElement.appendChild(gConnections);
        svgElement.appendChild(gHighlight);
        svgElement.appendChild(gStations);
        svgElement.appendChild(gLabels);

        // Ve ket noi (duong noi giua cac ga)
        renderConnections(gConnections, graphData.connections, graphData.lines);

        // Ve cac ga (hinh tron)
        renderStations(gStations, gLabels, graphData.stations);

        console.log(`Ban do da ve: ${graphData.stations.length} ga, ${graphData.connections.length} ket noi`);
    } catch (error) {
        console.error('Khong the tai du lieu ban do:', error);
    }
}

// ==========================================
// Ve cac ket noi (duong noi giua 2 ga)
// ==========================================
function renderConnections(layer, connections, lines) {
    for (const conn of connections) {
        const posA = STATION_POSITIONS[conn.from];
        const posB = STATION_POSITIONS[conn.to];
        if (!posA || !posB) {
            console.warn(`Thieu vi tri cho ket noi: ${conn.from} -> ${conn.to}`);
            continue;
        }

        const color = MAP_LINE_COLORS[conn.line] || '#999';
        const opacity = conn.is_active ? 1 : 0.25;
        const dashArray = conn.is_active ? 'none' : '6,4';

        const line = createSvgElement('line', {
            x1: posA.x,
            y1: posA.y,
            x2: posB.x,
            y2: posB.y,
            stroke: color,
            'stroke-width': 4,
            'stroke-opacity': opacity,
            'stroke-dasharray': dashArray,
            'stroke-linecap': 'round',
            'data-from': conn.from,
            'data-to': conn.to,
            'data-line': conn.line,
            class: 'map-connection'
        });

        layer.appendChild(line);
    }
}

// ==========================================
// Ve cac ga (hinh tron + nhan)
// ==========================================
function renderStations(stationLayer, labelLayer, stations) {
    for (const station of stations) {
        const pos = STATION_POSITIONS[station.id];
        if (!pos) {
            console.warn(`Thieu vi tri cho ga: ${station.id} (${station.name})`);
            continue;
        }

        const isTransfer = station.is_transfer;
        const isTerminal = station.is_terminal;
        const radius = isTransfer ? 7 : (isTerminal ? 6 : 5);
        const strokeWidth = isTransfer ? 3 : 2;

        // Mau vien cua ga = mau tuyen dau tien
        const primaryLine = station.lines[0] || 'BL';
        const strokeColor = station.is_active
            ? (MAP_LINE_COLORS[primaryLine] || '#999')
            : '#bbb';
        const fillColor = station.is_active ? '#fff' : '#eee';

        // Ve hinh tron dai dien cho ga
        const circle = createSvgElement('circle', {
            cx: pos.x,
            cy: pos.y,
            r: radius,
            fill: fillColor,
            stroke: strokeColor,
            'stroke-width': strokeWidth,
            class: `map-station ${isTransfer ? 'transfer' : ''} ${isTerminal ? 'terminal' : ''}`,
            'data-id': station.id,
            'data-name': station.name,
            'data-lines': station.lines.join(','),
            cursor: 'pointer'
        });

        // Vong tron ngoai cho ga trung chuyen
        if (isTransfer) {
            const outerCircle = createSvgElement('circle', {
                cx: pos.x,
                cy: pos.y,
                r: radius + 3,
                fill: 'none',
                stroke: strokeColor,
                'stroke-width': 1.5,
                'stroke-opacity': 0.4,
                class: 'map-station-outer',
                'data-id': station.id
            });
            stationLayer.appendChild(outerCircle);
        }

        stationLayer.appendChild(circle);

        // Su kien hover: hien tooltip
        circle.addEventListener('mouseenter', (e) => showTooltip(station, e));
        circle.addEventListener('mouseleave', () => hideTooltip());
        circle.addEventListener('click', () => onStationClick(station));

        // Nhan ten ga
        const labelOffset = getLabelOffset(station.id, isTransfer);
        const label = createSvgElement('text', {
            x: pos.x + labelOffset.dx,
            y: pos.y + labelOffset.dy,
            'font-size': isTerminal ? '9' : '7.5',
            'font-family': 'Inter, Arial, sans-serif',
            'font-weight': isTerminal ? '600' : '400',
            fill: station.is_active ? '#333' : '#aaa',
            'text-anchor': labelOffset.anchor || 'start',
            'dominant-baseline': 'central',
            class: 'map-label',
            'data-id': station.id,
            'pointer-events': 'none'
        });
        label.textContent = station.id;
        labelLayer.appendChild(label);
    }
}

// ==========================================
// Vi tri offset cua nhan de tranh chong cheo
// ==========================================
function getLabelOffset(stationId, isTransfer) {
    // Mac dinh: nhan nam ben phai
    const defaultOffset = { dx: 10, dy: 0, anchor: 'start' };

    // Dieu chinh cho mot so ga cu the de tranh chong cheo
    const customOffsets = {
        // === BL (ngang) — nhan phia tren hoac duoi ===
        'BL01': { dx: 0, dy: 14, anchor: 'middle' },    // Dingpu terminal
        'BL23': { dx: 0, dy: 14, anchor: 'middle' },    // Nangang Exh Center terminal
        'BL11': { dx: 0, dy: 14, anchor: 'middle' },    // Ximen (G+BL)
        'BL12': { dx: 0, dy: 14, anchor: 'middle' },    // Taipei Main (R+BL)
        'BL14': { dx: 0, dy: 14, anchor: 'middle' },    // Zhongxiao Xinsheng (O+BL)
        'BL15': { dx: 0, dy: 14, anchor: 'middle' },    // Zhongxiao Fuxing (BR+BL)

        // BL phia tay (cheo) — nhan phia tren
        'BL02': { dx: 0, dy: -10, anchor: 'middle' },
        'BL03': { dx: 0, dy: -10, anchor: 'middle' },
        'BL04': { dx: 0, dy: -10, anchor: 'middle' },
        'BL05': { dx: 0, dy: -10, anchor: 'middle' },
        'BL06': { dx: 0, dy: -10, anchor: 'middle' },
        'BL07': { dx: 0, dy: -10, anchor: 'middle' },
        'BL08': { dx: 0, dy: -10, anchor: 'middle' },

        // BL phia dong (ngang) — nhan phia tren
        'BL16': { dx: 0, dy: -10, anchor: 'middle' },
        'BL17': { dx: 0, dy: -10, anchor: 'middle' },
        'BL18': { dx: 0, dy: -10, anchor: 'middle' },
        'BL19': { dx: 0, dy: -10, anchor: 'middle' },
        'BL20': { dx: 0, dy: -10, anchor: 'middle' },
        'BL21': { dx: 0, dy: -10, anchor: 'middle' },
        'BL22': { dx: 0, dy: -10, anchor: 'middle' },

        // === R (doc) — nhan ben phai ===
        'R02':  { dx: 12, dy: 0, anchor: 'start' },     // Tamsui terminal
        'R30':  { dx: 12, dy: 0, anchor: 'start' },     // Xiangshan terminal
        'R22A': { dx: -10, dy: 0, anchor: 'end' },      // Xinbeitou (sang trai)

        // === G — nhan thay doi theo doan ===
        'G01':  { dx: 0, dy: -10, anchor: 'middle' },   // Songshan terminal
        'G19':  { dx: 10, dy: 0, anchor: 'start' },     // Xindian terminal
        'G03A': { dx: 10, dy: 0, anchor: 'start' },     // Xiaobitan branch
        'G07':  { dx: 0, dy: -10, anchor: 'middle' },   // Beimen
        'G09':  { dx: -10, dy: 0, anchor: 'end' },      // Xiaonanmen

        // === O — nhan ben trai cho nhanh NW ===
        'O01':  { dx: -10, dy: 0, anchor: 'end' },      // Nanshijiao terminal
        'O18':  { dx: -10, dy: 0, anchor: 'end' },      // Luzhou terminal
        'O38':  { dx: -10, dy: 0, anchor: 'end' },      // Sanzhong terminal
        'O13':  { dx: -10, dy: 0, anchor: 'end' },
        'O15':  { dx: -10, dy: 0, anchor: 'end' },
        'O16':  { dx: -10, dy: 0, anchor: 'end' },
        'O17':  { dx: -10, dy: 0, anchor: 'end' },

        // O nhanh Huilong — nhan phia tren
        'O21':  { dx: 0, dy: -10, anchor: 'middle' },
        'O31':  { dx: 0, dy: -10, anchor: 'middle' },
        'O32':  { dx: 0, dy: -10, anchor: 'middle' },
        'O33':  { dx: 0, dy: -10, anchor: 'middle' },
        'O34':  { dx: 0, dy: -10, anchor: 'middle' },
        'O35':  { dx: 0, dy: -10, anchor: 'middle' },
        'O36':  { dx: 0, dy: -10, anchor: 'middle' },
        'O37':  { dx: 0, dy: -10, anchor: 'middle' },

        // === BR — nhan thay doi theo doan ===
        'BR01': { dx: 10, dy: 0, anchor: 'start' },     // Taipei Zoo terminal
        'BR23': { dx: 10, dy: 0, anchor: 'start' },     // Nangang Software Park

        // BR NE arc — nhan phia tren
        'BR12': { dx: 0, dy: -10, anchor: 'middle' },
        'BR13': { dx: 0, dy: -10, anchor: 'middle' },
        'BR14': { dx: 0, dy: -10, anchor: 'middle' },
        'BR15': { dx: 0, dy: -10, anchor: 'middle' },
        'BR16': { dx: 0, dy: -10, anchor: 'middle' },
        'BR17': { dx: 0, dy: -10, anchor: 'middle' },
        'BR18': { dx: 0, dy: -10, anchor: 'middle' },
        'BR19': { dx: 10, dy: 0, anchor: 'start' },
        'BR20': { dx: 10, dy: 0, anchor: 'start' },
        'BR21': { dx: 10, dy: 0, anchor: 'start' },
        'BR22': { dx: 10, dy: 0, anchor: 'start' },

        // === Ga trung chuyen — nhan ben trai cho truc doc Red ===
        'O11':  { dx: -12, dy: 0, anchor: 'end' },      // R+O
        'G06':  { dx: -12, dy: 0, anchor: 'end' },      // R+G (tren truc Green ngang)
        'G10':  { dx: -12, dy: 0, anchor: 'end' },      // R+G
        'O06':  { dx: 12, dy: 0, anchor: 'start' },     // R+O (ben phai vi o phia dong)
        'O05':  { dx: -12, dy: 0, anchor: 'end' },      // G+O (ben trai)
        'O08':  { dx: 0, dy: -12, anchor: 'middle' },   // G+O (phia tren)

        // O09, O10, O12 — tren doan ngang/cheo Orange phia bac
        'O09':  { dx: 0, dy: -10, anchor: 'middle' },
        'O10':  { dx: 0, dy: -10, anchor: 'middle' },
        'O12':  { dx: 0, dy: -10, anchor: 'middle' },

        // Red doan bac (cheo NW) — nhan ben phai
        'R04':  { dx: 12, dy: 0, anchor: 'start' },
        'R05':  { dx: 12, dy: 0, anchor: 'start' },
        'R06':  { dx: 12, dy: 0, anchor: 'start' },
        'R07':  { dx: 12, dy: 0, anchor: 'start' },
        'R08':  { dx: 12, dy: 0, anchor: 'start' },
        'R10':  { dx: 12, dy: 0, anchor: 'start' },
        'R11':  { dx: 12, dy: 0, anchor: 'start' },
        'R12':  { dx: 12, dy: 0, anchor: 'start' },
        'R13':  { dx: 12, dy: 0, anchor: 'start' },

        // Red doan nam (cheo SE) — nhan ben trai
        'R27':  { dx: -12, dy: 0, anchor: 'end' },
        'R28':  { dx: -12, dy: 0, anchor: 'end' },
        'R29':  { dx: -12, dy: 0, anchor: 'end' },

        // Green doan dong (ngang) — nhan phia tren
        'G02':  { dx: 0, dy: -10, anchor: 'middle' },
        'G03':  { dx: 0, dy: -10, anchor: 'middle' },

        // Brown doan nam (cheo NW) — nhan ben phai
        'BR02': { dx: 10, dy: 0, anchor: 'start' },
        'BR03': { dx: 10, dy: 0, anchor: 'start' },
        'BR04': { dx: 10, dy: 0, anchor: 'start' },
        'BR05': { dx: 10, dy: 0, anchor: 'start' },
        'BR06': { dx: 10, dy: 0, anchor: 'start' },
        'BR07': { dx: 10, dy: 0, anchor: 'start' },
        'BR08': { dx: 10, dy: 0, anchor: 'start' },
        'BR09': { dx: 10, dy: 0, anchor: 'start' },

        // Orange doan SW — nhan ben trai
        'O02':  { dx: -10, dy: 0, anchor: 'end' },
        'O03':  { dx: -10, dy: 0, anchor: 'end' },
        'O04':  { dx: -10, dy: 0, anchor: 'end' },

        // Green doan SW — nhan ben phai
        'G12':  { dx: -10, dy: 0, anchor: 'end' },
        'G13':  { dx: -10, dy: 0, anchor: 'end' },
        'G14':  { dx: -10, dy: 0, anchor: 'end' },
        'G15':  { dx: -10, dy: 0, anchor: 'end' },
        'G16':  { dx: 10, dy: 0, anchor: 'start' },
        'G17':  { dx: 10, dy: 0, anchor: 'start' },
        'G18':  { dx: 10, dy: 0, anchor: 'start' },
    };

    return customOffsets[stationId] || defaultOffset;
}

// ==========================================
// Hien thi tooltip khi hover vao ga
// ==========================================
function showTooltip(station, event) {
    const tooltip = document.getElementById('station-tooltip');
    if (!tooltip) return;

    const lineNames = station.lines.map(l => {
        const info = graphData.lines[l];
        return info ? `<span style="color:${MAP_LINE_COLORS[l] || '#888'}">${l}</span>` : l;
    }).join(', ');

    const statusText = station.is_active
        ? '<span style="color:#2ecc40">Dang hoat dong</span>'
        : '<span style="color:#E3002C">Da dong cua</span>';

    let badges = '';
    if (station.is_transfer) badges += ' <span style="color:#7c4dff;font-size:11px">[Trung Chuyen]</span>';
    if (station.is_terminal) badges += ' <span style="color:#00897b;font-size:11px">[Ga Cuoi]</span>';

    tooltip.innerHTML = `
        <strong>${station.name}</strong> (${station.id})${badges}<br>
        Tuyen: ${lineNames}<br>
        ${statusText}
    `;

    // Vi tri tooltip gan con tro chuot
    const rect = svgElement.getBoundingClientRect();
    let left = event.clientX + 15;
    let top = event.clientY - 10;

    // Dam bao tooltip khong bi tran ra ngoai man hinh
    if (left + 200 > window.innerWidth) left = event.clientX - 215;
    if (top + 80 > window.innerHeight) top = event.clientY - 80;

    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';
    tooltip.style.display = 'block';
    tooltip.classList.add('visible');
    tooltip.setAttribute('aria-hidden', 'false');
}

// ==========================================
// An tooltip
// ==========================================
function hideTooltip() {
    const tooltip = document.getElementById('station-tooltip');
    if (tooltip) {
        tooltip.classList.remove('visible');
        tooltip.style.display = 'none';
        tooltip.setAttribute('aria-hidden', 'true');
    }
}

// ==========================================
// Xu ly khi bam vao ga tren ban do
// ==========================================
function onStationClick(station) {
    // Dien thong tin vao o nhap tim tuyen (neu co)
    const startInput = document.getElementById('start-input');
    const endInput = document.getElementById('end-input');

    if (startInput && endInput) {
        const stationObj = { id: station.id, name: station.name };
        // Neu chua chon ga di, dien vao ga di
        if (!startInput.value || startInput.value.trim() === '') {
            startInput.value = `${station.id} - ${station.name}`;
            // Cap nhat bien toan cuc (selectedStart duoc khai bao bang let trong app.js)
            if (typeof selectedStart !== 'undefined') {
                selectedStart = stationObj;
            }
        } else if (!endInput.value || endInput.value.trim() === '') {
            endInput.value = `${station.id} - ${station.name}`;
            if (typeof selectedEnd !== 'undefined') {
                selectedEnd = stationObj;
            }
        } else {
            // Neu ca 2 da co, thay the ga di
            startInput.value = `${station.id} - ${station.name}`;
            if (typeof selectedStart !== 'undefined') {
                selectedStart = stationObj;
            }
        }
    }
}

// ==========================================
// Thiet lap tinh nang keo tha (pan) va thu phong (zoom)
// ==========================================
function setupPanZoom() {
    if (!svgElement) return;

    const container = document.getElementById('map-container');
    if (!container) return;

    // Keo tha de di chuyen ban do
    container.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Chi nhan chuot trai
        isPanning = true;
        panStartPoint = { x: e.clientX, y: e.clientY };
        panStartViewBox = { ...currentViewBox };
        container.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', (e) => {
        if (!isPanning) return;
        const dx = (e.clientX - panStartPoint.x) * (currentViewBox.w / svgElement.clientWidth);
        const dy = (e.clientY - panStartPoint.y) * (currentViewBox.h / svgElement.clientHeight);
        currentViewBox.x = panStartViewBox.x - dx;
        currentViewBox.y = panStartViewBox.y - dy;
        applyViewBox();
    });

    window.addEventListener('mouseup', () => {
        if (isPanning) {
            isPanning = false;
            container.style.cursor = 'grab';
        }
    });

    // Cuon chuot de thu phong
    container.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1.15 : 0.87;
        zoomAtPoint(e.clientX, e.clientY, zoomFactor);
    }, { passive: false });

    container.style.cursor = 'grab';
}

// ==========================================
// Thu phong tai mot diem cu the
// ==========================================
function zoomAtPoint(clientX, clientY, factor) {
    const rect = svgElement.getBoundingClientRect();

    // Tinh toa do SVG cua diem chuot
    const svgX = currentViewBox.x + (clientX - rect.left) / rect.width * currentViewBox.w;
    const svgY = currentViewBox.y + (clientY - rect.top) / rect.height * currentViewBox.h;

    // Tinh kich thuoc viewBox moi
    const newW = currentViewBox.w * factor;
    const newH = currentViewBox.h * factor;

    // Gioi han zoom: khong qua gan (200x150) hoac qua xa (2400x1800)
    if (newW < 200 || newW > 2400) return;

    // Dieu chinh viewBox de giu diem chuot co dinh
    currentViewBox.x = svgX - (svgX - currentViewBox.x) * (newW / currentViewBox.w);
    currentViewBox.y = svgY - (svgY - currentViewBox.y) * (newH / currentViewBox.h);
    currentViewBox.w = newW;
    currentViewBox.h = newH;
    currentScale = defaultViewBox.w / newW;

    applyViewBox();
}

// ==========================================
// Thiet lap cac nut dieu khien zoom
// ==========================================
function setupZoomButtons() {
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const zoomReset = document.getElementById('zoom-reset');

    if (zoomIn) {
        zoomIn.addEventListener('click', () => {
            const rect = svgElement.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            zoomAtPoint(cx, cy, 0.75);
        });
    }

    if (zoomOut) {
        zoomOut.addEventListener('click', () => {
            const rect = svgElement.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            zoomAtPoint(cx, cy, 1.33);
        });
    }

    if (zoomReset) {
        zoomReset.addEventListener('click', () => {
            currentViewBox = { ...defaultViewBox };
            currentScale = 1;
            applyViewBox();
        });
    }
}

// ==========================================
// Ap dung viewBox hien tai len SVG
// ==========================================
function applyViewBox() {
    if (svgElement) {
        svgElement.setAttribute('viewBox',
            `${currentViewBox.x} ${currentViewBox.y} ${currentViewBox.w} ${currentViewBox.h}`
        );
    }
}

// ==========================================
// Ham tien ich: tao phan tu SVG
// ==========================================
function createSvgElement(tag, attrs = {}) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [key, val] of Object.entries(attrs)) {
        el.setAttribute(key, val);
    }
    return el;
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
        if (!graphData || !svgElement) return;

        routeHighlighted = true;
        const stationSet = new Set(stationIds);

        // Lam mo tat ca ket noi va ga
        svgElement.querySelectorAll('.map-connection').forEach(el => {
            el.setAttribute('stroke-opacity', '0.12');
        });
        svgElement.querySelectorAll('.map-station').forEach(el => {
            el.setAttribute('fill-opacity', '0.3');
            el.setAttribute('stroke-opacity', '0.3');
        });
        svgElement.querySelectorAll('.map-station-outer').forEach(el => {
            el.setAttribute('stroke-opacity', '0.1');
        });
        svgElement.querySelectorAll('.map-label').forEach(el => {
            el.setAttribute('fill-opacity', '0.2');
        });

        // To sang cac ga tren tuyen
        svgElement.querySelectorAll('.map-station').forEach(el => {
            const id = el.getAttribute('data-id');
            if (stationSet.has(id)) {
                el.setAttribute('fill-opacity', '1');
                el.setAttribute('stroke-opacity', '1');
                el.setAttribute('r', parseFloat(el.getAttribute('r')) + 2);
            }
        });
        svgElement.querySelectorAll('.map-station-outer').forEach(el => {
            const id = el.getAttribute('data-id');
            if (stationSet.has(id)) {
                el.setAttribute('stroke-opacity', '0.6');
            }
        });
        svgElement.querySelectorAll('.map-label').forEach(el => {
            const id = el.getAttribute('data-id');
            if (stationSet.has(id)) {
                el.setAttribute('fill-opacity', '1');
                el.setAttribute('font-weight', '700');
            }
        });

        // To sang cac ket noi tren tuyen
        // Tao tap hop cac cap ga lien tiep tren tuyen
        const connectionPairs = new Set();
        for (let i = 0; i < stationIds.length - 1; i++) {
            const a = stationIds[i];
            const b = stationIds[i + 1];
            connectionPairs.add(`${a}-${b}`);
            connectionPairs.add(`${b}-${a}`);
        }

        svgElement.querySelectorAll('.map-connection').forEach(el => {
            const from = el.getAttribute('data-from');
            const to = el.getAttribute('data-to');
            if (connectionPairs.has(`${from}-${to}`)) {
                el.setAttribute('stroke-opacity', '1');
                el.setAttribute('stroke-width', '6');
            }
        });

        // Ve duong highlight len highlight layer
        const highlightLayer = svgElement.querySelector('#highlight-layer');
        if (highlightLayer) {
            highlightLayer.innerHTML = '';

            // Tao duong path cho tuyen
            for (const seg of segments) {
                const color = seg.color || MAP_LINE_COLORS[seg.line] || '#888';
                const segStations = seg.stations || [];

                for (let i = 0; i < segStations.length - 1; i++) {
                    const posA = STATION_POSITIONS[segStations[i].id];
                    const posB = STATION_POSITIONS[segStations[i + 1].id];
                    if (!posA || !posB) continue;

                    const glow = createSvgElement('line', {
                        x1: posA.x, y1: posA.y,
                        x2: posB.x, y2: posB.y,
                        stroke: color,
                        'stroke-width': 10,
                        'stroke-opacity': 0.2,
                        'stroke-linecap': 'round',
                        class: 'highlight-glow'
                    });
                    highlightLayer.appendChild(glow);
                }
            }
        }
    },

    /**
     * Xoa tat ca to sang, khoi phuc trang thai binh thuong
     */
    clearHighlight() {
        if (!svgElement || !routeHighlighted) return;

        routeHighlighted = false;

        // Khoi phuc opacity cua tat ca phan tu
        svgElement.querySelectorAll('.map-connection').forEach(el => {
            const isActive = el.getAttribute('stroke-dasharray') === 'none';
            el.setAttribute('stroke-opacity', isActive ? '1' : '0.25');
            el.setAttribute('stroke-width', '4');
        });

        svgElement.querySelectorAll('.map-station').forEach(el => {
            el.setAttribute('fill-opacity', '1');
            el.setAttribute('stroke-opacity', '1');
            // Khoi phuc kich thuoc goc
            const isTransfer = el.classList.contains('transfer');
            const isTerminal = el.classList.contains('terminal');
            const origRadius = isTransfer ? 7 : (isTerminal ? 6 : 5);
            el.setAttribute('r', origRadius);
        });

        svgElement.querySelectorAll('.map-station-outer').forEach(el => {
            el.setAttribute('stroke-opacity', '0.4');
        });

        svgElement.querySelectorAll('.map-label').forEach(el => {
            el.setAttribute('fill-opacity', '1');
            el.setAttribute('font-weight', el.dataset.origWeight || '400');
        });

        // Xoa highlight layer
        const highlightLayer = svgElement.querySelector('#highlight-layer');
        if (highlightLayer) {
            highlightLayer.innerHTML = '';
        }
    }
};
