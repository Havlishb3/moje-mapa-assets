// ==================================================================
// SOUBOR LOGIKY PRO MAPOVOU APLIKACI
// Načítá data definovaná v data.js a rnav_data.js
// ==================================================================

// --- Globální proměnné ---
let map; // Instance mapy Leaflet
const layers = {}; // Objekt pro ukládání vrstev
const allIndividualLayers = []; // Pole pro snadné přiblížení
const protectedPointStrings = new Set(); // Ochrana bodů hranic

// --- Hlavní spouštěcí funkce ---
// Čeká, až se načte HTML (DOM), pak spustí inicializaci
document.addEventListener('DOMContentLoaded', () => {
    // Ověření, zda jsou data (ze souboru data.js) načtena
    if (typeof coordinatesData !== 'undefined' && typeof ma1Definition !== 'undefined') {
        initializeMap();
    } else {
        console.error("Data (data.js) nebyla načtena. Skript se zastavuje.");
        // Zobrazit chybovou hlášku uživateli místo loaderu
        const loader = document.getElementById('loader');
        if (loader) {
            loader.innerHTML = '<p style="color: #e74c3c; font-weight: bold;">Chyba při načítání dat!<br>Zkuste obnovit stránku.</p>';
        }
    }
});


/**
 * Inicializuje celou mapu, vrstvy a ovládací prvky.
 * Spustí se po načtení DOM a ověření, že data jsou k dispozici.
 */
function initializeMap() {
    
    // 1. Vytvoření mapy
    map = L.map('map').setView([48.8, 17.5], 8);
    map.doubleClickZoom.disable(); // Vypnutí zoomu na dvojklik

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd', maxZoom: 20
    }).addTo(map);

    // 2. Zpracování dat hranic
    processBorderData(coordinatesData);
    
    // 3. Vytvoření polygonů prostorů (definovány v data.js)
    [
        ma1Definition, ctrDefinition, tma4Definition, tma3Definition, tma2Definition,
        tma1PiestanyDefinition, tma2PiestanyDefinition, ctrPiestanyDefinition,
        lesmoDefinition, lzr1Definition, lzr2Definition,
        lzr31aDefinition, lzr31bDefinition, lzr31cDefinition, lzr31dDefinition, lzr31eDefinition,
        lzr40Definition, lzr222Definition, lzr223Definition, lzr314Definition,
        boleraz1Definition, boleraz2Definition, inovec1Definition, inovec2Definition, javorinaDefinition,
        zuzanaDefinition, lztsa16Definition, lztra3Definition, lztra4aDefinition,
        ibSmaa01Definition, ibSmaa02Definition, ibSmaa03Definition,
        ibSmaa04Definition, ibSmaa05Definition, ibSmaa06Definition, ibSmaa07Definition
    ].forEach(buildAndAddPolygon);

    // 4. Vytvoření kruhových oblastí
    (circularZones || []).forEach(data => {
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
    const lalesLatitude = 48.8653;
    layers["Hraniční linie"] = L.layerGroup();
    borderLineSegments.forEach(segment => {
        let currentFilteredSegment = [];
        for (const point of segment) {
            const isProtected = protectedPointStrings.has(point.join(','));
            const longitudeOk = point[1] <= 18.33; // Kreslíme jen po ALAMU (18.33)
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
        
    // 6. Vstupní body
    (points || []).forEach(point => {
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

    // 7. RNAV tratě (z rnav_data.js)
    if (typeof rnavStars !== 'undefined') {
        rnavStars.forEach(star => {
            const pointsLayer = L.layerGroup();
            const trackLayer = L.layerGroup();
            const pointCoords = [];
            
            star.points.forEach(point => {
                const coords = parseDmsWithSymbols(point.coords);
                if (coords) {
                    pointCoords.push({ ...point, latlng: coords }); // Uložíme si bod i s daty o zatáčce
                    const marker = L.marker(coords, {
                        icon: L.divIcon({
                            className: 'rnav-point-label',
                            html: `<span>${point.name}</span>`,
                            iconSize: [60, 20],
                            iconAnchor: [0, 10]
                        })
                    }).bindPopup(`<strong>${point.name}</strong><br>${point.coords}`);
                    pointsLayer.addLayer(marker);
                }
            });

            // Vykreslení tratě s oblouky
            drawRnavTrack(pointCoords, trackLayer, star.color);
            
            layers[`${star.name} Body`] = pointsLayer;
            layers[`${star.name} Trať`] = trackLayer;
            allIndividualLayers.push(pointsLayer);
            allIndividualLayers.push(trackLayer);
        });
    }

    // 8. Nastavení viditelnosti vrstev a legendy
    setupLegendAndToggles();

    // 9. Přiblížení mapy
    const featureGroupForBounds = L.featureGroup(allIndividualLayers.filter(l => l.getBounds));
    if (featureGroupForBounds.getLayers().length > 0) {
        map.fitBounds(featureGroupForBounds.getBounds().pad(0.1));
    }

    // 10. Nastavení eventů pro profil
    setupProfileViewEvents();

    // 11. Skrytí loaderu
    const loader = document.getElementById('loader');
    if (loader) {
        loader.style.display = 'none';
    }
}


/**
 * Kreslí RNAV trať, používá Bézierovy křivky pro simulaci "fly-by".
 * @param {Array} points - Pole objektů bodů (včetně {latlng, name, turn})
 * @param {L.LayerGroup} layerGroup - Vrstva, do které se má kreslit
 * @param {string} color - Barva tratě
 */
function drawRnavTrack(points, layerGroup, color) {
    const options = { color: color, weight: 2, opacity: 0.8 };

    for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const p3 = (i < points.length - 2) ? points[i + 2] : null;

        // Kontrolujeme, zda *následující* bod (p2) má zatáčku
        if (p2.turn && p3) {
            // Bod 1 -> Bod 2 (Fly-by) -> Bod 3
            
            // 1. Vytvoříme kontrolní body pro Bézierovu křivku
            // Najdeme body "před" a "za" bodem zatáčky (p2)
            const p1_offset = L.latLng(
                p1.latlng.lat + (p2.latlng.lat - p1.latlng.lat) * 0.85,
                p1.latlng.lng + (p2.latlng.lng - p1.latlng.lng) * 0.85
            );
            const p3_offset = L.latLng(
                p2.latlng.lat + (p3.latlng.lat - p2.latlng.lat) * 0.15,
                p2.latlng.lng + (p3.latlng.lng - p2.latlng.lng) * 0.15
            );

            // 2. Kreslíme dvě části: přímá čára a křivka
            // Čára z p1 do začátku křivky (p1_offset)
            L.polyline([p1.latlng, p1_offset], options).addTo(layerGroup);
            
            // Křivka (oblouk)
            // p1_offset -> p2.latlng (kontrolní bod) -> p3_offset
            const curve = L.curve(
                ['M', p1_offset, 'Q', p2.latlng, p3_offset],
                { ...options, fill: false, dashArray: '5, 5' } // Čárkovaně pro odlišení oblouku
            );
            curve.addTo(layerGroup);
            
            // Posuneme index, protože jsme zpracovali i čáru p2 -> p3
            // Ale pozor, další smyčka musí začít od p3_offset, ne p3
            // Jednodušší je jen upravit p1 pro další smyčku
            
            // Místo toho, abychom přeskočili 'i', řekneme, že další čára 
            // začíná od konce naší křivky (p3_offset)
            points[i+1].latlng = p3_offset; 

        } else {
            // Normální "fly-over" (nebo poslední segment)
            // Kreslíme přímou čáru z p1 do p2
            L.polyline([p1.latlng, p2.latlng], options).addTo(layerGroup);
        }
    }
}


/**
 * Nastaví všechny ovládací prvky legendy a přepínače vrstev.
 */
function setupLegendAndToggles() {
    // 1. Běžné přepínače vrstev
    document.querySelectorAll('.legend-item').forEach(item => {
        const layerName = item.dataset.layerName;
        if (defaultDisabled.includes(layerName)) {
            item.classList.add('disabled');
        } else {
            if (layers[layerName]) {
                layers[layerName].addTo(map);
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

    // 2. Rozbalovací skupiny
    document.querySelectorAll('.legend-group-header').forEach(header => {
        header.addEventListener('click', (e) => {
            // Speciální logika pro hromadné přepínání (např. SMA)
            const groupName = e.currentTarget.dataset.toggleGroup;
            if (groupName) {
                toggleLayerGroup(groupName, e.currentTarget);
            } else {
                // Standardní rozbalení/sbalení
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
}

/**
 * Hromadně zapne/vypne skupinu vrstev (např. SMA).
 * @param {string} groupName - Název skupiny (např. 'sma' z data-toggle-group)
 * @param {HTMLElement} headerElement - Element hlavičky, na který se kliklo
 */
function toggleLayerGroup(groupName, headerElement) {
    const itemsContainer = headerElement.nextElementSibling;
    const legendItems = itemsContainer.querySelectorAll('.legend-item');
    
    // Zjistíme, jestli je většina vrstev zapnutá, nebo vypnutá
    let enabledCount = 0;
    legendItems.forEach(item => {
        if (!item.classList.contains('disabled')) {
            enabledCount++;
        }
    });
    
    const shouldEnable = enabledCount < (legendItems.length / 2); // Pokud je méně než polovina zapnutá, zapneme všechny
    
    legendItems.forEach(item => {
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

    // Také otevřeme/zavřeme skupinu
    if (shouldEnable && !headerElement.classList.contains('open')) {
        headerElement.classList.add('open');
        itemsContainer.style.display = "block";
    }
}

/**
 * Nastaví interaktivitu pro panel vertikálního profilu.
 */
function setupProfileViewEvents() {
    let crosshairMarker = null;
    const profileView = document.getElementById('profile-view');
    const profileScaleContainer = document.getElementById('profile-scale-container');
    const profileAirspacesContainer = document.getElementById('profile-airspaces-container');
    const coordsDisplay = document.getElementById('coords-display');
    
    document.querySelector('.profile-close').addEventListener('click', () => {
        profileView.style.display = 'none';
        if (crosshairMarker) {
            map.removeLayer(crosshairMarker);
        }
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
            
            // Projdeme všechny vrstvy na mapě
            map.eachLayer(layer => {
                if (layer.airspaceInfo && layer.airspaceInfo.class !== 'SMA') { // Ignorujeme SMA pro překryv, ale zahrneme je níže
                    if (isMarkerInside(sample.latlng, layer)) {
                        airspacesAtPoint.push(layer.airspaceInfo);
                    }
                }
            });

            // Speciálně přidáme SMA vrstvy, pokud jsou viditelné
            Object.keys(layers).forEach(layerName => {
                const layer = layers[layerName];
                if (map.hasLayer(layer) && layer.getLayers().length > 0) {
                    const firstSubLayer = layer.getLayers()[0]; // Získáme první pod-vrstvu (polygon nebo kruh)
                    if (firstSubLayer.airspaceInfo && firstSubLayer.airspaceInfo.class === 'SMA') {
                        if (isMarkerInside(sample.latlng, firstSubLayer)) {
                            airspacesAtPoint.push(firstSubLayer.airspaceInfo);
                        }
                    }
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
}


// ==================================================================
// --- POMOCNÉ FUNKCE ---
// ==================================================================

/**
 * Zpracuje DMS souřadnice ve formátu '482411N 0170707E' na [lat, lng].
 * @param {string} coordString - Řetězec DMS
 * @returns {Array|null} - Pole [lat, lng] nebo null
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

        if (dms.length >= 6) { 
            degrees = parseInt(dms.substring(0, degLen), 10);
            minutes = parseInt(dms.substring(degLen, degLen + 2), 10);
            seconds = parseInt(dms.substring(degLen + 2, degLen + 4), 10);
        } else if (dms.length >= 4) { 
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
 * Nová funkce pro parsování DMS se symboly: '48°37'03,25"N 017°32'28,20"E'
 * @param {string} coordString - Řetězec DMS se symboly
 * @returns {Array|null} - Pole [lat, lng] nebo null
 */
function parseDmsWithSymbols(coordString) {
    if (!coordString) return null;
    
    const parts = coordString.trim().split(/\s+/); // Rozdělí na Lat a Lng část
    if (parts.length < 2) return null;

    const parsePart = (partStr) => {
        // Odstraní vše kromě čísel, desetinné čárky/tečky a písmen N/S/E/W
        const cleaned = partStr.replace(/[°'"]/g, " ").replace(/"/g, "").replace(/,/g, ".");
        const components = cleaned.split(/[\s\.]+/); // Rozdělí podle mezer nebo teček
        
        if (components.length < 4) return null; // Deg, Min, Sec, SubSec, Dir

        const deg = parseFloat(components[0]);
        const min = parseFloat(components[1]);
        const sec = parseFloat(components[2] + "." + components[3]);
        const dir = components[4];

        let decimal = deg + (min / 60) + (sec / 3600);
        
        if (dir === 'S' || dir === 'W') {
            decimal *= -1;
        }
        return decimal;
    };

    try {
        const lat = parsePart(parts[0]);
        const lng = parsePart(parts[1]);
        if (lat === null || lng === null) return null;
        return [lat, lng];
    } catch (e) {
        console.error(`Chyba při parsování DMS (se symboly): ${coordString}`, e);
        return null;
    }
}


/**
 * Zpracuje syrová data hranic a rozdělí je na segmenty.
 * @param {string} data - Řetězec s daty souřadnic (z data.js)
 */
let borderLineSegments = [];
function processBorderData(data) {
    let borderCoords = data.trim().split('\n').filter(line => line.trim() !== '').map(line => {
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
}

/**
 * Pomocná funkce pro výpočet vzdálenosti mezi dvěma body [lat, lng].
 */
const getDistance = (p1, p2) => Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));

/**
 * Vypočítá body pro kruhový oblouk (arc).
 * @param {Array} center - [lat, lng] středu
 * @param {number} radiusNM - Poloměr v NM
 * @param {Array} startPoint - [lat, lng] počátečního bodu
 * @param {Array} endPoint - [lat, lng] koncového bodu
 * @param {boolean} clockwise - Směr oblouku
 * @returns {Array} - Pole bodů [lat, lng] tvořících oblouk
 */
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

/**
 * Vytvoří a přidá polygon (prostor) na mapu na základě jeho definice.
 * @param {object} definition - Objekt s definicí prostoru (z data.js)
 */
function buildAndAddPolygon(definition) {
    if (!definition || !definition.segments) {
        console.error("Chybná nebo chybějící definice pro:", definition);
        return;
    }

    let finalCoords = [];

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
                    console.error("Nenalezen segment hranice pro", segment.start, "do", segment.end, ". Používám přímou čáru.");
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
 * Přepočítá výšku ve stopách na pixely pro vertikální profil.
 * @param {number} ft - Výška ve stopách
 * @param {number} totalHeight - Celková výška kontejneru v px
 * @returns {number} - Pozice Y v px (odspodu)
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
 * Zjistí, zda je bod (marker) uvnitř polygonu nebo kruhu.
 * @param {L.LatLng} latlng - Souřadnice bodu
 * @param {L.Polygon|L.Circle} layer - Vrstva mapy
 * @returns {boolean} - True, pokud je bod uvnitř
 */
function isMarkerInside(latlng, layer) {
     if (layer instanceof L.Polygon) {
         if (!layer.getLatLngs() || layer.getLatLngs().length === 0) return false;
         
         const latLngs = layer.getLatLngs();
         
         if (Array.isArray(latLngs[0]) && latLngs[0].length > 0 && latLngs[0][0] instanceof L.LatLng) {
             const outer = latLngs[0];
             if (!isPointInPoly(latlng, outer)) return false;
             
             for (let i = 1; i < latLngs.length; i++) {
                 if (isPointInPoly(latlng, latLngs[i])) return false; // Je v díře
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

/**
 * Pomocná funkce pro Point-in-Polygon (Raycasting).
 * @param {L.LatLng} latlng - Bod
 * @param {Array<L.LatLng>} polyPoints - Pole vrcholů polygonu
 * @returns {boolean} - True, pokud je bod uvnitř
 */
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

/**
 * Převede desetinné stupně na formátovaný řetězec DMS.
 * @param {number} deg - Desetinné stupně
 * @param {boolean} isLng - True, pokud jde o zeměpisnou délku
 * @returns {string} - Formátovaný DMS řetězec
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