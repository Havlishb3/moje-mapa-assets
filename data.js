// ==================================================================
// SOUBOR DAT PRO MAPOVOU APLIKACI
// Obsahuje veškeré definice prostorů, bodů a hranic.
// Tento soubor je načítán souborem script.js
// ==================================================================

// --- Globální úložiště dat ---
// Definujeme data v globálním scope, aby k nim měl script.js přístup
// (protože jsou načítány jako samostatné <script> tagy)

const coordinatesData = `
18.772346493804,47.9417200732249
18.117592,49.1481285
17.6227669988735,48.8485734991961
17.8583538666659,48.9251205253609
18.6423523925648,49.5007925053448
18.2497544807743,49.2956824898248
18.3248975,49.3168445
17.6997529862845,47.7650510177354
16.9517229678476,48.2660700228301
17.2465045091468,48.0171649684346
17.24112625,48.0220776
16.9984715001054,48.6987359996147
16.9450660078094,48.550519493084
17.4024761679811,48.8189861943299
18.1012905,49.0734995
18.4212055056667,49.3964879973414
16.9567910358977,48.6239610516577
17.6511465097406,48.8549610030304
18.8944133803947,48.0547732330704
17.8922065352336,47.739663102322
17.150369,48.0133565
16.936406,48.602588
16.9773321573555,48.1812879747293
17.0643945261542,48.1206464837986
16.8506059832583,48.4499099833722
16.939046504856,48.5839249752228
16.9406319906801,48.5253625109938
16.8959350151376,48.4871059791397
17.0832085,48.042116
17.0749691479056,48.0737832974762
16.9463528987847,48.2391674413111
16.8745075170317,48.3446495146078
17.0243325,48.7372435
17.0417029929228,48.7616834809115
17.0618290065517,48.7725480050858
17.0967615001916,48.8004350000861
17.1058440073661,48.8075755197365
17.1856845,48.8697445
17.2800669708756,48.8557580472016
17.3361078396115,48.8294624051192
17.4254861121164,48.8267440524778
17.4388947756305,48.8394202919571
17.5969985046142,48.8334245180376
17.7549409984115,48.89021989958123
17.7834524986558,48.9205660401393
17.8297964980893,48.9270600000654
17.8987130553851,48.9545950894682
17.9121496876909,49.0059755132089
17.9010585182887,48.9673309742378
17.9240497515754,49.0194720679619
17.9999499190026,49.0245828713364
18.078730507049,49.0438645066255
18.0952240501288,49.068277955204
18.1077924999006,49.0822964998709
18.1202120388258,49.1210528905817
18.1109934788948,49.1391824788948
18.1294420123599,49.1569180155687
18.145549009261,49.2023735160401
18.1479654989756,49.2392039835283
18.1845835,49.2739445
18.188839000628,49.2883535003417
18.2010316993078,49.2925525111827
18.2691380281191,49.3004870179275
18.344019,49.320641
18.3899415436621,49.3445160321519
18.5601590233739,49.5048655101088
18.5430125,49.4971765
18.6024835082364,49.5029714679287
18.4793246141377,47.7584901394655
18.4366456507434,47.7587223503938
17.9082355024399,47.7417112509107
18.3147233089485,47.7344288012508
18.8373253034781,47.8174065993691
18.2357917469693,47.740582800284
18.6340251568576,47.7586721009475
18.6822582015576,47.7678165006604
18.5947642855626,47.7611846016071
18.372852414539,47.7446967031665
18.0186038,47.75169335
17.0628074981828,48.1233914835984
18.5143003054827,47.7555299010125
18.6999394660204,49.5010354845086
17.5126846004969,48.8210158471483
17.4935379994298,48.8302220003894
18.8212129971072,48.0069840319602
18.7607849008744,47.8935647291767
18.7679025,47.927487
18.8100775149598,47.989333007898
18.8517609892051,48.05020746269
18.8206422608554,48.0406090341053
18.8222029786556,47.8433750878128
18.8524594708137,47.8232616676779
17.2368685,48.018892
17.2062639621599,48.0192139059054
17.2156864009909,48.0184473995936
17.21679385,48.0179897
17.2807099999996,47.9939245
17.7092464818099,47.7563800081208
17.7910675130632,47.7403770335683
17.7709640141271,47.7452049885193
17.70546335,47.75894205
17.8441738848199,47.7420715261713
17.440215,47.9044955
17.4247389907295,47.9271035135421
17.4564354894976,47.8838025053793
17.346664,47.9827175
17.5305209855215,47.8612990170886
17.6583618512956,47.7902739994103
17.6132880086273,47.8183259932167
17.7034291521192,48.8601554529039
17.6790640809848,48.8584940485593
17.725059496193,48.8766100414545
17.7044667648309,48.8615140985927
16.8410206244914,48.371995401564
17.9855150093485,47.7526882542202
17.2051552,48.019444
17.5812734557997,47.8177420106704
17.1992335426889,48.018796605564
17.1740095,48.0124565
18.1621045087584,49.2593025308949
18.1301095029991,49.1720094329148
18.1137555002532,49.099018991745
18.0290253847732,49.0262625887625
17.8879505230978,48.9392205860025
17.9068254825405,48.9869344846943
17.9830572231186,49.0255401274591
18.752241073771,49.4892890164896
18.1309535004091,49.185650992375
18.4767489800292,49.4157135447009
18.5458134374324,49.4719150379
18.6370826265126,49.4972705062299
18.7253155,49.4958715
18.7690264509049,49.498479948321
18.504695,49.442307
17.5547910456147,48.8216426054841
17.4285405,48.829253
17.5748699060922,48.8241374006504
17.1552655194749,48.8456925197663
17.0472754938768,48.7670169972654
17.013543,48.7236125
17.0545,48.769211
17.0345345014697,48.7495585005661
17.3884778840082,48.8161979420041
17.1632789943199,48.8540244977349
17.0407715014512,48.7557565101906
17.1078119770041,48.8282479706397
17.0893295172479,48.786302023652
16.9421435025868,48.6073675333993
16.9669799988361,48.6552419679917
17.357581,47.9750265
17.47367775,47.87943415
17.2899339831416,47.9944445054203
17.2491119739602,48.0030165266741
17.37017505,47.9651531
17.4019445175816,47.9487149854786
17.4872225054488,47.8734999969283
17.5478165137596,47.8378679703112
17.6748694247907,47.7810196142023
17.6251491664676,47.8083381786477
17.34096000825,47.9885724932057
16.9484345130968,48.2692789913833
16.8431515056155,48.3587279855601
16.9482610212456,48.5331100135199
16.8512120483974,48.4378785205321
16.9118790607531,48.284323139163
16.8584745,48.415811
16.9383072438313,48.2709109508492
16.9140214770877,48.5120834723987
17.0891015,48.0952445
17.0817191254761,48.0252710378223
16.9693410130658,48.2023099838646
18.8265865035572,48.0316870352532
18.8355954984577,48.0474640005135
18.8837085,48.0527245
18.7733894706279,47.9600336087284
18.763593525484,47.9818775200788
18.7621082497787,47.8179759999676
18.7618225177336,47.9123274347764
18.8085834209377,47.8207983796601
18.6056041919622,47.7588380017402
18.7998319396956,47.8573799837364
18.72968575,47.79494785
18.7801318506871,47.8679054202435
17.7972714765364,47.7428189871334
18.2705695,47.7351506
18.0256138873796,47.7544445458097
17.9551563803652,47.7502059851826
17.7376670001949,47.7522894999572
18.3375024559444,47.7379649011355
18.1168222397455,47.7515347509124
18.3958483409116,47.7517666989386
17.8578154978568,47.7447644994742
18.4602608946232,47.7646093009463
18.2037878138233,47.7407678026279
17.088323,48.1012835
17.076353,48.1089465
17.0680339828333,48.1166055242173
17.0620090358307,48.132992693073
17.6035265000005,47.822551
17.85132565,47.7434583
17.61898065,47.8135977
17.8810480502778,47.742465849926
18.161935555727,47.7437784484729
18.0852085552893,47.7565263498823
16.8507934771103,48.3910409194079
16.9758085006019,48.1737464477358
16.9761359487238,48.1725128547819
16.9611335077739,48.6309445071949
18.0906629952482,49.0643309700146
18.108194,49.131807
17.520361,48.81275
17.4678060003408,48.8433219999155
17.3196949653659,48.8452119717511
18.1533115,49.218402
18.6852644609147,49.5032681601086
16.9412951965153,48.6175332469
18.410555,49.381801
18.4298013988535,49.3938249232726
18.3012270746639,49.309726341272
16.9796866,48.17035725
16.9881167925683,48.165296455362
16.9959541918671,48.1604624041875
17.0118382631127,48.1537365427887
17.01854825,48.14826355
17.0222719269998,48.1439035227973
17.0572976,48.1425169
16.9393565001637,48.6146395230824
17.2151484997759,48.8718550001108
16.896364480445,48.3147374806717
16.8750990090974,48.4690400159688
16.9196514979113,48.5182575464339
16.8528152434762,48.4327241614596
16.85374445,48.4011609
16.8418126157412,48.382867457846
16.9144070015089,48.5032479735935
`;

const points = [
    { coords: [48.7828, 17.0792], label: "PEPIK", group: 'cz' },
    { coords: [48.8533, 17.1678], label: "ODNEM", group: 'cz' },
    { coords: [48.8214, 17.5375], label: "MAVOR", group: 'cz' },
    { coords: [48.8653, 17.7094], label: "LALES", group: 'cz' },
    { coords: [48.5875, 16.9378], label: "REKLU", group: 'at' },
    { coords: [48.2703, 16.9264], label: "TOVKA", group: 'at' },
    { coords: [48.0675, 17.0878], label: "ABLOM", group: 'at' },
    { coords: [48.1906, 16.9692], label: "MAREG", group: 'at' },
    { coords: [48.1275, 17.0483], label: "KOXER", group: 'at' },
    { coords: [47.9878, 17.3414], label: "ADAMA", group: 'lesmo' },
    { coords: [47.9083, 17.4375], label: "KUVEX", group: 'lesmo' },
    { coords: [47.79, 17.66], label: "VAMOG", group: 'hu' },
    { coords: [47.75, 18.06], label: "XOMBA", group: 'hu' },
    { coords: [47.73, 18.33], label: "ALAMU", group: 'hu' }
];

const tma4Data = `
    485128N 0174034E
    484817N 0174716E
    484225N 0175931E
    483712N 0180015E
    483517N 0180032E
    482452N 0180200E
    481725N 0180302E
    475116N 0180639E
    474524N 0180343E
`;

const tma3Data = `
    482504N 0173405E
    481755N 0175259E
    481222N 0175804E
    475602N 0175539E
    474617N 0174129E
    475239N 0172847E
    480324N 0174421E
    481231N 0174540E
    482504N 0173405E
`;

const tma2Data = `
    481933N 0165432E
    481833N 0170053E
    481808N 0170333E
    481457N 0170046E
    480837N 0170326E
`;

const ma1Data = `
    482759N 0172622E
    482504N 0173405E
    481231N 0174540E
    480324N 0174421E
    475239N 0172847E
    475949N 0171557E
    480607N 0172501E
    480743N 0172232E
    481258N 0172222E
    481521N 0172549E
    481905N 0171959E
    481859N 0171741E
    482759N 0172622E
`;

const ctrData = `
    481905N 0171959E
    481521N 0172549E
    481258N 0172222E
    480743N 0172232E
    480607N 0172501E
    475949N 0171557E
    480837N 0170326E
    481457N 0170046E
    481808N 0170333E
    481845N 0171343E
    481859N 0171741E
    481905N 0171959E
`;

const tma1PiestanyData = `
    484733N 0174409E
    483518N 0173942E
    483159N 0174316E
    482708N 0174130E
    482547N 0174952E
    483038N 0175139E
    483712N 0180015E
    483517N 0180032E
    482452N 0180200E
    481755N 0175259E
    482504N 0173405E
    482640N 0173527E
    483503N 0173429E
    484616N 0173840E
    484733N 0174409E
`;

const tma2PiestanyData = `
    484616N 0173840E
    483503N 0173429E
    482640N 0173527E
    482504N 0173405E
    482759N 0172622E
    483241N 0172548E
    483649N 0172519E
    484442N 0173203E
    484616N 0173840E
`;

const ctrPiestanyData = `
    484817N 0174716E
    484225N 0175931E
    483712N 0180015E
    483038N 0175139E
    482547N 0174952E
    482708N 0174130E
    483159N 0174316E
    483518N 0173942E
    484733N 0174409E
    484817N 0174716E
`;

const lesmoData = `
    480024N 0170939E
    474906N 0173651E
    474449N 0173000E
    473559N 0172918E
    473559N 0171554E
    473555N 0164005E
`;

const lzr1MalackyArpString = "482411N 0170707E";

const arpLzib = [48.17, 17.212778];

const arpLzppNewString = "483730N 0174943E";

const lzp23CenterString = "481057N 0175614E";

const circularZones = [
    { name: "LZP23 Šaľa", color: '#e74c3c', popup: '<strong>LZP23 Šaľa</strong><br>4 000 ft AMSL / GND<br>H24<br>Chemický závod', upper: 4000, lower: 0, class: 'P', center: "481057N 0175614E", radius_km: 2 },
    { name: "LZP29 Jaslovské Bohunice", color: '#e74c3c', popup: '<strong>LZP29 Jaslovské Bohunice</strong><br>5 000 ft AMSL / GND<br>H24<br>Jadrová elektráreň', upper: 5000, lower: 0, class: 'P', center: "482932N 0174042E", radius_km: 2 },
    { name: "LZD2 Slovnaft", color: '#f39c12', popup: '<strong>LZD2 Slovnaft</strong><br>1 500 ft AMSL / GND<br>Aktivovaný: H24', upper: 1500, lower: 0, class: 'D', type: 'DANGER', center: "480629N 0171138E", radius_km: 0.3 },
    { name: "MADAR. LHPR Drop Zone", color: '#BE29EC', popup: '<strong>MADAR. LHPR Drop Zone</strong><br>FL 125 / 9 500 ft AMSL', upper: 12500, lower: 9500, class: 'N/A', center: "473738N 0174830E", radius_km: 4 * 1.852 }
];

const groupColors = {
    cz: '#3388ff', at: '#e63946', hu: '#52b788', lesmo: '#ff9f43'
};

// ZMĚNA: 'const' bylo změněno na 'var', aby do něj mohly další soubory přidávat.
var defaultDisabled = [
    'LZR31A', 'LZR31B', 'LZR31C', 'LZR31D', 'LZR31E', 'LZR40',
    'BOLERAZ 1', 'BOLERAZ 2', 'INOVEC 1', 'INOVEC 2', 'JAVORINA',
    'ZUZANA', 'LZTSA16', 'LZTRA3', 'LZTRA4A'
    // Vrstvy RNAV byly odsud odstraněny
];

const classPriority = { 
    // Nejvyšší priorita - specifické názvy
    'BOLERAZ 1': 10,
    'BOLERAZ 2': 10,
    'INOVEC 1': 10,
    'INOVEC 2': 10,
    'JAVORINA': 10,
    'LZR31B': 12, 'LZR31C': 12, 'LZR31D': 12, // Vnitřní
    'LZR31E': 11, // Prostřední
    'LZR31A': 10, // Vnější
    'LZR222 Turecký Vrch Peter': 9,
    'LZR223 Turecký Vrch Viktor': 9,
    'LZR1 Malacky': 8,
    'LZR2 Malacky': 8,
    'LZR40': 8,
    'LZR314': 8,
    // --- NOVÉ PRIORITY PRO VOJENSKÉ PROSTORY ---
    'ZUZANA': 9, // TSA
    'LZTSA16': 9, // TSA
    'LZTRA3': 8, // TRA
    'LZTRA4A': 8, // TRA
    // --- KONEC NOVÝCH PRIORIT ---
    'LZR': 7, // Obecná LZR priorita
    'P': 6, 
    'DANGER': 5, 
    'C': 4, // TMA 1-3, CTR Stef., LESMO
    'D': 3, // Piestany
    'TMA4': 2, 
    'G': 1,
    'SMA': 0 // Nejnižší priorita
};

// --- Definice prostorů (Objekty) ---

const ma1Points = ma1Data.trim().split('\n');
const ma1Definition = {
    name: "TMA 1 BRATISLAVA",
    color: '#3498db', 
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

const ctrPoints = ctrData.trim().split('\n');
const ctrDefinition = {
    name: "CTR ŠTEFÁNIK",
    color: '#2980b9', 
    popup: '<strong>CTR ŠTEFÁNIK</strong><br>5 000 ft AMSL / GND<br>Trieda C',
    upper: 5000, lower: 0, class: 'C',
    segments: [
        { type: 'line', points: ctrPoints.slice(0, 3) },
        { type: 'arc', center: [48.17, 17.212778], radius: 7, start: ctrPoints[2], end: ctrPoints[3], cw: true }, // [48.17, 17.212778] = parseDmsCoords("481012N 0171246E")
        { type: 'line', points: ctrPoints.slice(3, 6) },
        { type: 'border', start: ctrPoints[5], end: ctrPoints[6] },
        { type: 'line', points: ctrPoints.slice(6) }
    ]
};

const tma4Points = tma4Data.trim().split('\n');
const tma4Definition = {
    name: "TMA 4 BRATISLAVA",
    color: '#aed6f1', 
    popup: '<strong>TMA 4 BRATISLAVA</strong><br>FL 125 / 5 000 ft AMSL<br>Trieda C',
    upper: 12500, lower: 5000, class: 'TMA4', 
    segments: [
        { type: 'line', points: tma4Points },
        { type: 'border', start: tma4Points[tma4Points.length - 1], end: tma4Points[0] }
    ]
};

const tma3Points = tma3Data.trim().split('\n');
const tma3Definition = {
    name: "TMA 3 BRATISLAVA",
    color: '#85c1e9', 
    popup: '<strong>TMA 3 BRATISLAVA</strong><br>5 000 ft AMSL / 2 500 ft AMSL<br>Trieda C',
    upper: 5000, lower: 2500, class: 'C',
    segments: [
        { type: 'line', points: tma3Points.slice(0, 5) },
        { type: 'border', start: tma3Points[4], end: tma3Points[5] },
        { type: 'line', points: tma3Points.slice(5) }
    ]
};

const tma2Points = tma2Data.trim().split('\n');
const tma2Definition = {
    name: "TMA 2 BRATISLAVA",
    color: '#5dade2', 
    popup: '<strong>TMA 2 BRATISLAVA</strong><br>5 000 ft AMSL / 2 500 ft AMSL<br>Trieda C',
    upper: 5000, lower: 2500, class: 'C',
    segments: [
        { type: 'line', points: tma2Points },
        { type: 'border', start: tma2Points[tma2Points.length - 1], end: tma2Points[0] }
    ]
};

const tma1PiestanyPoints = tma1PiestanyData.trim().split('\n');
const tma1PiestanyDefinition = {
    name: "TMA 1 PIEŠŤANY",
    color: '#2ecc71', 
    popup: '<strong>TMA 1 PIEŠŤANY</strong><br>5 000 ft AMSL / 2 500 ft AMSL<br>Trieda D',
    upper: 5000, lower: 2500, class: 'D',
    segments: [
        { type: 'line', points: tma1PiestanyPoints.slice(0, 2) },
        { type: 'arc', center: [48.625, 17.828611], radius: 7, start: tma1PiestanyPoints[1], end: tma1PiestanyPoints[2], cw: false}, // [48.625, 17.828611] = parseDmsCoords(arpLzppNewString)
        { type: 'line', points: tma1PiestanyPoints.slice(2, 6) },
        { type: 'arc', center: [48.625, 17.828611], radius: 7, start: tma1PiestanyPoints[5], end: tma1PiestanyPoints[6], cw: false},
        { type: 'line', points: tma1PiestanyPoints.slice(6) },
    ]
};

const tma2PiestanyPoints = tma2PiestanyData.trim().split('\n');
const tma2PiestanyDefinition = {
    name: "TMA 2 PIEŠŤANY",
    color: '#a3e4d7', 
    popup: '<strong>TMA 2 PIEŠŤANY</strong><br>5 000 ft AMSL / 3 500 ft AMSL<br>Trieda D',
    upper: 5000, lower: 3500, class: 'D',
    segments: [
         { type: 'line', points: tma2PiestanyPoints }
    ]
};

const ctrPiestanyPoints = ctrPiestanyData.trim().split('\n');
const ctrPiestanyDefinition = {
    name: "CTR PIEŠŤANY",
    color: '#1abc9c', 
    popup: '<strong>CTR PIEŠŤANY</strong><br>5 000 ft AMSL / GND<br>Trieda D',
    upper: 5000, lower: 0, class: 'D',
    segments: [
        { type: 'line', points: ctrPiestanyPoints.slice(0, 3) },
        { type: 'arc', center: [48.625, 17.828611], radius: 7, start: ctrPiestanyPoints[2], end: ctrPiestanyPoints[3], cw: true }, // [48.625, 17.828611] = parseDmsCoords(arpLzppNewString)
        { type: 'line', points: ctrPiestanyPoints.slice(3, 7) },
        { type: 'arc', center: [48.625, 17.828611], radius: 7, start: ctrPiestanyPoints[6], end: ctrPiestanyPoints[7], cw: true },
        { type: 'line', points: ctrPiestanyPoints.slice(7) }
    ]
};

const lesmoPoints = lesmoData.trim().split('\n');
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
        { type: 'arc', center: [48.403056, 17.118611], radius: 7, start: "482849N 0171500E", end: "482931N 0171355E", cw: false }, // [48.403056, 17.118611] = parseDmsCoords(lzr1MalackyArpString)
        { type: 'line', points: ["482931N 0171355E", "483340N 0171552E", "483518N 0170755E", "483109N 0170610E"] },
        { type: 'arc', center: [48.403056, 17.118611], radius: 7, start: "483109N 0170610E", end: "481833N 0170053E", cw: false },
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
        { type: 'arc', center: [48.403056, 17.118611], radius: 7, start: "481845N 0171343E", end: "482849N 0171500E", cw: false }, // [48.403056, 17.118611] = parseDmsCoords(lzr1MalackyArpString)
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
    lower: 1000, // AGL
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
    color: '#c0392b', 
    popup: '<strong>LZR314</strong><br>5 000 ft AMSL / GND<br>Trieda G, Aktívny: H24<br>Vstup len so súhlasom MIL TWR Malacky (min. 3 min vopred na 129,575 MHz). Povinné SSR.',
    upper: 5000,
    lower: 0,
    class: 'G', 
    segments: [
        { type: 'line', points: [
            "483518N 0170755E",
            "483340N 0171552E",
            "482931N 0171355E"
        ]},
        { type: 'arc', 
          center: [48.403056, 17.118611], // parseDmsCoords(lzr1MalackyArpString)
          radius: 7, 
          start: "482931N 0171355E", 
          end: "482849N 0171500E", 
          cw: true 
        },
        { type: 'arc', 
          center: [48.403056, 17.118611], 
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
          center: [48.403056, 17.118611], 
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

// --- NOVÉ DEFINICE (KLUZÁKY) ---
const boleraz1Definition = {
    name: "BOLERAZ 1",
    color: '#e74c3c', 
    popup: `<strong>BOLERAZ 1</strong><br>
            5 000 ft AMSL / 3 500 ft AMSL<br>
            Trieda G (počas ACT)<br>
            Aktivácia: TEL (02/48 57 22 60) podľa povolenia APP Štefánik<br>
            Info: ŠTEFÁNIK RADAR 134,925 MHz, BRATISLAVA INFO 124,300 MHz<br>
            Počúvajte: BOLERÁZ TRAFFIC 132,080 MHz`,
    upper: 5000,
    lower: 3500,
    class: 'G', 
    segments: [{ type: 'line', points: [
        "484616N 0173840E",
        "483503N 0173429E",
        "482640N 0173527E",
        "482504N 0173405E",
        "482759N 0172622E",
        "483241N 0172548E",
        "483649N 0172519E",
        "484442N 0173203E",
        "484616N 0173840E"
    ]}]
};

const boleraz2Definition = {
    name: "BOLERAZ 2",
    color: '#e74c3c', 
    popup: `<strong>BOLERAZ 2</strong><br>
            7 000 ft AMSL / 5 000 ft AMSL<br>
            Trieda G (počas ACT)<br>
            Aktivácia: TEL (02/48 57 22 60) podľa povolenia APP Štefánik<br>
            Info: ŠTEFÁNIK RADAR 134,925 MHz, BRATISLAVA INFO 124,300 MHz<br>
            Počúvajte: BOLERÁZ TRAFFIC 132,080 MHz`,
    upper: 7000,
    lower: 5000,
    class: 'G', 
    segments: [{ type: 'line', points: [
        "484616N 0173840E",
        "483503N 0173429E",
        "482640N 0173527E",
        "482504N 0173405E",
        "482759N 0172622E",
        "483241N 0172548E",
        "483649N 0172519E",
        "484442N 0173203E",
        "484616N 0173840E"
    ]}]
};

const inovec1Definition = {
    name: "INOVEC 1",
    color: '#e74c3c', 
    popup: `<strong>INOVEC 1</strong><br>
            8 000 ft AMSL / 5 000 ft AMSL<br>
            Trieda G (počas ACT)<br>
            Aktivácia: NOTAM, Koordinácia s APP Štefánik, ACT info od AMC.<br>
            Info: ŠTEFÁNIK RADAR 134,925 MHz, BRATISLAVA INFO 124,300 MHz<br>
            Počúvajte: BRATISLAVA INFO 124,300 MHz`,
    upper: 8000,
    lower: 5000,
    class: 'G', 
    segments: [{ type: 'line', points: [
        "482452N 0180200E",
        "481725N 0180302E",
        "475116N 0180639E",
        "481222N 0175804E",
        "482242N 0175910E",
        "482452N 0180200E"
    ]}]
};

const inovec2Definition = {
    name: "INOVEC 2",
    color: '#e74c3c', 
    popup: `<strong>INOVEC 2</strong><br>
            8 000 ft AMSL / 2 500 ft AMSL<br>
            Trieda G (počas ACT)<br>
            Aktivácia: NOTAM, Koordinácia s APP Štefánik a TWR Piešťany, ACT info od AMC.<br>
            Info: ŠTEFÁNIK RADAR 134,925 MHz, BRATISLAVA INFO 124,300 MHz, PIEŠŤANY VEŽA 118,575 MHz<br>
            Počúvajte: BRATISLAVA INFO 124,300 MHz`,
    upper: 8000,
    lower: 2500,
    class: 'G', 
    segments: [{ type: 'line', points: [
        "483517N 0180032E",
        "482452N 0180200E",
        "482242N 0175910E",
        "483517N 0180032E"
    ]}]
};

const javorinaDefinition = {
    name: "JAVORINA",
    color: '#e74c3c', 
    popup: `<strong>JAVORINA</strong><br>
            8 000 ft AMSL / 5 000 ft AMSL<br>
            Trieda G (počas ACT)<br>
            Aktivácia: TEL (02/48 57 22 60) podľa povolenia APP Štefánik<br>
            Info: ŠTEFÁNIK RADAR 134,925 MHz, BRATISLAVA INFO 124,300 MHz<br>
            Počúvajte: BOLERÁZ TRAFFIC 132,080 MHz`,
    upper: 8000,
    lower: 5000,
    class: 'G', 
    segments: [
        { type: 'line', points: [
            "485128N 0174034E",
            "484817N 0174716E",
            "484733N 0174409E",
            "484616N 0173840E",
            "484442N 0173203E",
            "484932N 0172452E"
        ]},
        { type: 'border', start: "484932N 0172452E", end: "485128N 0174034E" }
    ]
};

// --- NOVÉ DEFINICE PŘIDANÉ 12.8. ---
const zuzanaDefinition = {
    name: "ZUZANA",
    color: '#e74c3c', // TSA/TRA barva
    popup: `<strong>ZUZANA (LZTSA15)</strong><br>
            FL 660 / GND<br>
            Aktivace: NOTAM. Info od Bratislava ACC (134,475 MHz).<br>
            MON-SUN 0700-0900 (0500-0700)<br>
            Info v AUP/UUP.<br>
            Vstup v době činnosti NENÍ povolen (Strelecké skúšky).`,
    upper: 66000,
    lower: 0,
    class: 'LZR', // Dáme jako LZR pro vysokou prioritu
    segments: [{ type: 'line', points: [
        "484530N 0173140E",
        "484410N 0173530E",
        "482520N 0170930E",
        "483210N 0170030E",
        "484530N 0173140E"
    ]}]
};

const lztsa16Definition = {
    name: "LZTSA16",
    color: '#e74c3c',
    popup: `<strong>LZTSA16</strong><br>
            FL 410 / FL 125<br>
            AMC spravovaný priestor (H24). Info v AUP/UUP.<br>
            Info o ACT od príslušného stanovišťa ATS.<br>
            Vstup v době činnosti NENÍ povolen (Výcvik vojenského letectva).`,
    upper: 41000,
    lower: 12500,
    class: 'LZR', 
    segments: [
        { type: 'line', points: [
            "484833N 0170623E",
            "483649N 0172519E",
            "483241N 0172548E",
            "482759N 0172622E",
            "481859N 0171741E",
            "481845N 0171343E",
            "481808N 0170333E",
            "481833N 0170053E",
            "481933N 0165432E"
        ]},
        { type: 'border', start: "481933N 0165432E", end: "484833N 0170623E" }
    ]
};

const lztra3Definition = {
    name: "LZTRA3",
    color: '#e74c3c',
    popup: `<strong>LZTRA3</strong><br>
            FL 125 / 5 000 ft AMSL<br>
            AMC spravovaný priestor (H24). Info v AUP/UUP.<br>
            Info o ACT od Štefánik APP (134,925 MHz).<br>
            Vstup v době činnosti NENÍ povolen (Výcvik vojenského letectva, lety OAT).`,
    upper: 12500,
    lower: 5000,
    class: 'LZR', 
    segments: [
        { type: 'line', points: [
            "484622N 0170344E",
            "483442N 0172235E",
            "483241N 0172548E",
            "482759N 0172622E",
            "481859N 0171741E",
            "481845N 0171343E",
            "481808N 0170333E",
            "481833N 0170053E",
            "481933N 0165432E"
        ]},
        { type: 'border', start: "481933N 0165432E", end: "484622N 0170344E" }
    ]
};

const lztra4aDefinition = {
    name: "LZTRA4A",
    color: '#e74c3c',
    popup: `<strong>LZTRA4A</strong><br>
            FL 205 / 8 000 ft AMSL<br>
            AMC spravovaný priestor (MON-FRI H24). Info v AUP/UUP.<br>
            Info o ACT od ACC Bratislava.<br>
            Vstup v době činnosti NENÍ povolen (Výcvik vojenského letectva, lety OAT).`,
    upper: 20500,
    lower: 8000,
    class: 'LZR', 
    segments: [{ type: 'line', points: [
        "490402N 0181246E",
        "490225N 0181716E",
        "490228N 0182201E",
        "490237N 0183309E",
        "485533N 0183817E",
        "485331N 0183946E",
        "483008N 0180850E",
        "483133N 0180633E",
        "483517N 0180032E",
        "483712N 0180015E",
        "484225N 0175931E",
        "484817N 0174716E",
        "490402N 0181246E"
    ]}]
};
// --- KONEC NOVÝCH DEFINIC 12.8. ---


const ibSmaa01Definition = {
    name: "IB SMAA 01",
    color: '#ff9f43', 
    popup: '<strong>IB SMAA 01</strong><br>MNM ALT 2000 ft AMSL<br>(ID: LZSLZIB001)',
    upper: 2000, 
    lower: 2000, 
    class: 'SMA', 
    segments: [
        { type: 'line', points: ["482028N 0172442E"] },
        { 
            type: 'arc', 
            center: arpLzib, 
            radius: 13, 
            start: "482028N 0172442E", 
            end: "475833N 0172121E", 
            cw: true 
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
          cw: false 
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
          center: [48.1825, 17.937222], // parseDmsCoords(lzp23CenterString)
          radius: 4.1, 
          start: "481502N 0175538E", 
          end: "480655N 0175715E", 
          cw: false
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
          center: [48.1825, 17.937222], // parseDmsCoords(lzp23CenterString)
          radius: 4.1, 
          start: "480655N 0175715E", 
          end: "481502N 0175538E", 
          cw: true
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
