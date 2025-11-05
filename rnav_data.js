// ==================================================================
// DATA PRO RNAV TRATĚ
// Načítá se PO data.js a PŘED script.js
// ==================================================================

const rnavStars = [
  {
    name: "BERVA 2M",
    color: "#00FFFF", // Azurová/Cyan
    waypoints: [
      { name: "BERVA", coordsDMS: "48°37'03,25\"N 017°32'28,20\"E" },
      { name: "IB689", coordsDMS: "48°33'31,83\"N 017°37'48,60\"E" },
      { name: "IB688", coordsDMS: "48°21'11,89\"N 017°44'20,24\"E" },
      { name: "IB687", coordsDMS: "48°15'59,45\"N 017°47'04,59\"E" },
      { name: "INFOS", coordsDMS: "48°10'16,10\"N 017°38'43,31\"E" },
      { name: "IB633", coordsDMS: "48°15'26,93\"N 017°30'44,94\"E" },
      { name: "IB686", coordsDMS: "48°10'19,74\"N 017°23'19,58\"E" },
      { name: "IB685", coordsDMS: "48°05'09,43\"N 017°31'17,91\"E" },
      { name: "IB684", coordsDMS: "48°01'40,47\"N 017°36'38,61\"E" },
      { name: "IB683", coordsDMS: "47°58'11,27\"N 017°41'58,58\"E" },
      { name: "IB682", coordsDMS: "47°54'36,52\"N 017°36'47,23\"E" },
      { name: "IB681", coordsDMS: "47°58'05,48\"N 017°31'27,27\"E" },
      { name: "EKLIP", coordsDMS: "48°01'34,19\"N 017°26'06,60\"E" }
    ]
  }
];

// Přidáme vrstvy z tohoto souboru do seznamu defaultně vypnutých
// (Předpokládá, že defaultDisabled bylo v data.js definováno jako 'var')
if (typeof defaultDisabled !== 'undefined') {
  defaultDisabled.push('BERVA 2M Body', 'BERVA 2M Trať');
} else {
  console.error("Chyba: 'defaultDisabled' není definováno. Načtěte data.js dříve.");
}
