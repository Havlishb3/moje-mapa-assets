/**
 * Data pro RNAV tratě.
 * Tento soubor je načítán v index.html PŘED script.js
 */

var rnavStars = [
    {
        name: "BERVA 2M",
        layers: ["BERVA 2M Body", "BERVA 2M Trať"],
        color: "#00FFFF",
        waypoints: [
            { id: "BERVA", flyover: false, coords: "48°37'03,25\"N 017°32'28,20\"E", level: "FL130-", speed: "A7500+", turn: null },
            { id: "IB689", flyover: false, coords: "48°33'31,83\"N 017°37'48,60\"E", level: "A7500+", speed: "-", turn: null },
            { id: "IB688", flyover: false, coords: "48°21'11,89\"N 017°44'20,24\"E", level: "A5500+", speed: "-", turn: "RIGHT" },
            { id: "IB687", flyover: false, coords: "48°15'59,45\"N 017°47'04,59\"E", level: "A3000+", speed: "-", turn: null },
            { id: "INFOS", flyover: false, coords: "48°10'16,10\"N 017°38'43,31\"E", level: "A3000+", speed: "-", turn: "RIGHT" },
            { id: "IB633", flyover: false, coords: "48°15'26,93\"N 017°30'44,94\"E", level: "A3000+", speed: "-", turn: "RIGHT" },
            { id: "IB686", flyover: false, coords: "48°10'19,74\"N 017°23'19,58\"E", level: "A3000+", speed: "-", turn: "LEFT" },
            { id: "IB685", flyover: false, coords: "48°05'09,43\"N 017°31'17,91\"E", level: "A3000+", speed: "-", turn: "LEFT" },
            { id: "IB684", flyover: false, coords: "48°01'40,47\"N 017°36'38,61\"E", level: "A3000+", speed: "-", turn: null },
            { id: "IB683", flyover: false, coords: "47°58'11,27\"N 017°41'58,58\"E", level: "A3000+", speed: "K220-", turn: null },
            { id: "IB682", flyover: false, coords: "47°54'36,52\"N 017°36'47,23\"E", level: "A3000+", speed: "K220-", turn: "RIGHT" },
            { id: "IB681", flyover: false, coords: "47°58'05,48\"N 017°31'27,27\"E", level: "A3000+", speed: "K220-", turn: "RIGHT" },
            { id: "EKLIP", flyover: false, coords: "48°01'34,19\"N 017°26'06,60\"E", level: "A2500+", speed: "K220-", turn: null }
        ]
    }
];

// Přidání vrstev do globálního seznamu vypnutých vrstev
// Tento seznam je definován v data.js
if (typeof defaultDisabled !== 'undefined') {
    rnavStars.forEach(star => {
        defaultDisabled.push(...star.layers);
    });
}