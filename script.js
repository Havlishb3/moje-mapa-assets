// --- Globální proměnné mapy ---
let map;
const layers = {}; // Ponecháno jako const, protože je inicializováno prázdné
// ---

// --- Načítání a parsování dat ---
async function loadDataAndInitializeMap() {
    const loader = document.getElementById('loader');
    try {
        const url = "https://docs.google.com/spreadsheets/d/e/2PACX-1vTY-6570BAeMTiNxbI4Sn1GEMmnhoaKC-M-hZRBWUP8HHe5N9Qr_OfJcmFLs0B_tQ5nh4P3E7rhIlCV/pub?gid=0&single=true&output=csv";
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.statusText}`);
        }
        const csvText = await response.text();

        // Jednoduchý, ale robustní parser pro formát Key,"Value\nValueLine2\nValueLine3"
        const dataStore = {};
        const lines = csvText.split('\n'); // Split by newline
        
        // Skip header
        let i = 1;
        while (i < lines.length) {
            let line = lines[i];
            if (!line || line.trim().length === 0) {
                i++;
                continue;
            }

            const commaIndex = line.indexOf(',');
            if (commaIndex === -1) {
                 i++;
                 continue;
            }
             
            const key = line.substring(0, commaIndex);
            let value = line.substring(commaIndex + 1);
            let finalValue = "";

            // Zpracování hodnoty
            if (value.startsWith('"')) {
                // Multiline quoted value
                let multilineValue = [value.substring(1)]; // Add first line, remove start quote
                
                while (i < lines.length) {
                    let lastLine = multilineValue[multilineValue.length - 1];
                    let lastCharIndex = lastLine.length - 1;
                    
                    // Najde poslední index znaku, který není whitespace
                    while(lastCharIndex >= 0 && (lastLine[lastCharIndex] === '\r' || lastLine[lastCharIndex] === '\n')) {
                        lastCharIndex--;
                    }

                    // Zkontroluje, zda je poslední znak (mimo whitespace) uvozovka
                    if (lastCharIndex >= 0 && lastLine[lastCharIndex] === '"') {
                        // Zkontroluje, zda nejde o escapovanou uvozovku ("")
                        if (lastCharIndex > 0 && lastLine[lastCharIndex - 1] === '"') {
                            // Escapovaná uvozovka, pokračuje dál
                        } else {
                            // Je to koncová uvozovka. Odstraní ji a vše za ní.
                            multilineValue[multilineValue.length - 1] = lastLine.substring(0, lastCharIndex);
                            break; // Ukončí vnitřní smyčku
                        }
                    }
                    
                    // Není to poslední řádek, nebo soubor končí
                    i++;
                    if (i >= lines.length) break;
                    
                    multilineValue.push(lines[i]);
                }
                
                finalValue = multilineValue.join('\n').replace(/""/g, '"');
                
            } else {
                // Jednoduchá hodnota bez uvozovek
                finalValue = value;
            }

            // Trim whitespace and carriage return from the final value
            finalValue = finalValue.trim();

            // --- Parsování JSON vždy po získání finalValue ---
            if (key === 'points' || key === 'circularZones' || key === 'groupColors' || key === 'arpLzib') {
                try {
                    dataStore[key] = JSON.parse(finalValue);
                } catch (e) {
                    console.error(`Chyba při parsování JSON pro klíč ${key}:`, e, `|${finalValue}|`);
                    dataStore[key] = finalValue;
                }
            } else {
                dataStore[key] = finalValue;
            }
            // --- KONEC LOGIKY ---
            
            i++; // Posun na další klíč
        }

        // --- Data jsou naparsována v `dataStore` ---
        
        // Skryjeme loader a inicializujeme mapu
        loader.style.display = 'none';
        initializeMap(dataStore);

    } catch (error) {
        console.error("Nepodařilo se načíst data mapy:", error);
        loader.innerHTML = `<div style="text-align: center; color: #e74c3c;">
            <h2>Chyba při načítání dat</h2>
            <p>Nemohu se připojit k Google Sheets. Zkuste prosím obnovit stránku.</p>
            <p style="font-size: 12px; color: #aaa;">${error.message}</p>
            Zkontrolujte prosím konzoli (F12) pro více detailů.
        </div>`;
    }
}

// -----------------------------------------------------------------
// ZAČÁTEK PŮVODNÍHO KÓDU MAPY (nyní zabaleného ve funkci)
// -----------------------------------------------------------------
function initializeMap(data) {
    
    // --- PŘIDÁNO: Definice mapy ---
    map = L.map('map').setView([48.8, 17.5], 8); // Přiřadí globální proměnnou
    map.doubleClickZoom.disable(); // Vypnutí zoomu na dvojklik

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd', maxZoom: 20
    }).addTo(map);
    // --- KONEC: Definice mapy ---

    // --- DATA ---
    // Data jsou nyní v objektu 'data'
    
    // const layers = {}; // PŘESUNUTO DO GLOBÁLNÍHO SCOPE
    
    const allIndividualLayers = [];
    const protectedPointStrings = new Set();
    const getDistance = (p1, p2) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
    const alamuLongitude = 18.33;
    
    // --- Globální proměnné pro data, která se načtou ---
    let lzr1MalackyArp = null;
    let arpLzib = null;
    let arpLzppNew = null;
    let lzp23Center = null;
    let fullBorderPoints = [];
    let borderLineSegments = [];
    // ---

    function parseDmsCoords(coordString) {
        if (!coordString) return null;
        // Odstranění přebytečných znaků N/E na konci, pokud tam jsou
        coordString = coordString.replace(/N$/, '').replace(/E$/, '').trim();
        const parts = coordString.trim().split(/\s+/);
        if (parts.length < 2) return null;
        let latStr = parts[0];
        let lngStr = parts[1];

        const parseDMS = (dms, isLng) => {
            const degLen = isLng ? 3 : 2;
            // Ujistíme se, že máme 6 (lat) nebo 7 (lng) znaků pro D-M-S
            dms = dms.replace(/[^0-9]/g, ''); // Jen čísla
            
            let degrees, minutes, seconds;

            if (dms.length >= 6) { // 482028 / 0172442
                degrees = parseInt(dms.substring(0, degLen), 10);
                minutes = parseInt(dms.substring(degLen, degLen + 2), 10);
                seconds = parseInt(dms.substring(degLen + 2, degLen + 4), 10);
            } else if (dms.length >= 4) { // 4820 / 01724 (jen stupně a minuty)
                degrees = parseInt(dms.substring(0, degLen), 10);
                minutes = parseInt(dms.substring(degLen, degLen + 2), 10);
                seconds = 0;
            } else {
                // Fallback pro případ, kdyby přišel jen 475116N
                if (dms.length === 6) {
                     degrees = parseInt(dms.substring(0, 2), 10);
                     minutes = parseInt(dms.substring(2, 4), 10);
                     seconds = parseInt(dms.substring(4, 6), 10);
                } else {
                     throw new Error(`Neplatný formát DMS: ${dms}`);
                }
            }

            return degrees + minutes / 60 + seconds / 3600;
        };
        try { return [parseDMS(latStr, false), parseDMS(lngStr, true)]; }
        catch (e) { console.error(`Chyba při parsování: ${coordString}`, e); return null; }
    }

    // Funkce pro zpracování načtených dat hranic
    function processBorderData(coordinatesData) {
        let borderCoords = coordinatesData.trim().split('\n').filter(line => line.trim() !== '').map(line => {
            const [lng, lat] = line.split(',');
            return [parseFloat(lat), parseFloat(lng)];
        });
        
        if (borderCoords.length > 0) {
            let tempCoords = [...borderCoords];
            while(tempCoords.length > 0) {
                let segment = [tempCoords.shift()];
                let lastPoint = segment[0];
                let changed = true;
                while(changed) {
                    changed = false;
                    let nearestIdx = -1;
                    let minDistance = 0.5;
                    for(let i = 0; i < tempCoords.length; i++) {
                        const dist = getDistance(lastPoint, tempCoords[i]);
                        if (dist < minDistance) {
                            minDistance = dist;
                            nearestIdx = i;
                        }
                    }
                    if (nearestIdx !== -1) {
                        lastPoint = tempCoords[nearestIdx];
                        segment.push(lastPoint);
                        tempCoords.splice(nearestIdx, 1);
                        changed = true;
                    }
                }
                borderLineSegments.push(segment);
            }
        }
        fullBorderPoints = borderLineSegments.reduce((acc, seg) => acc.concat(seg), []);
    }


    function calculateArcPoints(center, radiusNM, startPoint, endPoint, clockwise = false) {
        if (!center || !startPoint || !endPoint) return [];
        const radiusDeg = radiusNM * 1.852 / 111.32;
        const centerLat = center[0], centerLng = center[1];
        const startLat = startPoint[0], startLng = startPoint[1];
        const endLat = endPoint[0], endLng = endPoint[1];

        let startAngle = Math.atan2(startLat - centerLat, startLng - centerLng);
        let endAngle = Math.atan2(endLat - centerLat, endLng - centerLng);
        
        if (clockwise) { if (endAngle > startAngle) endAngle -= 2 * Math.PI; } 
        else { if (endAngle < startAngle) endAngle += 2 * Math.PI; }

        const points = [], numPoints = 30;
        const angleStep = (endAngle - startAngle) / numPoints;

        for (let i = 0; i <= numPoints; i++) {
            const angle = startAngle + i * angleStep;
            const lat = centerLat + radiusDeg * Math.sin(angle);
            const lng = centerLng + radiusDeg * Math.cos(angle) / Math.cos(centerLat * Math.PI / 180);
            points.push([lat, lng]);
        }
        return points;
    }
    
    function buildAndAddPolygon(definition) {
        let finalCoords = [];

        if (!definition.segments) {
            console.error("Definice segmentů chybí pro:", definition.name);
            return;
        }

        definition.segments.forEach((segment, index) => {
            let segmentCoords = [];

            if (segment.type === 'line') {
                segmentCoords = segment.points.map(parseDmsCoords).filter(c => c);
            } else if (segment.type === 'arc') {
                const startPoint = parseDmsCoords(segment.start);
                const endPoint = parseDmsCoords(segment.end);
                if (startPoint && endPoint) {
                    segmentCoords = calculateArcPoints(segment.center, segment.radius, startPoint, endPoint, segment.cw);
                }
            } else if (segment.type === 'border') {
                const startPoint = parseDmsCoords(segment.start);
                const endPoint = parseDmsCoords(segment.end);

                if (startPoint && endPoint) {
                    let pathFound = false;
                    for (const seg of borderLineSegments) {
                        let closestStartIndex = -1, closestEndIndex = -1;
                        let minStartDist = Infinity, minEndDist = Infinity;
                        
                        seg.forEach((point, index) => {
                            const dist = getDistance(startPoint, point);
                            if (dist < minStartDist) {
                                minStartDist = dist;
                                closestStartIndex = index;
                            }
                        });

                        seg.forEach((point, index) => {
                            const dist = getDistance(endPoint, point);
                            if (dist < minEndDist) {
                                minEndDist = dist;
                                closestEndIndex = index;
                            }
                        });

                        // Zvýšená tolerance pro nalezení bodů
                        if (minStartDist < 0.2 && minEndDist < 0.2) {
                            const sliceStart = Math.min(closestStartIndex, closestEndIndex);
                            const sliceEnd = Math.max(closestStartIndex, closestEndIndex) + 1;
                            segmentCoords = seg.slice(sliceStart, sliceEnd);
                            
                            const lastOverallPoint = finalCoords.length > 0 ? finalCoords[finalCoords.length - 1] : startPoint;
                            
                            if (segmentCoords.length > 1 && getDistance(lastOverallPoint, segmentCoords[0]) > getDistance(lastOverallPoint, segmentCoords[segmentCoords.length - 1])) {
                               segmentCoords.reverse();
                            }
                           
                            segmentCoords.forEach(p => protectedPointStrings.add(p.join(',')));
                            pathFound = true;
                            break; 
                        }
                    }
                    if (!pathFound) {
                        console.error("Could not find a border segment path for", segment.start, "to", segment.end, ". Falling back to straight line.");
                        segmentCoords = [startPoint, endPoint];
                    }
                }
            }

            if (index > 0 && finalCoords.length > 0 && segmentCoords.length > 0) {
                const lastPoint = finalCoords[finalCoords.length - 1];
                const firstNewPoint = segmentCoords[0];
                if (getDistance(lastPoint, firstNewPoint) < 0.0001) {
                    segmentCoords.shift();
                }
            }
            
            finalCoords.push(...segmentCoords);
        });

        if (finalCoords.length > 2) {
            // --- ÚPRAVA: Podmíněné styly a interaktivita pro SMA ---
            const isSMA = definition.class === 'SMA';
            
            const polyOptions = {
                color: definition.color,
                fillColor: definition.color,
                weight: 2,
                fillOpacity: isSMA ? 0.0 : 0.3, // Pouze obrys pro SMA
                dashArray: isSMA ? '5, 5' : null, // Čárkovaný obrys pro SMA
                interactive: !isSMA // SMA není interaktivní (pro popupy)
            };

            const polygon = L.polygon(finalCoords, polyOptions);
            // --- Konec úpravy ---
            
            polygon.airspaceInfo = {
                name: definition.name,
                upper: definition.upper,
                lower: definition.lower,
                class: definition.class,
                color: definition.color
            };

            // --- ÚPRAVA: Popup pouze pro non-SMA ---
            if (!isSMA) {
                polygon.on('dblclick', (e) => {
                    L.popup().setLatLng(e.latlng).setContent(definition.popup).openOn(map);
                    L.DomEvent.stopPropagation(e); // Zastaví propagaci eventu na mapu
                });
            }
            // --- Konec úpravy ---

            if (!layers[definition.name]) {
                layers[definition.name] = L.layerGroup();
            }
            layers[definition.name].addLayer(polygon);
            allIndividualLayers.push(polygon);

            // --- PŘIDÁNO: Permanentní popisek (výška) pro SMA ---
            if (isSMA) {
                // Najdeme "střed" polygonu pro popisek
                let centerLabel = polygon.getBounds().getCenter(); // Změněno na let
                const labelText = `${definition.lower}'`;

                // *** ÚPRAVA: Posun popisku pro SMAA 02 ***
                if (definition.name === "IB SMAA 02") {
                    // Posuneme o kousek vpravo (zvětšíme longitude)
                    centerLabel.lng += 0.08; 
                }
                // *** KONEC ÚPRAVY ***
                
                const labelMarker = L.marker(centerLabel, {
                     icon: L.divIcon({
                         className: 'sma-label',
                         html: labelText
                     }),
                     interactive: false // Popisek není klikatelný
                 });
                layers[definition.name].addLayer(labelMarker);
            }
            // --- Konec přidání ---
        }
    }
    
    // --- Nová funkcionalita pro vertikální profil ---
    let crosshairMarker = null;
    const profileView = document.getElementById('profile-view');
    const profileScaleContainer = document.getElementById('profile-scale-container');
    const profileAirspacesContainer = document.getElementById('profile-airspaces-container');
    const coordsDisplay = document.getElementById('coords-display');
    
    document.querySelector('.profile-close').addEventListener('click', () => {
        profileView.style.display = 'none';
    });

    function altitudeToPixel(ft, totalHeight) {
        const ALT1 = 5000, ALT2 = 12500, ALT3 = 20000, ALT4 = 30000, ALT5 = 66000;
        const r = [ALT1, ALT2 - ALT1, ALT3 - ALT2, ALT4 - ALT3, ALT5 - ALT4];
        const s = [1.5, 1.0, 1.0/3.0, 1.0/6.0, 1.0/12.0];
        const norm = r.map((range, i) => range * s[i]);
        const totalNorm = norm.reduce((a, b) => a + b, 0);
        const h = norm.map(n => (n / totalNorm) * totalHeight);

        let y = 0;
        if (ft <= ALT1) { y = (ft / r[0]) * h[0]; } 
        else if (ft <= ALT2) { y = h[0] + ((ft - ALT1) / r[1]) * h[1]; } 
        else if (ft <= ALT3) { y = h[0] + h[1] + ((ft - ALT2) / r[2]) * h[2]; } 
        else if (ft <= ALT4) { y = h[0] + h[1] + h[2] + ((ft - ALT3) / r[3]) * h[3]; } 
        else { y = h[0] + h[1] + h[2] + h[3] + ((ft - ALT4) / r[4]) * h[4]; }
        return y;
    }

    // Pomocná funkce pro Point-in-Polygon
    function isPointInPoly(latlng, polyPoints) {
        let x = latlng.lat, y = latlng.lng;
        let inside = false;
        if (!polyPoints || polyPoints.length === 0) {
            return false;
        }
        for (let i = 0, j = polyPoints.length - 1; i < polyPoints.length; j = i++) {
            let xi = polyPoints[i].lat, yi = polyPoints[i].lng;
            let xj = polyPoints[j].lat, yj = polyPoints[j].lng;
            let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    }

    function isMarkerInside(latlng, layer) {
         if (layer instanceof L.Polygon) {
              if (!layer.getLatLngs() || layer.getLatLngs().length === 0) return false;
              
              const latLngs = layer.getLatLngs();
              
              // Kontrola, zda latLngs[0] je pole souřadnic nebo pole polí (pro díry)
              if (Array.isArray(latLngs[0]) && latLngs[0].length > 0 && latLngs[0][0] instanceof L.LatLng) {
                  // Standardní L.Polygon (může mít díry)
                  const outer = latLngs[0];
                  if (!isPointInPoly(latlng, outer)) return false;
                  
                  // Zkontroluj díry
                  for (let i = 1; i < latLngs.length; i++) {
                      if (isPointInPoly(latlng, latLngs[i])) return false; // Je v díře
                  }
                  return true; // Je ve vnějším, ale ne v dírách
              }
              else if (latLngs.length > 0 && latLngs[0] instanceof L.LatLng) {
                   // Jednoduchý polygon (bez pole pro díry)
                  return isPointInPoly(latlng, latLngs);
              }
              // Selhání, pokud formát není rozpoznán
              return false;

         } else if (layer instanceof L.Circle) {
              return latlng.distanceTo(layer.getLatLng()) <= layer.getRadius();
         }
         return false;
    }


    function toDMS(deg, isLng) {
        const d = Math.floor(Math.abs(deg));
        const minFloat = (Math.abs(deg) - d) * 60;
        const m = Math.floor(minFloat);
        const secFloat = (minFloat - m) * 60;
        const s = Math.round(secFloat);
        const dir = deg < 0 ? (isLng ? 'W' : 'S') : (isLng ? 'E' : 'N');
        return `${d.toString().padStart(isLng ? 3 : 2, '0')}${m.toString().padStart(2, '0')}${s.toString().padStart(2, '0')}${dir}`;
    }
    
    // *** ZMĚNA PRIORIT ZDE ***
    const classPriority = { 
        'LZR31B': 12, 'LZR31C': 12, 'LZR31D': 12, // Vnitřní
        'LZR31E': 11, // Prostřední
        'LZR31A': 10, // Vnější
        'LZR222 Turecký Vrch Peter': 9,
        'LZR223 Turecký Vrch Viktor': 9,
        'LZR1 Malacky': 8,
        'LZR2 Malacky': 8,
        'LZR40': 8,
        'LZR314': 8,
        'LZR': 7, // Obecná LZR priorita
        'P': 6, 
        'DANGER': 5, 
        'C': 4, // TMA 1-3, CTR Stef., LESMO
        'D': 3, // Piestany
        // 'TMA 4 BRATISLAVA': 2, // Odebráno
        'TMA4': 2, // PŘIDÁNO: Nová třída pro TMA 4
        'G': 1,
        'SMA': 0 // Nejnižší priorita
    };

    
    // -----------------------------------------------------------------
    // ZAČÁTEK SESTAVOVÁNÍ MAPY
    // -----------------------------------------------------------------

    // 1. Zpracování dat
    processBorderData(data.coordinatesData);
    
    lzr1MalackyArp = parseDmsCoords(data.lzr1MalackyArpString);
    arpLzib = data.arpLzib; // Převzato přímo
    arpLzppNew = parseDmsCoords(data.arpLzppNewString);
    lzp23Center = parseDmsCoords(data.lzp23CenterString);

    // 2. Definice prostorů (používají globální proměnné)
    const ma1Points = data.ma1Data.trim().split('\n');
    const ma1Definition = {
        name: "TMA 1 BRATISLAVA",
        color: '#3498db', // ZMĚNA BARVY
        popup: '<strong>TMA 1 BRATISLAVA</strong><br>5 000 ft AMSL / 1 500 ft AMSL<br>Trieda C',
        upper: 5000, lower: 1500, class: 'C',
        segments: [
            { type: 'line', points: ma1Points.slice(0, 5) },
            { type: 'border', start: ma1Points[4], end: ma1Points[5] },
            { type: 'line', points: ma1Points.slice(5, 8) },
            { type: 'arc', center: arpLzib, radius: 7, start: ma1Points[7], end: ma1Points[8], cw: false },
            { type: 'line', points: ma1Points.slice(8) }
        ]
    };
    
    const ctrPoints = data.ctrData.trim().split('\n');
    const ctrDefinition = {
        name: "CTR ŠTEFÁNIK",
        color: '#2980b9', // Barva (ponechána)
        popup: '<strong>CTR ŠTEFÁNIK</strong><br>5 000 ft AMSL / GND<br>Trieda C',
        upper: 5000, lower: 0, class: 'C',
        segments: [
            { type: 'line', points: ctrPoints.slice(0, 3) },
            { type: 'arc', center: parseDmsCoords("481012N 0171246E"), radius: 7, start: ctrPoints[2], end: ctrPoints[3], cw: true },
            { type: 'line', points: ctrPoints.slice(3, 6) },
            { type: 'border', start: ctrPoints[5], end: ctrPoints[6] },
            { type: 'line', points: ctrPoints.slice(6) }
        ]
    };

    const tma4Points = data.tma4Data.trim().split('\n');
    const tma4Definition = {
        name: "TMA 4 BRATISLAVA",
        color: '#aed6f1', // ZMĚNA BARVY
        popup: '<strong>TMA 4 BRATISLAVA</strong><br>FL 125 / 5 000 ft AMSL<br>Trieda C',
        upper: 12500, lower: 5000, class: 'TMA4', // *** ZMĚNA: Z 'C' na 'TMA4' ***
        segments: [
            { type: 'line', points: tma4Points },
            { type: 'border', start: tma4Points[tma4Points.length - 1], end: tma4Points[0] }
        ]
    };
    
    const tma3Points = data.tma3Data.trim().split('\n');
    const tma3Definition = {
        name: "TMA 3 BRATISLAVA",
        color: '#85c1e9', // ZMĚNA BARVY
        popup: '<strong>TMA 3 BRATISLAVA</strong><br>5 000 ft AMSL / 2 500 ft AMSL<br>Trieda C',
        upper: 5000, lower: 2500, class: 'C',
        segments: [
            { type: 'line', points: tma3Points.slice(0, 5) },
            { type: 'border', start: tma3Points[4], end: tma3Points[5] },
            { type: 'line', points: tma3Points.slice(5) }
        ]
    };

    const tma2Points = data.tma2Data.trim().split('\n');
    const tma2Definition = {
        name: "TMA 2 BRATISLAVA",
        color: '#5dade2', // ZMĚNA BARVY
        popup: '<strong>TMA 2 BRATISLAVA</strong><br>5 000 ft AMSL / 2 500 ft AMSL<br>Trieda C',
        upper: 5000, lower: 2500, class: 'C',
        segments: [
            { type: 'line', points: tma2Points },
            { type: 'border', start: tma2Points[tma2Points.length - 1], end: tma2Points[0] }
        ]
    };
    
    const tma1PiestanyPoints = data.tma1PiestanyData.trim().split('\n');
    const tma1PiestanyDefinition = {
        name: "TMA 1 PIEŠŤANY",
        color: '#2ecc71', // ZMĚNA BARVY
        popup: '<strong>TMA 1 PIEŠŤANY</strong><br>5 000 ft AMSL / 2 500 ft AMSL<br>Trieda D',
        upper: 5000, lower: 2500, class: 'D',
        segments: [
            { type: 'line', points: tma1PiestanyPoints.slice(0, 2) },
            { type: 'arc', center: arpLzppNew, radius: 7, start: tma1PiestanyPoints[1], end: tma1PiestanyPoints[2], cw: false},
            { type: 'line', points: tma1PiestanyPoints.slice(2, 6) },
            { type: 'arc', center: arpLzppNew, radius: 7, start: tma1PiestanyPoints[5], end: tma1PiestanyPoints[6], cw: false},
            { type: 'line', points: tma1PiestanyPoints.slice(6) },
        ]
    };

    const tma2PiestanyPoints = data.tma2PiestanyData.trim().split('\n');
    const tma2PiestanyDefinition = {
        name: "TMA 2 PIEŠŤANY",
        color: '#a3e4d7', // ZMĚNA BARVY
        popup: '<strong>TMA 2 PIEŠŤANY</strong><br>5 000 ft AMSL / 3 500 ft AMSL<br>Trieda D',
        upper: 5000, lower: 3500, class: 'D',
        segments: [
             { type: 'line', points: tma2PiestanyPoints }
        ]
    };
    
    const ctrPiestanyPoints = data.ctrPiestanyData.trim().split('\n');
    const ctrPiestanyDefinition = {
        name: "CTR PIEŠŤANY",
        color: '#1abc9c', // Barva (ponechána)
        popup: '<strong>CTR PIEŠŤANY</strong><br>5 000 ft AMSL / GND<br>Trieda D',
        upper: 5000, lower: 0, class: 'D',
        segments: [
            { type: 'line', points: ctrPiestanyPoints.slice(0, 3) },
            { type: 'arc', center: arpLzppNew, radius: 7, start: ctrPiestanyPoints[2], end: ctrPiestanyPoints[3], cw: true },
            { type: 'line', points: ctrPiestanyPoints.slice(3, 7) },
            { type: 'arc', center: arpLzppNew, radius: 7, start: ctrPiestanyPoints[6], end: ctrPiestanyPoints[7], cw: true },
            { type: 'line', points: ctrPiestanyPoints.slice(7) }
        ]
    };
    
    const lesmoPoints = data.lesmoData.trim().split('\n');
    const lesmoDefinition = {
        name: "LESMO Area",
        color: '#95a5a6',
        popup: '<strong>LESMO Area</strong><br>FL 245 / 5 500 ft AMSL<br>Trieda C',
        upper: 24500,
        lower: 5500,
        class: 'C',
        segments: [
            {
                type: 'border',
                start: lesmoPoints[0],
                end: lesmoPoints[1],
            },
            { 
             type: 'line', 
             points: [
                lesmoPoints[1], 
                lesmoPoints[2], 
                lesmoPoints[3], 
                lesmoPoints[4], 
                lesmoPoints[5], 
                lesmoPoints[0]
             ]
            }
        ]
    };

    const lzr1Definition = {
        name: "LZR1 Malacky",
        color: '#e74c3c',
        popup: '<strong>LZR1 Malacky</strong><br>5 000 ft AMSL / 2 000 ft AMSL<br>Trieda G, Aktívny: H24<br>Vstup len so súhlasom MIL APP Malacky (min. 3 min vopred na 120,750 MHz). Povinné SSR.',
        upper: 5000,
        lower: 2000,
        class: 'G',
        segments: [
            { type: 'line', points: ["484622N 0170344E", "483442N 0172235E", "482849N 0171500E"] },
            { type: 'arc', center: lzr1MalackyArp, radius: 7, start: "482849N 0171500E", end: "482931N 0171355E", cw: false },
            { type: 'line', points: ["482931N 0171355E", "483340N 0171552E", "483518N 0170755E", "483109N 0170610E"] },
            { type: 'arc', center: lzr1MalackyArp, radius: 7, start: "483109N 0170610E", end: "481833N 0170053E", cw: false },
            { type: 'line', points: ["481833N 0170053E", "481933N 0165432E"] },
            { type: 'border', start: "481933N 0165432E", end: "484622N 0170344E" }
        ]
    };

    const lzr2Definition = {
        name: "LZR2 Malacky",
        color: '#e74c3c',
        popup: '<strong>LZR2 Malacky</strong><br>5 000 ft AMSL / 3 500 ft AMSL<br>Trieda G, Aktívny: H24<br>Vstup len so súhlasom MIL APP Malacky (min. 3 min vopred na 120,750 MHz). Povinné SSR.',
        upper: 5000,
        lower: 3500,
        class: 'G',
        segments: [
            { type: 'line', points: [
                "484932N 0172452E",
                "484442N 0173203E",
                "483649N 0172519E",
                "483241N 0172548E",
                "482759N 0172622E",
                "481859N 0171741E",
                "481845N 0171343E"
            ]},
            { type: 'arc', center: lzr1MalackyArp, radius: 7, start: "481845N 0171343E", end: "482849N 0171500E", cw: false },
            { type: 'line', points: [
                "482849N 0171500E",
                "483442N 0172235E",
                "484622N 0170344E"
            ]},
            { type: 'border', start: "484622N 0170344E", end: "484932N 0172452E" }
        ]
    };

    const lzr31aDefinition = {
        name: "LZR31A",
        color: '#e74c3c',
        popup: '<strong>LZR31A</strong><br>FL 520 / GND<br>AMC spravovaný priestor, Streľby.',
        upper: 52000, lower: 0, class: 'LZR',
        segments: [{ type: 'line', points: [
            "483317N 0170448E",
            "483143N 0170733E",
            "482916N 0170319E",
            "482606N 0170749E",
            "482833N 0171218E",
            "482748N 0171342E",
            "482422N 0170920E",
            "482055N 0170552E",
            "482231N 0165948E",
            "483004N 0170009E",
            "483317N 0170448E"
        ]}]
    };

    const lzr31bDefinition = {
        name: "LZR31B",
        color: '#e74c3c',
        popup: '<strong>LZR31B</strong><br>FL 520 / GND<br>AMC spravovaný priestor, Streľby.',
        upper: 52000, lower: 0, class: 'LZR',
        segments: [{ type: 'line', points: [
            "483143N 0170733E",
            "482833N 0171218E",
            "482606N 0170749E",
            "482916N 0170319E",
            "483143N 0170733E"
        ]}]
    };

    const lzr31cDefinition = {
        name: "LZR31C",
        color: '#e74c3c',
        popup: '<strong>LZR31C</strong><br>FL 520 / GND<br>AMC spravovaný priestor, Streľby.',
        upper: 52000, lower: 0, class: 'LZR',
        segments: [{ type: 'line', points: [
            "483409N 0171322E",
            "483105N 0171725E",
            "482833N 0171218E",
            "483143N 0170733E",
            "483409N 0171322E"
        ]}]
    };

    const lzr31dDefinition = {
        name: "LZR31D",
        color: '#e74c3c',
        popup: '<strong>LZR31D</strong><br>FL 520 / GND<br>AMC spravovaný priestor, Streľby.',
        upper: 52000, lower: 0, class: 'LZR',
        segments: [{ type: 'line', points: [
            "483904N 0171930E",
            "483718N 0172402E",
            "483105N 0171725E",
            "483409N 0171322E",
            "483904N 0171930E"
        ]}]
    };

    const lzr31eDefinition = {
        name: "LZR31E",
        color: '#e74c3c',
        popup: '<strong>LZR31E</strong><br>FL 520 / GND<br>AMC spravovaný priestor, Streľby.',
        upper: 52000, lower: 0, class: 'LZR',
        segments: [{ type: 'line', points: [
            "484036N 0171526E",
            "483904N 0171930E",
            "483409N 0171322E",
            "483143N 0170733E",
            "483317N 0170448E",
            "484036N 0171526E"
        ]}]
    };

    const lzr40Definition = {
        name: "LZR40",
        color: '#e74c3c',
        popup: '<strong>LZR40</strong><br>8 000 ft AMSL / 1 000 ft AGL<br>AMC spravovaný priestor, Výcvik vojenského letectva.',
        upper: 8000,
        lower: 1000, // AGL - ve profilu se zobrazí jako 1000 AMSL
        class: 'LZR',
        segments: [{ type: 'line', points: [
            "490237N 0183309E",
            "485533N 0183817E",
            "483133N 0180633E",
            "483517N 0180032E",
            "483712N 0180015E",
            "484225N 0175931E",
            "490228N 0182201E",
            "490237N 0183309E"
        ]}]
    };

    const lzr222Definition = {
        name: "LZR222 Turecký Vrch Peter",
        color: '#e74c3c',
        popup: '<strong>LZR222 Turecký Vrch Peter</strong><br>FL 165 / GND<br>AMC spravovaný priestor, Streľby.',
        upper: 16500,
        lower: 0,
        class: 'LZR',
        segments: [{ type: 'line', points: [
            "482218N 0171057E",
            "482153N 0171158E",
            "481941N 0170955E",
            "482007N 0170853E",
            "482218N 0171057E"
        ]}]
    };

    const lzr223Definition = {
        name: "LZR223 Turecký Vrch Viktor",
        color: '#e74c3c',
        popup: '<strong>LZR223 Turecký Vrch Viktor</strong><br>FL 215 / GND<br>AMC spravovaný priestor, Streľby.',
        upper: 21500,
        lower: 0,
        class: 'LZR',
        segments: [{ type: 'line', points: [
            "482003N 0171027E",
            "481904N 0171107E",
            "481722N 0170523E",
            "481821N 0170444E",
            "482003N 0171027E"
        ]}]
    };
    
    const lzr314Definition = {
        name: "LZR314",
        color: '#c0392b', // Jiný odstín červené
        popup: '<strong>LZR314</strong><br>5 000 ft AMSL / GND<br>Trieda G, Aktívny: H24<br>Vstup len so súhlasom MIL TWR Malacky (min. 3 min vopred na 129,575 MHz). Povinné SSR.',
        upper: 5000,
        lower: 0,
        class: 'G', // I když je to LZR, třída je G
        segments: [
            { type: 'line', points: [
                "483518N 0170755E",
                "483340N 0171552E",
                "482931N 0171355E"
            ]},
            { type: 'arc', 
             center: lzr1MalackyArp, 
             radius: 7, 
             start: "482931N 0171355E", 
             end: "482849N 0171500E", 
             cw: true 
            },
            { type: 'arc', 
             center: lzr1MalackyArp, 
             radius: 7, 
             start: "482849N 0171500E", 
             end: "481845N 0171343E", 
             cw: true 
            },
            { type: 'line', points: [
                "481845N 0171343E",
                "481808N 0170333E",
                "481833N 0170053E"
            ]},
            { type: 'arc', 
             center: lzr1MalackyArp, 
             radius: 7, 
             start: "481833N 0170053E", 
             end: "483109N 0170610E", 
             cw: true 
            },
            { type: 'line', points: [
                "483109N 0170610E",
                "483518N 0170755E"
            ]}
        ]
    };

    const ibSmaa01Definition = {
        name: "IB SMAA 01",
        color: '#ff9f43', // Oranžová pro SMA
        popup: '<strong>IB SMAA 01</strong><br>MNM ALT 2000 ft AMSL<br>(ID: LZSLZIB001)',
        upper: 2000, // Použijeme upper jako MNM
        lower: 2000, // Použijeme lower jako MNM
        class: 'SMA', // Speciální třída pro identifikaci
        segments: [
            { type: 'line', points: ["482028N 0172442E"] },
            { 
                type: 'arc', 
                center: arpLzib, 
                radius: 13, 
                start: "482028N 0172442E", 
                end: "475833N 0172121E", 
                cw: true // Předpokládáme CW
            },
            { type: 'line', points: ["475833N 0172121E"] },
            { type: 'border', start: "475833N 0172121E", end: "480152N 0170637E" },
            { type: 'line', points: [
                "480152N 0170637E",
                "480416N 0170603E",
                "482028N 0172442E"
            ]}
        ]
    };

    const ibSmaa02Definition = {
        name: "IB SMAA 02",
        color: '#ff9f43',
        popup: '<strong>IB SMAA 02</strong><br>MNM ALT 2500 ft AMSL<br>(ID: LZSLZIB002)',
        upper: 2500, lower: 2500, class: 'SMA',
        segments: [
            { type: 'line', points: [
                "482624N 0173035E",
                "482504N 0173405E",
                "481231N 0174540E",
                "480324N 0174421E",
                "475239N 0172847E"
            ]},
            { type: 'border', start: "475239N 0172847E", end: "475833N 0172121E" },
            { type: 'arc', 
             center: arpLzib, 
             radius: 13, 
             start: "475833N 0172121E", 
             end: "482028N 0172442E", 
             cw: false // Předpokládáme CCW (opačně než SMAA 01)
            },
            { type: 'line', points: [
                "482028N 0172442E",
                "480416N 0170603E",
                "480152N 0170637E"
            ]},
            { type: 'border', start: "480152N 0170637E", end: "480539N 0170525E" },
            { type: 'line', points: [
                "480539N 0170525E",
                "482624N 0173035E"
            ]}
        ]
    };

    const ibSmaa03Definition = {
        name: "IB SMAA 03",
        color: '#ff9f43',
        popup: '<strong>IB SMAA 03</strong><br>MNM ALT 3000 ft AMSL<br>(ID: LZSLZIB003)',
        upper: 3000, lower: 3000, class: 'SMA',
        segments: [
            { type: 'line', points: [
                "482504N 0173405E",
                "481755N 0175259E",
                "481502N 0175538E"
            ]},
            { type: 'arc', 
             center: lzp23Center, 
             radius: 4.1, 
             start: "481502N 0175538E", 
             end: "480655N 0175715E", 
             cw: false // *** OPRAVA: Změněno z true na false ***
            },
            { type: 'line', points: [
                "480655N 0175715E",
                "475602N 0175539E",
                "474617N 0174129E"
            ]},
            { type: 'border', start: "474617N 0174129E", end: "475239N 0172847E" },
            { type: 'line', points: [
                "475239N 0172847E",
                "480324N 0174421E",
                "481231N 0174540E",
                "482504N 0173405E"
            ]}
        ]
    };

    const ibSmaa04Definition = {
        name: "IB SMAA 04",
        color: '#ff9f43',
        popup: '<strong>IB SMAA 04</strong><br>MNM ALT 4000 ft AMSL<br>(ID: LZSLZIB004)',
        upper: 4000, lower: 4000, class: 'SMA',
        segments: [
            { type: 'line', points: [
                "481502N 0175538E",
                "481222N 0175804E",
                "480655N 0175715E"
            ]},
            { type: 'arc', 
             center: lzp23Center, 
             radius: 4.1, 
             start: "480655N 0175715E", 
             end: "481502N 0175538E", 
             cw: true // *** OPRAVA: Změněno z false na true ***
            }
        ]
    };
    
    const ibSmaa05Definition = {
        name: "IB SMAA 05",
        color: '#ff9f43',
        popup: '<strong>IB SMAA 05</strong><br>MNM ALT 5500 ft AMSL<br>(ID: LZSLZIB005)',
        upper: 5500, lower: 5500, class: 'SMA',
        segments: [
            { type: 'line', points: [
                "485128N 0174034E",
                "484817N 0174716E",
                "484225N 0175931E",
                "483712N 0180015E",
                "483517N 0180032E",
                "482452N 0180200E",
                "481725N 0180302E",
                "475116N 0180639E",
                "474524N 0180343E"
            ]},
            { type: 'border', start: "474524N 0180343E", end: "474617N 0174129E" },
            { type: 'line', points: [
                "474617N 0174129E",
                "475602N 0175539E",
                "480655N 0175715E",
                "481222N 0175804E",
                "481502N 0175538E",
                "481755N 0175259E",
                "482504N 0173405E",
                "482624N 0173035E",
                "482759N 0172622E",
                "483241N 0172548E",
                "483649N 0172519E",
                "484442N 0173203E",
                "484932N 0172452E"
            ]},
            { type: 'border', start: "484932N 0172452E", end: "485128N 0174034E" }
        ]
    };

    const ibSmaa06Definition = {
        name: "IB SMAA 06",
        color: '#ff9f43',
        popup: '<strong>IB SMAA 06</strong><br>MNM ALT 5000 ft AMSL<br>(ID: LZSLZIB006)',
        upper: 5000, lower: 5000, class: 'SMA',
        segments: [
            { type: 'line', points: [
                "484932N 0172452E",
                "484442N 0173203E",
                "483649N 0172519E",
                "483241N 0172548E",
                "482759N 0172622E",
                "481859N 0171741E",
                "481845N 0171343E",
                "481808N 0170333E",
                "481833N 0170053E",
                "481933N 0165432E"
            ]},
            { type: 'border', start: "481933N 0165432E", end: "484932N 0172452E" }
        ]
    };

    const ibSmaa07Definition = {
        name: "IB SMAA 07",
        color: '#ff9f43',
        popup: '<strong>IB SMAA 07</strong><br>MNM ALT 3500 ft AMSL<br>(ID: LZSLZIB007)',
        upper: 3500, lower: 3500, class: 'SMA',
        segments: [
            { type: 'line', points: [
                "482759N 0172622E",
                "482624N 0173035E",
                "480539N 0170525E"
            ]},
            { type: 'border', start: "480539N 0170525E", end: "481933N 0165432E" },
            { type: 'line', points: [
                "481933N 0165432E",
                "481833N 0170053E",
                "481808N 0170333E",
                "481845N 0171343E",
                "481859N 0171741E",
                "482759N 0172622E"
            ]}
        ]
    };


    buildAndAddPolygon(ma1Definition);
    buildAndAddPolygon(ctrDefinition);
    buildAndAddPolygon(tma4Definition);
    buildAndAddPolygon(tma3Definition);
    buildAndAddPolygon(tma2Definition);
    buildAndAddPolygon(tma1PiestanyDefinition);
    buildAndAddPolygon(tma2PiestanyDefinition);
    buildAndAddPolygon(ctrPiestanyDefinition);
    buildAndAddPolygon(lesmoDefinition);
    buildAndAddPolygon(lzr1Definition);
    buildAndAddPolygon(lzr2Definition);
    buildAndAddPolygon(lzr31aDefinition);
    buildAndAddPolygon(lzr31bDefinition);
    buildAndAddPolygon(lzr31cDefinition);
    buildAndAddPolygon(lzr31dDefinition);
    buildAndAddPolygon(lzr31eDefinition);
    buildAndAddPolygon(lzr40Definition);
    buildAndAddPolygon(lzr222Definition);
    buildAndAddPolygon(lzr223Definition);
    buildAndAddPolygon(lzr314Definition);
    buildAndAddPolygon(ibSmaa01Definition);
    buildAndAddPolygon(ibSmaa02Definition);
    buildAndAddPolygon(ibSmaa03Definition);
    buildAndAddPolygon(ibSmaa04Definition);
    buildAndAddPolygon(ibSmaa05Definition); // Přidáno
    buildAndAddPolygon(ibSmaa06Definition); // Přidáno
    buildAndAddPolygon(ibSmaa07Definition); // Přidáno

    // 3. Kruhové oblasti
    // Nyní používáme data.circularZones, která obsahují všechny kruhové zóny
    data.circularZones.forEach(zoneData => { // OPRAVA: Přejmenováno na zoneData
        const center = parseDmsCoords(zoneData.center);
        if (center) {
            const circle = L.circle(center, {
                radius: zoneData.radius_km * 1000,
                color: zoneData.color, fillColor: zoneData.color, fillOpacity: 0.3, weight: 2
            });
            circle.airspaceInfo = { name: zoneData.name, upper: zoneData.upper, lower: zoneData.lower, class: zoneData.class, type: zoneData.type, color: zoneData.color };
            circle.on('dblclick', (e) => {
                L.popup().setLatLng(e.latlng).setContent(zoneData.popup).openOn(map);
                L.DomEvent.stopPropagation(e);
            });
            if (!layers[zoneData.name]) layers[zoneData.name] = L.layerGroup();
            layers[zoneData.name].addLayer(circle);
            allIndividualLayers.push(circle);
        }
    });

    // 4. Hraniční linie
    const lalesLatitude = 48.8653;
    layers["Hraniční linie"] = L.layerGroup();
    borderLineSegments.forEach(segment => {
        let currentFilteredSegment = [];
        for (const point of segment) {
            const isProtected = protectedPointStrings.has(point.join(','));
            const longitudeOk = point[1] <= alamuLongitude;
            if (longitudeOk && (point[0] <= lalesLatitude || isProtected)) {
                currentFilteredSegment.push(point);
            } else {
                if (currentFilteredSegment.length > 1) {
                    const polyline = L.polyline(currentFilteredSegment, { color: '#ff7800', weight: 3, opacity: 0.9 });
                    layers["Hraniční linie"].addLayer(polyline);
                    allIndividualLayers.push(polyline);
                }
                currentFilteredSegment = [];
            }
        }
        if (currentFilteredSegment.length > 1) {
            const polyline = L.polyline(currentFilteredSegment, { color: '#ff7800', weight: 3, opacity: 0.9 });
            layers["Hraniční linie"].addLayer(polyline);
            allIndividualLayers.push(polyline);
        }
    });
    
    // 5. Vstupní body
    data.points.forEach(point => { // OPRAVA: Použito data.
        const layerName = `Body ${point.group === 'lesmo' ? 'LESMO area' : point.group.toUpperCase()}`;
        if (!layers[layerName]) {
            layers[layerName] = L.layerGroup();
        }
        const marker = L.circleMarker(point.coords, {
            radius: 6, color: '#ffffff', weight: 1.5,
            fillColor: data.groupColors[point.group] || '#cccccc', fillOpacity: 0.9 // OPRAVA: Použito data.
        }).bindPopup(`<strong>${point.label}</strong>`).bindTooltip(point.label, {
            permanent: true, direction: 'right', className: 'point-label', offset: [10, 0]
        });
        layers[layerName].addLayer(marker);
        allIndividualLayers.push(marker);
    });

    // 6. Nastavení viditelnosti vrstev
    const defaultDisabled = [
        'LZR31A', 'LZR31B', 'LZR31C', 'LZR31D', 'LZR31E', 'LZR40'
    ];
    
    Object.keys(layers).forEach(layerName => {
        if (defaultDisabled.includes(layerName)) {
            // map.removeLayer(layers[layerName]); // Necháme je přidané, jen je skryjeme
        } else {
            layers[layerName].addTo(map);
        }
    });

    document.querySelectorAll('.legend-item').forEach(item => {
        const layerName = item.dataset.layerName;
        if (defaultDisabled.includes(layerName)) {
            item.classList.add('disabled');
            if (layers[layerName]) {
                 map.removeLayer(layers[layerName]);
            }
        }
        
        item.addEventListener('click', (e) => {
            if (layers[layerName]) {
                if (map.hasLayer(layers[layerName])) {
                    map.removeLayer(layers[layerName]);
                    e.currentTarget.classList.add('disabled');
                } else {
                    map.addLayer(layers[layerName]);
                    e.currentTarget.classList.remove('disabled');
                }
            }
        });
    });

    // 7. Rozbalovací legenda
    document.querySelectorAll('.legend-group-header').forEach(header => {
        header.addEventListener('click', () => {
            header.classList.toggle('open');
            const items = header.nextElementSibling;
            if (items.style.display === "block") {
                items.style.display = "none";
            } else {
                items.style.display = "block";
            }
        });
    });

    // 8. Přiblížení mapy
    const featureGroupForBounds = L.featureGroup(allIndividualLayers.filter(l => l.getBounds));
    if (featureGroupForBounds.getLayers().length > 0) {
        map.fitBounds(featureGroupForBounds.getBounds().pad(0.1));
    }
    

    map.on('click', function(e) {
        if (!crosshairMarker) {
            const crosshairIcon = L.divIcon({
                className: 'crosshair-icon',
                html: '<div style="font-size: 24px; color: #ff0000; text-shadow: 0 0 3px #fff;">+</div>',
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });
            crosshairMarker = L.marker(e.latlng, { icon: crosshairIcon, interactive: false, zIndexOffset: 2000 }).addTo(map);
        } else {
            crosshairMarker.setLatLng(e.latlng);
            if (!map.hasLayer(crosshairMarker)) crosshairMarker.addTo(map);
        }

        coordsDisplay.innerHTML = `${toDMS(e.latlng.lat, false)} ${toDMS(e.latlng.lng, true)}`;
        coordsDisplay.style.display = 'block';

        const uniqueProfiles = new Map();
        const centerPoint = e.latlng;
        const samplePoints = [
            { pos: 'left', latlng: L.latLng(centerPoint.lat, centerPoint.lng - 0.02) },
            { pos: 'center', latlng: centerPoint },
            { pos: 'right', latlng: L.latLng(centerPoint.lat, centerPoint.lng + 0.02) }
        ];

        samplePoints.forEach(sample => {
            let airspacesAtPoint = [];
            allIndividualLayers.forEach(layer => {
                 const layerName = Object.keys(layers).find(key => layers[key].hasLayer(layer));
                 if (!layerName) return;
                 const legendItem = document.querySelector(`.legend-item[data-layer-name="${layerName}"]`);
                 const isLayerVisible = legendItem && !legendItem.classList.contains('disabled');
                 
                 // Musíme zkontrolovat, jestli 'layer' má metodu 'getLatLngs' nebo 'getLatLng'
                 let layerGeometry = null;
                 if (layer.getLatLngs) layerGeometry = layer;
                 else if (layer.getLatLng) layerGeometry = layer; // Pro kruhy
                 
                 if (layerGeometry && isLayerVisible && layer.airspaceInfo && isMarkerInside(sample.latlng, layerGeometry)) {
                     airspacesAtPoint.push(layer.airspaceInfo);
                 }
            });
            const key = airspacesAtPoint.map(a => a.name).sort().join(',');
            if (!uniqueProfiles.has(key)) {
                uniqueProfiles.set(key, { airspaces: airspacesAtPoint, pos: sample.pos });
            }
        });

        let profileOrder = Array.from(uniqueProfiles.values()).sort((a,b) => {
            const posOrder = { 'left': 1, 'center': 2, 'right': 3 };
            return posOrder[a.pos] - posOrder[b.pos];
        });

        const centerProfileCandidate = profileOrder.find(p => p.pos === 'center');
        const centerKey = centerProfileCandidate ? centerProfileCandidate.airspaces.map(a => a.name).sort().join(',') : null;
        
        const numProfiles = profileOrder.length;
        profileView.style.width = `${65 + numProfiles * 100}px`;
        
        profileScaleContainer.innerHTML = '';
        profileAirspacesContainer.innerHTML = '';
        const profileHeight = profileAirspacesContainer.clientHeight;

        const scaleLevels = [0, 1500, 2000, 2500, 3000, 4000, 5000, 8000, 10000, 12500, 20000, 30000, 40000, 50000, 60000, 66000];
        scaleLevels.forEach(ft => {
            const yPosFromBottom = altitudeToPixel(ft, profileHeight);
            const tick = document.createElement('div');
            tick.className = 'scale-tick';
            tick.style.bottom = `${yPosFromBottom}px`;
            const label = document.createElement('span');
            label.innerHTML = ft >= 10000 ? `FL${Math.round(ft/100)}` : `${ft}'`;
            tick.appendChild(label);
            profileScaleContainer.appendChild(tick);
        });
        
        profileOrder.forEach(profile => {
            const airspaceSet = profile.airspaces;
            const column = document.createElement('div');
            column.className = 'profile-column';
            if(airspaceSet.map(a => a.name).sort().join(',') === centerKey) {
                column.classList.add('center-column');
            }

            // --- Nová logika pro SMA ---
            const smaLines = airspaceSet.filter(a => a.class === 'SMA');
            smaLines.forEach(sma => {
                const yPosFromBottom = altitudeToPixel(sma.lower, profileHeight);
                const line = document.createElement('div');
                line.className = 'profile-sma-line';
                line.style.bottom = `${yPosFromBottom}px`;
                
                const label = document.createElement('span');
                label.textContent = `${sma.name} ${sma.lower}'`;
                line.appendChild(label);
                
                column.appendChild(line);
            });
            // --- Konec logiky pro SMA ---

            let allProfileAirspaces = [...airspaceSet.filter(a => a.class !== 'SMA')]; // Odfiltrujeme SMA
            allProfileAirspaces.push({ name: 'Prostor G', lower: 0, upper: 8000, class: 'G', color: '#7f8c8d' });
            
            const finalBlocks = [];
            const boundaries = [...new Set(allProfileAirspaces.flatMap(s => [s.lower, s.upper]))].sort((a,b) => a - b);

            for (let i = 0; i < boundaries.length - 1; i++) {
                const slabLower = boundaries[i];
                const slabUpper = boundaries[i+1];
                if(slabLower >= slabUpper) continue;
                const midPoint = (slabLower + slabUpper) / 2;

                const candidates = allProfileAirspaces.filter(s => midPoint >= s.lower && midPoint < s.upper);
                if (candidates.length > 0) {
                    const winner = candidates.reduce((prev, curr) => {
                        // Použijeme specifické jméno nebo obecnou třídu pro prioritu
                        let prevPriority = classPriority[prev.name] || classPriority[prev.type] || classPriority[prev.class] || 0;
                        let currPriority = classPriority[curr.name] || classPriority[curr.type] || classPriority[curr.class] || 0;
                        
                        // Speciální pravidlo pro TMA 4 (TMA4 je class)
                        if (prev.class === 'TMA4') prevPriority = classPriority['TMA4'];
                        if (curr.class === 'TMA4') currPriority = classPriority['TMA4'];

                        return currPriority > prevPriority ? curr : prev;
                    });
                    
                    const lastBlock = finalBlocks[finalBlocks.length - 1];
                    if (lastBlock && lastBlock.name === winner.name && lastBlock.upper === slabLower && lastBlock.class === winner.class) {
                        lastBlock.upper = slabUpper;
                    } else {
                        finalBlocks.push({ ...winner, lower: slabLower, upper: slabUpper });
                    }
                }
            }

            finalBlocks.forEach(space => {
                const bottomY = altitudeToPixel(space.lower, profileHeight);
                const topY = altitudeToPixel(space.upper, profileHeight);
                const height = topY - bottomY;

                if (height > 0) {
                    const block = document.createElement('div');
                    block.className = 'airspace-block';
                    block.style.bottom = `${bottomY}px`;
                    block.style.height = `${height}px`;
                    block.style.backgroundColor = `${space.color}80`;
                    block.style.borderColor = space.color;
                    
                    const nameSpan = document.createElement('span');
                    nameSpan.textContent = space.name;
                    block.appendChild(nameSpan);

                    const classSpan = document.createElement('span');
                    // Použijeme 'TMA4' class pro zobrazení
                    const displayClass = space.class === 'TMA4' ? 'C' : space.class;
                    classSpan.textContent = `Třída ${displayClass}`;
                    
                    const altSpan = document.createElement('span');
                    const upperText = space.upper >= 10000 ? `FL${Math.round(space.upper/100)}` : `${space.upper}'`;
                    // Upraveno pro 1000 ft AGL u LZR40
                    const lowerText = (space.name === 'LZR40' && space.lower === 1000) ? '1000ft AGL' : 
                                      (space.lower === 0 ? 'GND' : (space.lower >= 10000 ? `FL${Math.round(space.lower/100)}` : `${space.lower}'`));
                    altSpan.textContent = `${upperText} / ${lowerText}`;
                    
                    if (height > 45) {
                       block.appendChild(altSpan);
                       block.appendChild(classSpan);
                    } else if (height > 20) {
                       block.appendChild(classSpan);
                    }
                    
                    column.appendChild(block);
                }
            });
            profileAirspacesContainer.appendChild(column);
        });

        profileView.style.display = 'flex';
    });
    

} // Konec funkce initializeMap
// -----------------------------------------------------------------
// KONEC PŮVODNÍHO KÓDU MAPY
// -----------------------------------------------------------------

// Spustí načítání dat (DOM je připravený díky atributu 'defer' v HTML)
loadDataAndInitializeMap();