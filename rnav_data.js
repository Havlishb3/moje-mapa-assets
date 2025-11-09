// ==================================================================
// SOUBOR DAT PRO RNAV TRATĚ
// ==================================================================

// --- Globální úložiště dat ---
const rnavStars = [
    {
        name: "BERVA 2M",
        color: "#00FFFF", // Azurová
        points: [
            { name: "BERVA", coords: "48°37'03,25\"N 017°32'28,20\"E" },
            { name: "IB689", coords: "48°33'31,83\"N 017°37'48,60\"E" },
            { name: "IB688", coords: "48°21'11,89\"N 017°44'20,24\"E", turn: "RIGHT" },
            { name: "IB687", coords: "48°15'59,45\"N 017°47'04,59\"E" },
            { name: "INFOS", coords: "48°10'16,10\"N 017°38'43,31\"E", turn: "RIGHT" },
            { name: "IB633", coords: "48°15'26,93\"N 017°30'44,94\"E", turn: "RIGHT" },
            { name: "IB686", coords: "48°10'19,74\"N 017°23'19,58\"E", turn: "LEFT" },
            { name: "IB685", coords: "48°05'09,43\"N 017°31'17,91\"E", turn: "LEFT" },
            { name: "IB684", coords: "48°01'40,47\"N 017°36'38,61\"E" },
            { name: "IB683", coords: "47°58'11,27\"N 017°41'58,58\"E" },
            { name: "IB682", coords: "47°54'36,52\"N 017°36'47,23\"E", turn: "RIGHT" },
            { name: "IB681", coords: "47°58'05,48\"N 017°31'27,27\"E", turn: "RIGHT" },
            { name: "EKLIP", coords: "48°01'34,19\"N 017°26'06,60\"E" }
        ]
    }
    // Zde můžete v budoucnu přidat další tratě, např.:
    // {
    //     name: "JINÁ TRAŤ",
    //     color: "#FF00FF",
    //     points: [
    //         { name: "BOD1", coords: "..." },
    //         { name: "BOD2", coords: "...", turn: "LEFT" }
    //     ]
    // }
];

// --- Přidání do seznamu defaultně vypnutých vrstev ---
// Použijeme 'var defaultDisabled', který je definován v data.js
if (typeof defaultDisabled !== 'undefined' && Array.isArray(defaultDisabled)) {
    rnavStars.forEach(star => {
        defaultDisabled.push(`${star.name} Body`);
        defaultDisabled.push(`${star.name} Trať`);
    });
} else {
    console.error("Proměnná 'defaultDisabled' nebyla nalezena. Načtěl se soubor data.js?");
}