// Globální proměnné pro mapu a vrstvy
let map;
const layers = {};
const allIndividualLayers = []; // Pro sledování všech jednotlivých vrstev (pro vertikální profil)
const protectedPointStrings = new Set(); // Ochrana bodů hranice, které jsou součástí polygonů
let fullBorderPoints = []; // Všechny body hranice
let borderLineSegments = []; // Segmenty hranice

// Pomocné funkce
const getDistance = (p1, p2) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));

// Hlavní spouštěcí funkce po načtení DOM
document.addEventListener('DOMContentLoaded', () => {
    // Inicializace mapy (stále zde, ale teď čeká na `defer` skripty)
    map = L.map('map', {
        zoomControl: true, // Ponecháme ovládání zoomu
        doubleClickZoom: false // Dvojklik bude dělat něco jiného
    }).setView([48.5, 17.5], 9);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20
    }).addTo(map);

    // Všechny data a logika mapy jsou nyní závislé na `staticDataStore`
    initializeMap(staticDataStore);

    // Skrytí loaderu po inicializaci
    document.getElementById('loader').style.display = 'none';
});


/**
 * Inicializuje všechny vrstvy mapy na základě poskytnutých dat.
 * @param {object} data - Objekt obsahující všechna data (dříve načteno z Google Sheets)
 */
function initializeMap(data) {
    if (!data) {
        console.error("Data mapy (staticDataStore) nebyla nalezena!");
        return;
    }

    // 1. Zpracování dat hranic
    processBorderData(data.coordinatesData || "");
    
    // 2. Definice globálních ARP bodů (potřebné pro oblouky)
    // Tyto proměnné musí být definovány předtím, než se použijí v definicích prostorů
    const arpLzib = data.arpLzib;
    const lzr1MalackyArp = parseDmsCoords(data.lzr1MalackyArpString);
    const arpLzppNew = parseDmsCoords(data.arpLzppNewString);
    const lzp23Center = parseDmsCoords(data.lzp23CenterString);

    // 3. Zpracování polygonů (TMA, CTR, LZR, ...)
    (data.polygonDefinitions || []).forEach(def => {
        // Přidáme ARP data do definice, pokud je potřebuje
        if (def.name === "TMA 1 BRATISLAVA") def.segments[3].center = arpLzib;
        if (def.name === "CTR ŠTEFÁNIK") def.segments[1].center = parseDmsCoords("481012N 0171246E"); // Ponecháno napevno, jak bylo
        if (def.name === "TMA 1 PIEŠŤANY") { def.segments[1].center = arpLzppNew; def.segments[3].center = arpLzppNew; }
        if (def.name === "CTR PIEŠŤANY") { def.segments[1].center = arpLzppNew; def.segments[3].center = arpLzppNew; }
        if (def.name === "LZR1 Malacky") def.segments[1].center = lzr1MalackyArp;
        if (def.name === "LZR2 Malacky") def.segments[1].center = lzr1MalackyArp;
        if (def.name === "LZR314") { def.segments[1].center = lzr1MalackyArp; def.segments[2].center = lzr1MalackyArp; def.segments[4].center = lzr1MalackyArp; }
        if (def.name === "IB SMAA 01") def.segments[1].center = arpLzib;
        if (def.name === "IB SMAA 02") def.segments[2].center = arpLzib;
        if (def.name === "IB SMAA 03") def.segments[1].center = lzp23Center;
        if (def.name === "IB SMAA 04") def.segments[1].center = lzp23Center;
        
        buildAndAddPolygon(def);
    });

    // 4. Zpracování kruhových oblastí (LZP, LZD, ...)
    (data.circularZones || []).forEach(data => {
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

    // 5. Zpracování hraniční linie
    const lalesLatitude = 48.8653;
    const alamuLongitude = 18.33;
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
                    const polyline = L.polyline(currentFilteredSegment, { color: '#ff7800', weight: 3, opacity: 0.9, interactive: false });
                    layers["Hraniční linie"].addLayer(polyline);
                    allIndividualLayers.push(polyline);
                }
                currentFilteredSegment = [];
            }
        }
        if (currentFilteredSegment.length > 1) {
            const polyline = L.polyline(currentFilteredSegment, { color: '#ff7800', weight: 3, opacity: 0.9, interactive: false });
            layers["Hraniční linie"].addLayer(polyline);
            allIndividualLayers.push(polyline);
        }
    });

    // 6. Zpracování vstupních bodů
    (data.points || []).forEach(point => {
        const layerName = `Body ${point.group === 'lesmo' ? 'LESMO area' : point.group.toUpperCase()}`;
        if (!layers[layerName]) {
            layers[layerName] = L.layerGroup();
        }
        const marker = L.circleMarker(point.coords, {
            radius: 6, color: '#ffffff', weight: 1.5,
            fillColor: data.groupColors[point.group] || '#cccccc', fillOpacity: 0.9
        }).bindPopup(`<strong>${point.label}</strong>`).bindTooltip(point.label, {
            permanent: true, direction: 'right', className: 'point-label', offset: [10, 0]
        });
        layers[layerName].addLayer(marker);
        allIndividualLayers.push(marker);
    });

    // --- 10. RNAV STARs ---
    // Tato data přicházejí z rnav_data.js
    if (typeof rnavStars !== 'undefined' && Array.isArray(rnavStars)) {
        rnavStars.forEach(star => {
            const starPointsLayer = L.layerGroup();
            const starTrackLayer = L.layerGroup();
            let trackPoints = []; // Pro kreslení lomené čáry

            // --- OPRAVA ZDE ---
            // Přidána kontrola, zda star.waypoints existuje, než se na něj pokusíme volat .forEach
            if (star.waypoints && Array.isArray(star.waypoints)) {
                
                // Zpracování bodů (pro kreslení bodů a přípravu tratě)
                star.waypoints.forEach(wp => {
                    const coords = parseDmsWithSymbols(wp.coords);
                    if (coords) {
                        const marker = L.circleMarker(coords, {
                            radius: 5,
                            color: '#ffffff',
                            weight: 1.5,
                            fillColor: star.color,
                            fillOpacity: 0.9
                        }).bindPopup(`<strong>${wp.id}</strong><br>${wp.coords}<br>Level: ${wp.level}<br>Speed: ${wp.speed}`);
                        
                        starPointsLayer.addLayer(marker);
                        
                        // Přidáme bod do pole pro kreslení tratě, včetně info o zatáčce
                        trackPoints.push({ coords: coords, turn: wp.turn, id: wp.id });
                    }
                });

                // Kreslení tratě (s podporou Fly-by oblouků)
                // ... (zde je kód pro kreslení oblouků, který jsem přidal minule) ...
                
                // Nejjednodušší řešení: Znovu projdeme a kreslíme
                starTrackLayer.clearLayers();
                let lastValidPoint = trackPoints[0].coords; // Začátek
                
                for (let i = 1; i < trackPoints.length; i++) {
                    const pPrev = trackPoints[i-1];
                    const pCurr = trackPoints[i];
                    
                    // Je PŘEDCHOZÍ bod (pPrev) bodem zatáčky?
                    // *** Chyba byla zde: pPrev.turn neexistovalo, bylo to pCurr.turn (bod *ke kterému* letíme, má zatáčku)
                    // *** A musíme kontrolovat pPrev (i-1) a pCurr(i) a pNext(i+1)
                    
                    const pNext = (i < trackPoints.length - 1) ? trackPoints[i+1] : null;

                    // Je AKTUÁLNÍ bod (pCurr) bodem zatáčky (fly-by)?
                    if (pCurr.turn && pNext && L.curve) {
                        
                        const latLngPrev = L.latLng(pPrev.coords);
                        const latLngCurr = L.latLng(pCurr.coords);
                        const latLngNext = L.latLng(pNext.coords);
                        
                        // Směry
                        const bearingIn = latLngPrev.bearingTo(latLngCurr);
                        const bearingOut = latLngCurr.bearingTo(latLngNext);

                        // Poloměr "odříznutí" rohu
                        const turnRadiusMeters = 1852 * 1.5; // 1.5 NM

                        // Bod, kde oblouk začíná (na trati P1 -> P2)
                        const curveStart = latLngCurr.destination(bearingIn + 180, turnRadiusMeters);
                        // Bod, kde oblouk končí (na trati P2 -> P3)
                        const curveEnd = latLngCurr.destination(bearingOut, turnRadiusMeters);
                        
                        // 1. Čára od 'lastValidPoint' (konec minulé čáry) k začátku oblouku
                        starTrackLayer.addLayer(L.polyline([lastValidPoint, curveStart], { 
                            color: star.color, weight: 3, opacity: 0.8 
                        }));
                        
                        // 2. Oblouk (Bézierova křivka)
                        starTrackLayer.addLayer(L.curve(
                            ['M', curveStart, 'Q', latLngCurr, curveEnd],
                            { color: star.color, weight: 3, opacity: 0.8, dashArray: '5, 5' }
                        ));
                        
                        // Aktualizujeme 'lastValidPoint' na konec oblouku
                        lastValidPoint = curveEnd;
                        
                        // Důležité: Přeskočíme další bod (pNext), protože jsme ho právě použili
                        i++; 
                        
                        // Pokud byl přeskočený bod poslední, musíme dokreslit čáru k němu
                        if (i === trackPoints.length - 1) {
                             starTrackLayer.addLayer(L.polyline([lastValidPoint, trackPoints[i].coords], { 
                                color: star.color, weight: 3, opacity: 0.8 
                            }));
                        } else {
                            // Pokud není poslední, musíme 'i' vrátit o 1 zpět,
                            // aby se 'pNext' stalo 'pPrev' v další iteraci
                            i--;
                        }

                    } else {
                        // Normální přímá čára
                        starTrackLayer.addLayer(L.polyline([lastValidPoint, pCurr.coords], { 
                            color: star.color, weight: 3, opacity: 0.8 
                        }));
                        lastValidPoint = pCurr.coords;
                    }
                }

            } else {
                console.warn(`Data pro STAR '${star.name}' se zdají být nekompletní nebo chybí 'waypoints'. Zkontrolujte rnav_data.js.`);
            }
            // --- KONEC OPRAVY ---

            // Přidání vrstev do mapy
            layers[star.layers[0]] = starPointsLayer;
            layers[star.layers[1]] = starTrackLayer;
            allIndividualLayers.push(starPointsLayer, starTrackLayer);
        });
    }

    // 7. Nastavení viditelnosti vrstev
    // Načteme globální `defaultDisabled` z data.js (nebo rnav_data.js)
    const defaultDisabled = (typeof window.defaultDisabled !== 'undefined') ? window.defaultDisabled : [];

    Object.keys(layers).forEach(layerName => {
        if (!defaultDisabled.includes(layerName)) {
            layers[layerName].addTo(map);
        }
    });

    // 8. Nastavení ovládání legendy
    document.querySelectorAll('.legend-item').forEach(item => {
        const layerName = item.dataset.layerName;
        if (defaultDisabled.includes(layerName)) {
            item.classList.add('disabled');
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

    // 9. Rozbalovací legenda
    document.querySelectorAll('.legend-group-header').forEach(header => {
        header.addEventListener('click', (e) => {
            const groupName = e.currentTarget.dataset.toggleGroup;
            const items = header.nextElementSibling;
            
            // Speciální chování pro SMA
            if (groupName === 'sma') {
                const isDisabling = !header.classList.contains('group-disabled');
                if (isDisabling) {
                    header.classList.add('group-disabled');
                    header.textContent = "SMA (Vypnuto)";
                } else {
                    header.classList.remove('group-disabled');
                    header.textContent = "SMA (Přepnout vše)";
                }
                
                // Projdeme všechny položky v této skupině
                items.querySelectorAll('.legend-item').forEach(item => {
                    const layerName = item.dataset.layerName;
                    if (layers[layerName]) {
                        if (isDisabling) {
                            map.removeLayer(layers[layerName]);
                            item.classList.add('disabled');
                        } else {
                            map.addLayer(layers[layerName]);
                            item.classList.remove('disabled');
                        }
                    }
                });
            } 
            // Normální rozbalení/sbalení
            else {
                header.classList.toggle('open');
                if (items.style.display === "block") {
                    items.style.display = "none";
                } else {
                    items.style.display = "block";
                }
            }
        });
    });

    // 10. Přiblížení mapy
    const featureGroupForBounds = L.featureGroup(allIndividualLayers.filter(l => l.getBounds));
    if (featureGroupForBounds.getLayers().length > 0) {
        map.fitBounds(featureGroupForBounds.getBounds().pad(0.1));
    }
    
    // --- FUNKCIONALITA VERTIKÁLNÍHO PROFILU ---
    initializeProfileView();
}


/**
 * Inicializuje interaktivitu pro vertikální profil.
 */
function initializeProfileView() {
    let crosshairMarker = null;
    const profileView = document.getElementById('profile-view');
    const profileScaleContainer = document.getElementById('profile-scale-container');
    const profileAirspacesContainer = document.getElementById('profile-airspaces-container');
    const coordsDisplay = document.getElementById('coords-display');
    
    document.querySelector('.profile-close').addEventListener('click', () => {
        profileView.style.display = 'none';
        if (crosshairMarker) map.removeLayer(crosshairMarker);
        coordsDisplay.style.display = 'none';
    });

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

            // SMA linie
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

            // Ostatní prostory
            let allProfileAirspaces = [...airspaceSet.filter(a => a.class !== 'SMA')]; 
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
                        // Načtení priorit z `staticDataStore`
                        let prevPriority = staticDataStore.classPriority[prev.name] || staticDataStore.classPriority[prev.type] || staticDataStore.classPriority[prev.class] || 0;
                        let currPriority = staticDataStore.classPriority[curr.name] || staticDataStore.classPriority[curr.type] || staticDataStore.classPriority[curr.class] || 0;
                        
                        if (prev.class === 'TMA4') prevPriority = staticDataStore.classPriority['TMA4'];
                        if (curr.class === 'TMA4') currPriority = staticDataStore.classPriority['TMA4'];
                        
                        // Zde byla chyba, `gliderAirspaces` a `traSpaces` nebyly definovány
                        // Musíme je načíst z `staticDataStore`
                        if (staticDataStore.gliderAirspaces.includes(prev.name)) prevPriority = staticDataStore.classPriority['Glider'];
                        if (staticDataStore.gliderAirspaces.includes(curr.name)) currPriority = staticDataStore.classPriority['Glider'];
                        if (staticDataStore.traSpaces.includes(prev.name)) prevPriority = staticDataStore.classPriority['TRA'];
                        if (staticDataStore.traSpaces.includes(curr.name)) currPriority = staticDataStore.classPriority['TRA'];

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
                    
                    let lowerText = space.lower === 0 ? 'GND' : (space.lower >= 10000 ? `FL${Math.round(space.lower/100)}` : `${space.lower}'`);
                    if (space.name === 'LZR40' && space.lower === 1000) lowerText = '1000ft AGL';

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
}


// --- PARSERY A POMOCNÉ FUNKCE ---

/**
 * Zpracuje data hranic a naplní globální proměnné.
 * @param {string} coordinatesData - Surový textový řetězec souřadnic.
 */
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

/**
 * Převede DMS souřadnice (např. "485128N 0174034E") na dekadické [lat, lng].
 * @param {string} coordString - Řetězec souřadnic.
 * @returns {Array<number> | null} Pole [lat, lng] nebo null.
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
 * Převede souřadnice se symboly (např. "48°37'03,25\"N 017°32'28,20\"E") na [lat, lng].
 * @param {string} coordString - Řetězec souřadnic.
 * @returns {Array<number> | null} Pole [lat, lng] nebo null.
 */
function parseDmsWithSymbols(coordString) {
    if (!coordString) return null;
    
    // Rozdělí na lat a lng část
    const parts = coordString.split(/\s+/);
    if (parts.length < 2) {
        console.warn(`parseDmsWithSymbols: Nelze rozdělit řetězec: ${coordString}`);
        return null;
    }

    const parsePart = (part) => {
        // Odstraní N, E, S, W a nahradí čárku tečkou
        const cleanPart = part.replace(/[NESW]/i, '').replace(',', '.');
        // Rozdělí podle symbolů
        const dmsParts = cleanPart.split(/[°'"]+/); // Rozdělí podle °, ' nebo "
        if (dmsParts.length < 3) {
             console.warn(`parseDmsWithSymbols: Neúplné DMS části: ${part}`);
             return null;
        }
        
        const degrees = parseFloat(dmsParts[0]);
        const minutes = parseFloat(dmsParts[1]);
        const seconds = parseFloat(dmsParts[2]);
        
        if (isNaN(degrees) || isNaN(minutes) || isNaN(seconds)) {
            console.warn(`parseDmsWithSymbols: Chyba při parsování čísel: ${part}`);
            return null;
        }
        
        return degrees + minutes / 60 + seconds / 3600;
    };

    try {
        const lat = parsePart(parts[0]);
        const lng = parsePart(parts[1]);
        if (lat === null || lng === null) return null;
        return [lat, lng];
    } catch (e) {
        console.error(`Chyba při parsování (symboly): ${coordString}`, e);
        return null;
    }
}


/**
 * Vypočítá body pro oblouk.
 * @param {Array<number>} center - [lat, lng] středu.
 * @param {number} radiusNM - Poloměr v námořních mílích.
 * @param {Array<number>} startPoint - [lat, lng] začátku.
 * @param {Array<number>} endPoint - [lat, lng] konce.
 * @param {boolean} clockwise - Směr oblouku.
 * @returns {Array<Array<number>>} Pole bodů [lat, lng].
 */
function calculateArcPoints(center, radiusNM, startPoint, endPoint, clockwise = false) {
    if (!center || !startPoint || !endPoint) return [];
    const radiusDeg = radiusNM * 1.852 / 111.32; // Přibližný převod NM na stupně
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
        // Korekce délky pro zeměpisnou šířku
        const lng = centerLng + radiusDeg * Math.cos(angle) / Math.cos(centerLat * Math.PI / 180);
        points.push([lat, lng]);
    }
    return points;
}

/**
 * Sestaví a přidá polygon (nebo kruh) do mapy na základě definice.
 * @param {object} definition - Objekt definice prostoru.
 */
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
            if (startPoint && endPoint && segment.center) {
                segmentCoords = calculateArcPoints(segment.center, segment.radius, startPoint, endPoint, segment.cw);
            } else {
                 console.warn(`Chybějící data pro oblouk v: ${definition.name}`);
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
                    console.error("Could not find a border segment path for", definition.name, ". Falling back to straight line.");
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
                L.DomEvent.stopPropagation(e); // Zastaví propagaci eventu na mapu
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

/**
 * Přepočítá výšku v stopách na pixely pro vertikální profil.
 * @param {number} ft - Výška ve stopách.
 * @param {number} totalHeight - Celková výška kontejneru v pixelech.
 * @returns {number} Pozice Y v pixelech.
 */
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

/**
 * Zkontroluje, zda je bod uvnitř polygonu nebo kruhu (Point-in-Polygon).
 * @param {L.LatLng} latlng - Bod k testování.
 * @param {L.Layer} layer - Polygon nebo kruh.
 * @returns {boolean} True, pokud je bod uvnitř.
 */
function isMarkerInside(latlng, layer) {
     if (layer instanceof L.Polygon) {
         if (!layer.getLatLngs() || layer.getLatLngs().length === 0) return false;
         
         const latLngs = layer.getLatLngs();
         
         const isPointInPoly = (points) => {
             let x = latlng.lat, y = latlng.lng;
             let inside = false;
             for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
                 let xi = points[i].lat, yi = points[i].lng;
                 let xj = points[j].lat, yj = points[j].lng;
                 let intersect = ((yi > y) != (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
                 if (intersect) inside = !inside;
             }
             return inside;
         };

         if (Array.isArray(latLngs[0]) && latLngs[0].length > 0 && latLngs[0][0] instanceof L.LatLng) {
             const outer = latLngs[0];
             if (!isPointInPoly(outer)) return false;
             
             for (let i = 1; i < latLngs.length; i++) {
                 if (isPointInPoly(latLngs[i])) return false; // Je v díře
             }
             return true; 
         }
         else if (latLngs.length > 0 && latLngs[0] instanceof L.LatLng) {
             return isPointInPoly(latLngs);
         }
         return false;

     } else if (layer instanceof L.Circle) {
         return latlng.distanceTo(layer.getLatLng()) <= layer.getRadius();
     }
     return false;
}

/**
 * Převede dekadické stupně na DMS řetězec.
 * @param {number} deg - Stupně.
 * @param {boolean} isLng - True, pokud jde o longitude.
 * @returns {string} Formátovaný DMS řetězec.
 */
function toDMS(deg, isLng) {
    const d = Math.floor(Math.abs(deg));
    const minFloat = (Math.abs(deg) - d) * 60;
    const m = Math.floor(minFloat);
    const secFloat = (minFloat - m) * 60;
    const s = Math.round(secFloat);
    const dir = deg < 0 ? (isLng ? 'W' : 'S') : (isLng ? 'E' : 'N');
    return `${d.toString().padStart(isLng ? 3 : 2, '0')}${m.toString().padStart(2, '0')}${s.toString().padStart(2, '0')}${dir}`;
}