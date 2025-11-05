// ==================================================================
// HLAVNÍ SKRIPT PRO MAPOVOU APLIKACI
// Načítá se jako poslední, po data.js a rnav_data.js
// ==================================================================

// Globální proměnné pro mapu a vrstvy
let map;
const layers = {};
const allIndividualLayers = [];
const protectedPointStrings = new Set(); // Body hranic, které jsou součástí jiných polygonů

// Počkáme, až se načte celé HTML, pak spustíme inicializaci
document.addEventListener('DOMContentLoaded', () => {
    // Zkontrolujeme, zda jsou načtena data (definovaná v data.js)
    if (typeof coordinatesData !== 'undefined') {
        initializeMap();
    } else {
        console.error("Data (data.js) nebyla načtena!");
        // Zobrazíme chybovou hlášku v loaderu
        const loader = document.getElementById('loader');
        if(loader) {
            loader.innerHTML = '<p style="color: #e74c3c;">Chyba: Nepodařilo se načíst data mapy.</p>';
        }
    }
});


/**
 * Inicializuje celou mapu, vrstvy a ovládací prvky.
 * Spustí se až po načtení HTML a dat.
 */
function initializeMap() {
    // --- 1. Inicializace mapy ---
    map = L.map('map').setView([48.8, 17.5], 8);
    map.doubleClickZoom.disable(); // Vypnutí zoomu na dvojklik

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd', maxZoom: 20
    }).addTo(map);

    // --- 2. Pomocné funkce pro parsování ---
    const getDistance = (p1, p2) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
    const alamuLongitude = 18.33;

    /**
     * Parsování souřadnic ve formátu '483712N 0180015E'
     */
    function parseDmsCoords(coordString) {
        if (!coordString) return null;
        coordString = coordString.replace(/N$/, '').replace(/E$/, '').trim();
        const parts = coordString.trim().split(/\s+/);
        if (parts.length < 2) return null;
        let latStr = parts[0];
        let lngStr = parts[1];

        const parseDMS = (dms, isLng) => {
            const degLen = isLng ? 3 : 2;
            dms = dms.replace(/[^0-9]/g, ''); 
            
            let degrees, minutes, seconds;

            if (dms.length >= 6) { // 482028 / 0172442
                degrees = parseInt(dms.substring(0, degLen), 10);
                minutes = parseInt(dms.substring(degLen, degLen + 2), 10);
                seconds = parseInt(dms.substring(degLen + 2, degLen + 4), 10);
            } else if (dms.length >= 4) { // 4820 / 01724
                degrees = parseInt(dms.substring(0, degLen), 10);
                minutes = parseInt(dms.substring(degLen, degLen + 2), 10);
                seconds = 0;
            } else {
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

    /**
     * NOVÝ PARSER
     * Parsování souřadnic ve formátu '48°37'03,25"N 017°32'28,20"E'
     */
    function parseDmsWithSymbols(coordString) {
      try {
        const parts = coordString.split(' ');
        if (parts.length < 2) return null;
    
        const parsePart = (partStr) => {
          partStr = partStr.replace(',', '.'); // Nahradí desetinnou čárku za tečku
          // Regulární výraz pro zachycení stupňů, minut a sekund (včetně desetinných)
          const dms = partStr.match(/(\d+)\°(\d+)'(\d+\.?\d*)"/);
          if (!dms) return null;
    
          const deg = parseFloat(dms[1]);
          const min = parseFloat(dms[2]);
          const sec = parseFloat(dms[3]);
          let decimal = deg + (min / 60) + (sec / 3600);
    
          // Zkontroluje S nebo W a případně obrátí znaménko
          if (partStr.includes('S') || partStr.includes('W')) {
            decimal *= -1;
          }
          return decimal;
        };
    
        const lat = parsePart(parts[0]); // Zeměpisná šířka
        const lng = parsePart(parts[1]); // Zeměpisná délka
    
        if (lat === null || lng === null) {
            console.error('Chyba při parsování DMS (symboly):', coordString);
            return null;
        }
        return [lat, lng];
      } catch (e) {
        console.error('Chyba ve funkci parseDmsWithSymbols:', e, coordString);
        return null;
      }
    }


    function processBorderData(coordinatesData) {
        let borderCoords = coordinatesData.trim().split('\n').filter(line => line.trim() !== '').map(line => {
            const [lng, lat] = line.split(',');
            return [parseFloat(lat), parseFloat(lng)];
        });
        
        // Zde je implementace třídění bodů hranice, jak byla původně
        if (borderCoords.length > 0) {
            let tempCoords = [...borderCoords];
            while(tempCoords.length > 0) {
                let segment = [tempCoords.shift()];
                let lastPoint = segment[0];
                let changed = true;
                while(changed) {
                    changed = false;
                    let nearestIdx = -1;
                    let minDistance = 0.5; // Prahová vzdálenost pro spojení
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
    
    // Globální proměnná pro segmenty hranic
    const borderLineSegments = [];
    let fullBorderPoints = [];
    // Okamžité zpracování dat hranic
    processBorderData(coordinatesData); 


    function calculateArcPoints(center, radiusNM, startPoint, endPoint, clockwise = false) {
        if (!center || !startPoint || !endPoint) return [];
        // Převod NM na stupně (přibližně)
        const radiusDeg = radiusNM * 1.852 / 111.32;
        const centerLat = center[0], centerLng = center[1];
        const startLat = startPoint[0], startLng = startPoint[1];
        const endLat = endPoint[0], endLng = endPoint[1];

        let startAngle = Math.atan2(startLat - centerLat, startLng - centerLng);
        let endAngle = Math.atan2(endLat - centerLat, endLng - centerLng);
        
        if (clockwise) { if (endAngle > startAngle) endAngle -= 2 * Math.PI; } 
        else { if (endAngle < startAngle) endAngle += 2 * Math.PI; }

        const points = [], numPoints = 30; // Počet bodů pro vykreslení oblouku
        const angleStep = (endAngle - startAngle) / numPoints;

        for (let i = 0; i <= numPoints; i++) {
            const angle = startAngle + i * angleStep;
            const lat = centerLat + radiusDeg * Math.sin(angle);
            // Korekce pro zeměpisnou délku
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
                // Použijeme globální ARPs
                const centerPoint = (typeof segment.center === 'string') 
                    ? parseDmsCoords(segment.center) 
                    : segment.center; // Předpokládáme [lat, lng] pole
                
                if (startPoint && endPoint && centerPoint) {
                    segmentCoords = calculateArcPoints(centerPoint, segment.radius, startPoint, endPoint, segment.cw);
                } else {
                    console.error("Chyba při vytváření oblouku pro:", definition.name, {startPoint, endPoint, centerPoint});
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
                        if (minStartDist < 0.2 && minEndDist < 0.2 && closestStartIndex !== closestEndIndex) {
                            const sliceStart = Math.min(closestStartIndex, closestEndIndex);
                            const sliceEnd = Math.max(closestStartIndex, closestEndIndex) + 1;
                            segmentCoords = seg.slice(sliceStart, sliceEnd);
                            
                            // Zjistíme, zda musíme segment otočit
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
                        console.error("Nelze najít segment hranice pro", definition.name, segment.start, "do", segment.end, ". Používám přímou čáru.");
                        segmentCoords = [startPoint, endPoint];
                    }
                }
            }

            // Odstranění duplicitních bodů mezi segmenty
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
            const isSMA = definition.class === 'SMA';
            
            const polyOptions = {
                color: definition.color,
                fillColor: definition.color,
                weight: 2,
                fillOpacity: isSMA ? 0.0 : 0.3, 
                dashArray: isSMA ? '5, 5' : null, 
                interactive: !isSMA 
            };

            const polygon = L.polygon(finalCoords, polyOptions);
            
            polygon.airspaceInfo = {
                name: definition.name,
                upper: definition.upper,
                lower: definition.lower,
                class: definition.class,
                color: definition.color
            };

            if (!isSMA) {
                polygon.on('dblclick', (e) => {
                    L.popup().setLatLng(e.latlng).setContent(definition.popup).openOn(map);
                    L.DomEvent.stopPropagation(e); 
                });
            }

            if (!layers[definition.name]) {
                layers[definition.name] = L.layerGroup();
            }
            layers[definition.name].addLayer(polygon);
            allIndividualLayers.push(polygon);

            if (isSMA) {
                let centerLabel = polygon.getBounds().getCenter();
                const labelText = `${definition.lower}'`;

                if (definition.name === "IB SMAA 02") {
                    centerLabel.lng += 0.08; 
                }
                
                const labelMarker = L.marker(centerLabel, {
                     icon: L.divIcon({
                         className: 'sma-label',
                         html: labelText
                     }),
                     interactive: false 
                 });
                layers[definition.name].addLayer(labelMarker);
            }
        }
    }


    // --- 3. Načtení a vytvoření všech vrstev ---
    
    // Načtení globálních proměnných z data.js
    const lzr1MalackyArp = parseDmsCoords(lzr1MalackyArpString);
    const arpLzppNew = parseDmsCoords(arpLzppNewString);
    const lzp23Center = parseDmsCoords(lzp23CenterString);

    // Definice prostorů (používají před-načtená data)
    // Definice jsou nyní v data.js (např. ma1Definition, ctrDefinition...)
    
    // Vytvoření polygonů
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
    
    // Kluzáky
    buildAndAddPolygon(boleraz1Definition);
    buildAndAddPolygon(boleraz2Definition);
    buildAndAddPolygon(inovec1Definition);
    buildAndAddPolygon(inovec2Definition);
    buildAndAddPolygon(javorinaDefinition);
    
    // Vojenské (12.8.)
    buildAndAddPolygon(zuzanaDefinition);
    buildAndAddPolygon(lztsa16Definition);
    buildAndAddPolygon(lztra3Definition);
    buildAndAddPolygon(lztra4aDefinition);

    // SMA
    buildAndAddPolygon(ibSmaa01Definition);
    buildAndAddPolygon(ibSmaa02Definition);
    buildAndAddPolygon(ibSmaa03Definition);
    buildAndAddPolygon(ibSmaa04Definition);
    buildAndAddPolygon(ibSmaa05Definition);
    buildAndAddPolygon(ibSmaa06Definition);
    buildAndAddPolygon(ibSmaa07Definition);

    // 4. Kruhové oblasti
    circularZones.forEach(data => {
        const center = parseDmsCoords(data.center);
        if (center) {
            const circle = L.circle(center, {
                radius: data.radius_km * 1000,
                color: data.color, fillColor: data.color, fillOpacity: 0.3, weight: 2
            });
            circle.airspaceInfo = { name: data.name, upper: data.upper, lower: data.lower, class: data.class, type: data.type, color: data.color };
            circle.on('dblclick', (e) => {
                L.popup().setLatLng(e.latlng).setContent(data.popup).openOn(map);
                L.DomEvent.stopPropagation(e);
            });
            if (!layers[data.name]) layers[data.name] = L.layerGroup();
            layers[data.name].addLayer(circle);
            allIndividualLayers.push(circle);
        }
    });

    // 5. Hraniční linie
    layers["Hraniční linie"] = L.layerGroup();
    borderLineSegments.forEach(segment => {
        let currentFilteredSegment = [];
        for (const point of segment) {
            const isProtected = protectedPointStrings.has(point.join(','));
            const longitudeOk = point[1] <= alamuLongitude;
            if (longitudeOk && (point[0] <= 48.8653 || isProtected)) { // lalesLatitude = 48.8653
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
    points.forEach(point => { 
        const layerName = `Body ${point.group === 'lesmo' ? 'LESMO area' : point.group.toUpperCase()}`;
        if (!layers[layerName]) {
            layers[layerName] = L.layerGroup();
        }
        const marker = L.circleMarker(point.coords, {
            radius: 6, color: '#ffffff', weight: 1.5,
            fillColor: groupColors[point.group] || '#cccccc', fillOpacity: 0.9
        }).bindPopup(`<strong>${point.label}</strong>`).bindTooltip(point.label, {
            permanent: true, direction: 'right', className: 'point-label', offset: [10, 0]
        });
        layers[layerName].addLayer(marker);
        allIndividualLayers.push(marker);
    });

    // 5b. Zpracování RNAV tratí a bodů (NOVÁ SEKCE)
    // Data (rnavStars) jsou načtena z rnav_data.js
    if (typeof rnavStars !== 'undefined') {
      rnavStars.forEach(star => {
        const bodyLayerName = `${star.name} Body`;
        const trackLayerName = `${star.name} Trať`;
        layers[bodyLayerName] = L.layerGroup();
        layers[trackLayerName] = L.layerGroup();
        
        const starTrackPoints = [];

        star.waypoints.forEach(wp => {
          const coords = parseDmsWithSymbols(wp.coordsDMS);
          if (coords) {
            starTrackPoints.push(coords);

            // Vytvoření bodu (markeru)
            const marker = L.circleMarker(coords, {
                radius: 5,
                color: '#FFFFFF', // Bílý okraj
                weight: 1,
                fillColor: star.color, // Barva ze definice (azurová)
                fillOpacity: 0.9
            }).bindPopup(`<strong>${wp.name}</strong><br>${wp.coordsDMS}`)
              .bindTooltip(wp.name, {
                permanent: true, 
                direction: 'auto', 
                className: 'point-label', // Použijeme existující styl
                offset: [10, 0]
            });
            
            layers[bodyLayerName].addLayer(marker);
            allIndividualLayers.push(marker);
          }
        });

        // Vytvoření tratě (polyline)
        if (starTrackPoints.length > 1) {
          const polyline = L.polyline(starTrackPoints, {
            color: star.color,
            weight: 3,
            opacity: 0.7,
            dashArray: '10, 5' // Čárkovaná čára pro trať
          });
          layers[trackLayerName].addLayer(polyline);
          allIndividualLayers.push(polyline);
        }
      });
    }


    // 6. Nastavení viditelnosti vrstev
    // (defaultDisabled je nyní v data.js a rnav_data.js)
    Object.keys(layers).forEach(layerName => {
        if (!defaultDisabled.includes(layerName)) {
            layers[layerName].addTo(map);
        }
    });

    // 7. Interaktivita legendy
    document.querySelectorAll('.legend-item').forEach(item => {
        const layerName = item.dataset.layerName;
        if (layers[layerName]) {
            item.addEventListener('click', (e) => {
                if (map.hasLayer(layers[layerName])) {
                    map.removeLayer(layers[layerName]);
                    e.currentTarget.classList.add('disabled');
                } else {
                    map.addLayer(layers[layerName]);
                    e.currentTarget.classList.remove('disabled');
                }
            });
        }
    });

    // 8. Rozbalovací legenda
    document.querySelectorAll('.legend-group-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // Zkontrolujeme, zda kliknutí bylo na hlavičku pro přepínání skupiny (např. SMA)
            const groupToggle = e.currentTarget.dataset.toggleGroup;
            if (groupToggle) {
                // Logika pro hromadné přepínání
                const itemsInGroup = header.nextElementSibling.querySelectorAll('.legend-item');
                // Zjistíme, zda je většina vrstev zapnutá nebo vypnutá
                let enabledCount = 0;
                itemsInGroup.forEach(item => {
                    if (!item.classList.contains('disabled')) {
                        enabledCount++;
                    }
                });
                
                const shouldEnable = enabledCount < (itemsInGroup.length / 2); // Pokud je méně než polovina zapnutá, zapneme všechny
                
                itemsInGroup.forEach(item => {
                    const layerName = item.dataset.layerName;
                    if (layers[layerName]) {
                        if (shouldEnable) {
                            map.addLayer(layers[layerName]);
                            item.classList.remove('disabled');
                        } else {
                            map.removeLayer(layers[layerName]);
                            item.classList.add('disabled');
                        }
                    }
                });
                
            } else {
                // Standardní logika pro rozbalení/sbalení
                header.classList.toggle('open');
                const items = header.nextElementSibling;
                if (items.style.display === "block") {
                    items.style.display = "none";
                } else {
                    items.style.display = "block";
                }
            }
        });
    });


    // 9. Přiblížení mapy na všechny vrstvy
    const featureGroupForBounds = L.featureGroup(allIndividualLayers.filter(l => l.getBounds));
    if (featureGroupForBounds.getLayers().length > 0) {
        map.fitBounds(featureGroupForBounds.getBounds().pad(0.1));
    }
    
    // 10. Skrytí loaderu
    const loader = document.getElementById('loader');
    if(loader) {
        loader.style.display = 'none';
    }

    // --- 11. Nová funkcionalita pro vertikální profil ---
    let crosshairMarker = null;
    const profileView = document.getElementById('profile-view');
    const profileScaleContainer = document.getElementById('profile-scale-container');
    const profileAirspacesContainer = document.getElementById('profile-airspaces-container');
    const coordsDisplay = document.getElementById('coords-display');
    
    document.querySelector('.profile-close').addEventListener('click', () => {
        profileView.style.display = 'none';
        if (crosshairMarker) {
            map.removeLayer(crosshairMarker);
            crosshairMarker = null;
        }
        coordsDisplay.style.display = 'none';
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
             
             if (Array.isArray(latLngs[0]) && latLngs[0].length > 0 && latLngs[0][0] instanceof L.LatLng) {
                 const outer = latLngs[0];
                 if (!isPointInPoly(latlng, outer)) return false;
                 
                 for (let i = 1; i < latLngs.length; i++) {
                     if (isPointInPoly(latlng, latLngs[i])) return false; 
                 }
                 return true; 
             }
             else if (latLngs.length > 0 && latLngs[0] instanceof L.LatLng) {
                 return isPointInPoly(latlng, latLngs);
             }
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
        // Vzorkovací body pro profil (levý, střed, pravý)
        const samplePoints = [
            { pos: 'left', latlng: L.latLng(centerPoint.lat, centerPoint.lng - 0.02) },
            { pos: 'center', latlng: centerPoint },
            { pos: 'right', latlng: L.latLng(centerPoint.lat, centerPoint.lng + 0.02) }
        ];

        samplePoints.forEach(sample => {
            let airspacesAtPoint = [];
            allIndividualLayers.forEach(layer => {
                  // Zjistíme, zda je vrstva viditelná (v legendě)
                  const layerName = Object.keys(layers).find(key => layers[key].hasLayer(layer));
                  if (!layerName) return;
                  const legendItem = document.querySelector(`.legend-item[data-layer-name="${layerName}"]`);
                  const isLayerVisible = legendItem && !legendItem.classList.contains('disabled');
                  
                  let layerGeometry = null;
                  if (layer.getLatLngs) layerGeometry = layer;
                  else if (layer.getLatLng) layerGeometry = layer; 
                  
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

            let allProfileAirspaces = [...airspaceSet.filter(a => a.class !== 'SMA')]; 
            allProfileAirspaces.push({ name: 'Prostor G', lower: 0, upper: 8000, class: 'G', color: '#7f8c8d' });
            
            const finalBlocks = [];
            // Vytvoříme unikátní hranice
            const boundaries = [...new Set(allProfileAirspaces.flatMap(s => [s.lower, s.upper]))].sort((a,b) => a - b);

            for (let i = 0; i < boundaries.length - 1; i++) {
                const slabLower = boundaries[i];
                const slabUpper = boundaries[i+1];
                if(slabLower >= slabUpper) continue;
                const midPoint = (slabLower + slabUpper) / 2;

                const candidates = allProfileAirspaces.filter(s => midPoint >= s.lower && midPoint < s.upper);
                if (candidates.length > 0) {
                    const winner = candidates.reduce((prev, curr) => {
                        // Použijeme globální 'classPriority'
                        let prevPriority = classPriority[prev.name] || classPriority[prev.type] || classPriority[prev.class] || 0;
                        let currPriority = classPriority[curr.name] || classPriority[curr.type] || classPriority[curr.class] || 0;
                        
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
                    const displayClass = space.class === 'TMA4' ? 'C' : space.class;
                    classSpan.textContent = `Třída ${displayClass}`;
                    
                    const altSpan = document.createElement('span');
                    const upperText = space.upper >= 10000 ? `FL${Math.round(space.upper/100)}` : `${space.upper}'`;
                    
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

} // --- Konec initializeMap ---
