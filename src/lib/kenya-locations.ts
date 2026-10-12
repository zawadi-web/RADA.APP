/**
 * Kenya Geographic Registry
 * Complete 47 Counties of Kenya with major sub-counties, towns, and coordinates.
 * Privacy-First: Users can select County + Area, or auto-detect via GPS.
 */

export interface KenyanArea {
  value: string;
  label: string;
  lat?: number;
  lng?: number;
}

export interface KenyanCounty {
  value: string;
  label: string;
  lat: number;
  lng: number;
  areas: KenyanArea[];
}

export const KENYAN_COUNTIES: KenyanCounty[] = [
  {
    value: "baringo",
    label: "Baringo",
    lat: 0.50,
    lng: 35.75,
    areas: [
      { value: "kabarnet", label: "Kabarnet" },
      { value: "eldama-ravine", label: "Eldama Ravine" },
      { value: "marigat", label: "Marigat" },
      { value: "mogotio", label: "Mogotio" },
      { value: "chemolingot", label: "Chemolingot" },
    ],
  },
  {
    value: "bomet",
    label: "Bomet",
    lat: -0.78,
    lng: 35.34,
    areas: [
      { value: "bomet-town", label: "Bomet Town" },
      { value: "sotik", label: "Sotik" },
      { value: "silibwet", label: "Silibwet" },
      { value: "mulot", label: "Mulot" },
      { value: "longisa", label: "Longisa" },
    ],
  },
  {
    value: "bungoma",
    label: "Bungoma",
    lat: 0.57,
    lng: 34.56,
    areas: [
      { value: "bungoma-town", label: "Bungoma Town" },
      { value: "webuye", label: "Webuye" },
      { value: "kimilili", label: "Kimilili" },
      { value: "chwele", label: "Chwele" },
      { value: "malakisi", label: "Malakisi" },
      { value: "sirisia", label: "Sirisia" },
    ],
  },
  {
    value: "busia",
    label: "Busia",
    lat: 0.46,
    lng: 34.11,
    areas: [
      { value: "busia-town", label: "Busia Town" },
      { value: "malaba", label: "Malaba" },
      { value: "nambale", label: "Nambale" },
      { value: "port-victoria", label: "Port Victoria" },
      { value: "bumala", label: "Bumala" },
    ],
  },
  {
    value: "elgeyo-marakwet",
    label: "Elgeyo-Marakwet",
    lat: 0.80,
    lng: 35.50,
    areas: [
      { value: "iten", label: "Iten" },
      { value: "kapsowar", label: "Kapsowar" },
      { value: "chepkorio", label: "Chepkorio" },
      { value: "tambach", label: "Tambach" },
    ],
  },
  {
    value: "embu",
    label: "Embu",
    lat: -0.53,
    lng: 37.46,
    areas: [
      { value: "embu-town", label: "Embu Town" },
      { value: "runyenjes", label: "Runyenjes" },
      { value: "siakago", label: "Siakago" },
      { value: "manyatta", label: "Manyatta" },
      { value: "ishiara", label: "Ishiara" },
    ],
  },
  {
    value: "garissa",
    label: "Garissa",
    lat: -0.45,
    lng: 39.65,
    areas: [
      { value: "garissa-town", label: "Garissa Town" },
      { value: "dadaab", label: "Dadaab" },
      { value: "masalani", label: "Masalani" },
      { value: "bura", label: "Bura" },
      { value: "balambala", label: "Balambala" },
    ],
  },
  {
    value: "homa-bay",
    label: "Homa Bay",
    lat: -0.53,
    lng: 34.46,
    areas: [
      { value: "homa-bay-town", label: "Homa Bay Town" },
      { value: "mbita", label: "Mbita" },
      { value: "ndhiwa", label: "Ndhiwa" },
      { value: "oyugis", label: "Oyugis" },
      { value: "kendu-bay", label: "Kendu Bay" },
    ],
  },
  {
    value: "isiolo",
    label: "Isiolo",
    lat: 0.35,
    lng: 37.58,
    areas: [
      { value: "isiolo-town", label: "Isiolo Town" },
      { value: "garbatulla", label: "Garbatulla" },
      { value: "merti", label: "Merti" },
      { value: "modogashe", label: "Modogashe" },
    ],
  },
  {
    value: "kajiado",
    label: "Kajiado",
    lat: -1.85,
    lng: 36.78,
    areas: [
      { value: "kitengela", label: "Kitengela" },
      { value: "ngong", label: "Ngong" },
      { value: "ongata-rongai", label: "Ongata Rongai" },
      { value: "kiserian", label: "Kiserian" },
      { value: "kajiado-town", label: "Kajiado Town" },
      { value: "namanga", label: "Namanga" },
      { value: "loitokitok", label: "Loitokitok" },
    ],
  },
  {
    value: "kakamega",
    label: "Kakamega",
    lat: 0.28,
    lng: 34.75,
    areas: [
      { value: "kakamega-town", label: "Kakamega Town" },
      { value: "mumias", label: "Mumias" },
      { value: "malava", label: "Malava" },
      { value: "butere", label: "Butere" },
      { value: "shinyalu", label: "Shinyalu" },
      { value: "lugari", label: "Lugari" },
    ],
  },
  {
    value: "kericho",
    label: "Kericho",
    lat: -0.37,
    lng: 35.29,
    areas: [
      { value: "kericho-town", label: "Kericho Town" },
      { value: "litein", label: "Litein" },
      { value: "kapsoit", label: "Kapsoit" },
      { value: "londiani", label: "Londiani" },
      { value: "kipkelion", label: "Kipkelion" },
    ],
  },
  {
    value: "kiambu",
    label: "Kiambu",
    lat: -1.17,
    lng: 36.83,
    areas: [
      { value: "ruiru", label: "Ruiru" },
      { value: "thika", label: "Thika" },
      { value: "kikuyu", label: "Kikuyu" },
      { value: "kiambu-town", label: "Kiambu Town" },
      { value: "limuru", label: "Limuru" },
      { value: "juja", label: "Juja" },
      { value: "githunguri", label: "Githunguri" },
      { value: "karuri", label: "Karuri" },
      { value: "banana", label: "Banana Hill" },
    ],
  },
  {
    value: "kilifi",
    label: "Kilifi",
    lat: -3.51,
    lng: 39.91,
    areas: [
      { value: "kilifi-town", label: "Kilifi Town" },
      { value: "malindi", label: "Malindi" },
      { value: "watamu", label: "Watamu" },
      { value: "mtwapa", label: "Mtwapa" },
      { value: "mariakani", label: "Mariakani" },
      { value: "kaloleni", label: "Kaloleni" },
    ],
  },
  {
    value: "kirinyaga",
    label: "Kirinyaga",
    lat: -0.50,
    lng: 37.28,
    areas: [
      { value: "kerugoya", label: "Kerugoya" },
      { value: "kutus", label: "Kutus" },
      { value: "sagana", label: "Sagana" },
      { value: "wanguru", label: "Wang'uru" },
      { value: "kagio", label: "Kagio" },
    ],
  },
  {
    value: "kisii",
    label: "Kisii",
    lat: -0.68,
    lng: 34.77,
    areas: [
      { value: "kisii-town", label: "Kisii Town" },
      { value: "suneka", label: "Suneka" },
      { value: "ogembo", label: "Ogembo" },
      { value: "keroka", label: "Keroka" },
      { value: "nyacheki", label: "Nyacheki" },
    ],
  },
  {
    value: "kisumu",
    label: "Kisumu",
    lat: -0.10,
    lng: 34.76,
    areas: [
      { value: "kisumu-cbd", label: "Kisumu CBD" },
      { value: "milimani-kisumu", label: "Milimani" },
      { value: "riat", label: "Riat Hills" },
      { value: "mamboleo", label: "Mamboleo" },
      { value: "kondele", label: "Kondele" },
      { value: "maseno", label: "Maseno" },
      { value: "ahero", label: "Ahero" },
    ],
  },
  {
    value: "kitui",
    label: "Kitui",
    lat: -1.37,
    lng: 38.01,
    areas: [
      { value: "kitui-town", label: "Kitui Town" },
      { value: "mwingi", label: "Mwingi" },
      { value: "mutomo", label: "Mutomo" },
      { value: "kwa-vonza", label: "Kwa Vonza" },
      { value: "kabati", label: "Kabati" },
    ],
  },
  {
    value: "kwale",
    label: "Kwale",
    lat: -4.18,
    lng: 39.46,
    areas: [
      { value: "diani", label: "Diani" },
      { value: "ukunda", label: "Ukunda" },
      { value: "msambweni", label: "Msambweni" },
      { value: "kwale-town", label: "Kwale Town" },
      { value: "kinango", label: "Kinango" },
      { value: "lunga-lunga", label: "Lunga Lunga" },
    ],
  },
  {
    value: "laikipia",
    label: "Laikipia",
    lat: 0.36,
    lng: 36.78,
    areas: [
      { value: "nanyuki", label: "Nanyuki" },
      { value: "nyahururu", label: "Nyahururu" },
      { value: "rumuruti", label: "Rumuruti" },
      { value: "kinamba", label: "Kinamba" },
      { value: "doldol", label: "Doldol" },
    ],
  },
  {
    value: "lamu",
    label: "Lamu",
    lat: -2.27,
    lng: 40.90,
    areas: [
      { value: "lamu-island", label: "Lamu Island" },
      { value: "shela", label: "Shela" },
      { value: "mpeketoni", label: "Mpeketoni" },
      { value: "mokowe", label: "Mokowe" },
    ],
  },
  {
    value: "machakos",
    label: "Machakos",
    lat: -1.52,
    lng: 37.26,
    areas: [
      { value: "machakos-town", label: "Machakos Town" },
      { value: "athi-river", label: "Athi River" },
      { value: "syokimau", label: "Syokimau" },
      { value: "mlolongo", label: "Mlolongo" },
      { value: "kangundo", label: "Kangundo" },
      { value: "tala", label: "Tala" },
      { value: "matuu", label: "Matuu" },
    ],
  },
  {
    value: "makueni",
    label: "Makueni",
    lat: -1.80,
    lng: 37.63,
    areas: [
      { value: "wote", label: "Wote" },
      { value: "mtito-andei", label: "Mtito Andei" },
      { value: "kibwezi", label: "Kibwezi" },
      { value: "emali", label: "Emali" },
      { value: "makindu", label: "Makindu" },
      { value: "sultan-hamud", label: "Sultan Hamud" },
    ],
  },
  {
    value: "mandera",
    label: "Mandera",
    lat: 3.94,
    lng: 41.86,
    areas: [
      { value: "mandera-town", label: "Mandera Town" },
      { value: "rhamu", label: "Rhamu" },
      { value: "elwak", label: "Elwak" },
      { value: "banissa", label: "Banissa" },
    ],
  },
  {
    value: "marsabit",
    label: "Marsabit",
    lat: 2.33,
    lng: 37.99,
    areas: [
      { value: "marsabit-town", label: "Marsabit Town" },
      { value: "moyale", label: "Moyale" },
      { value: "north-horr", label: "North Horr" },
      { value: "laisamis", label: "Laisamis" },
    ],
  },
  {
    value: "meru",
    label: "Meru",
    lat: 0.05,
    lng: 37.65,
    areas: [
      { value: "meru-town", label: "Meru Town" },
      { value: "makutano", label: "Makutano" },
      { value: "nkubu", label: "Nkubu" },
      { value: "maua", label: "Maua" },
      { value: "timau", label: "Timau" },
      { value: "kianjai", label: "Kianjai" },
      { value: "mikinduri", label: "Mikinduri" },
    ],
  },
  {
    value: "migori",
    label: "Migori",
    lat: -1.06,
    lng: 34.47,
    areas: [
      { value: "migori-town", label: "Migori Town" },
      { value: "rongo", label: "Rongo" },
      { value: "isebania", label: "Isebania" },
      { value: "kehancha", label: "Kehancha" },
      { value: "awendo", label: "Awendo" },
    ],
  },
  {
    value: "mombasa",
    label: "Mombasa",
    lat: -4.04,
    lng: 39.67,
    areas: [
      { value: "nyali", label: "Nyali" },
      { value: "bamburi", label: "Bamburi" },
      { value: "shanzu", label: "Shanzu" },
      { value: "mombasa-cbd", label: "Mombasa CBD" },
      { value: "tudor", label: "Tudor" },
      { value: "kisauni", label: "Kisauni" },
      { value: "likoni", label: "Likoni" },
      { value: "changamwe", label: "Changamwe" },
    ],
  },
  {
    value: "muranga",
    label: "Murang'a",
    lat: -0.72,
    lng: 37.15,
    areas: [
      { value: "muranga-town", label: "Murang'a Town" },
      { value: "kenol", label: "Kenol" },
      { value: "kangema", label: "Kangema" },
      { value: "maragua", label: "Maragua" },
      { value: "kandara", label: "Kandara" },
    ],
  },
  {
    value: "nairobi",
    label: "Nairobi",
    lat: -1.29,
    lng: 36.82,
    areas: [
      { value: "westlands", label: "Westlands" },
      { value: "kilimani", label: "Kilimani" },
      { value: "kileleshwa", label: "Kileleshwa" },
      { value: "lavington", label: "Lavington" },
      { value: "karen", label: "Karen" },
      { value: "langata", label: "Lang'ata" },
      { value: "south-c", label: "South C" },
      { value: "south-b", label: "South B" },
      { value: "upperhill", label: "Upper Hill" },
      { value: "cbd", label: "Nairobi CBD" },
      { value: "ngong-road", label: "Ngong Road" },
      { value: "hurlingham", label: "Hurlingham" },
      { value: "parklands", label: "Parklands" },
      { value: "spring-valley", label: "Spring Valley" },
      { value: "muthaiga", label: "Muthaiga" },
      { value: "runda", label: "Runda" },
      { value: "gigiri", label: "Gigiri" },
      { value: "roysambu", label: "Roysambu" },
      { value: "kasarani", label: "Kasarani" },
      { value: "thika-road", label: "Thika Road" },
      { value: "kayole", label: "Kayole" },
      { value: "donholm", label: "Donholm" },
      { value: "embakasi", label: "Embakasi" },
      { value: "imara-daima", label: "Imara Daima" },
      { value: "pipeline", label: "Pipeline" },
      { value: "dagoretti", label: "Dagoretti" },
      { value: "zimmerman", label: "Zimmerman" },
      { value: "utawala", label: "Utawala" },
    ],
  },
  {
    value: "nakuru",
    label: "Nakuru",
    lat: -0.30,
    lng: 36.07,
    areas: [
      { value: "nakuru-cbd", label: "Nakuru CBD" },
      { value: "milimani", label: "Milimani" },
      { value: "section-58", label: "Section 58" },
      { value: "lanet", label: "Lanet" },
      { value: "naivasha", label: "Naivasha" },
      { value: "gilgil", label: "Gilgil" },
      { value: "njoro", label: "Njoro" },
      { value: "molo", label: "Molo" },
    ],
  },
  {
    value: "nandi",
    label: "Nandi",
    lat: 0.18,
    lng: 35.13,
    areas: [
      { value: "kapsabet", label: "Kapsabet" },
      { value: "nandi-hills", label: "Nandi Hills" },
      { value: "mosoriot", label: "Mosoriot" },
      { value: "kobujoi", label: "Kobujoi" },
    ],
  },
  {
    value: "narok",
    label: "Narok",
    lat: -1.08,
    lng: 35.87,
    areas: [
      { value: "narok-town", label: "Narok Town" },
      { value: "kilgoris", label: "Kilgoris" },
      { value: "maasai-mara", label: "Maasai Mara" },
      { value: "ololulunga", label: "Ololulung'a" },
    ],
  },
  {
    value: "nyamira",
    label: "Nyamira",
    lat: -0.56,
    lng: 34.93,
    areas: [
      { value: "nyamira-town", label: "Nyamira Town" },
      { value: "nyansiongo", label: "Nyansiongo" },
      { value: "keroka", label: "Keroka" },
      { value: "kebirigo", label: "Kebirigo" },
    ],
  },
  {
    value: "nyandarua",
    label: "Nyandarua",
    lat: -0.18,
    lng: 36.37,
    areas: [
      { value: "ol-kalou", label: "Ol Kalou" },
      { value: "engineer", label: "Engineer" },
      { value: "mairo-inya", label: "Mairo Inya" },
      { value: "njabini", label: "Njabini" },
      { value: "ndaragwa", label: "Ndaragwa" },
    ],
  },
  {
    value: "nyeri",
    label: "Nyeri",
    lat: -0.42,
    lng: 36.95,
    areas: [
      { value: "nyeri-town", label: "Nyeri Town" },
      { value: "karatina", label: "Karatina" },
      { value: "othaya", label: "Othaya" },
      { value: "mukurwe-ini", label: "Mukurwe-ini" },
      { value: "naro-moru", label: "Naro Moru" },
    ],
  },
  {
    value: "samburu",
    label: "Samburu",
    lat: 1.21,
    lng: 36.69,
    areas: [
      { value: "maralal", label: "Maralal" },
      { value: "baragoi", label: "Baragoi" },
      { value: "wamba", label: "Wamba" },
      { value: "archers-post", label: "Archers Post" },
    ],
  },
  {
    value: "siaya",
    label: "Siaya",
    lat: 0.06,
    lng: 34.29,
    areas: [
      { value: "siaya-town", label: "Siaya Town" },
      { value: "bondo", label: "Bondo" },
      { value: "ugunja", label: "Ugunja" },
      { value: "usenge", label: "Usenge" },
      { value: "yala", label: "Yala" },
    ],
  },
  {
    value: "taita-taveta",
    label: "Taita-Taveta",
    lat: -3.32,
    lng: 38.36,
    areas: [
      { value: "voi", label: "Voi" },
      { value: "wundanyi", label: "Wundanyi" },
      { value: "taveta", label: "Taveta" },
      { value: "mwatate", label: "Mwatate" },
    ],
  },
  {
    value: "tana-river",
    label: "Tana River",
    lat: -1.50,
    lng: 39.80,
    areas: [
      { value: "hola", label: "Hola" },
      { value: "madogo", label: "Madogo" },
      { value: "garsen", label: "Garsen" },
      { value: "bura", label: "Bura" },
    ],
  },
  {
    value: "tharaka-nithi",
    label: "Tharaka-Nithi",
    lat: -0.30,
    lng: 37.87,
    areas: [
      { value: "chuka", label: "Chuka", lat: -0.33, lng: 37.65 },
      { value: "chogoria", label: "Chogoria", lat: -0.23, lng: 37.62 },
      { value: "kathwana", label: "Kathwana", lat: -0.14, lng: 37.98 },
      { value: "marimanti", label: "Marimanti", lat: -0.16, lng: 38.00 },
      { value: "magutuni", label: "Magutuni", lat: -0.21, lng: 37.75 },
      { value: "kibugua", label: "Kibugua", lat: -0.28, lng: 37.64 },
      { value: "chiakariga", label: "Chiakariga", lat: -0.18, lng: 37.92 },
      { value: "muthambi", label: "Muthambi", lat: -0.30, lng: 37.63 },
      { value: "gatunga", label: "Gatunga", lat: -0.08, lng: 38.05 },
    ],
  },
  {
    value: "trans-nzoia",
    label: "Trans Nzoia",
    lat: 1.02,
    lng: 35.00,
    areas: [
      { value: "kitale", label: "Kitale" },
      { value: "kiminini", label: "Kiminini" },
      { value: "endebess", label: "Endebess" },
      { value: "saboti", label: "Saboti" },
    ],
  },
  {
    value: "turkana",
    label: "Turkana",
    lat: 3.12,
    lng: 35.60,
    areas: [
      { value: "lodwar", label: "Lodwar" },
      { value: "kakuma", label: "Kakuma" },
      { value: "lokichogio", label: "Lokichogio" },
      { value: "lokichar", label: "Lokichar" },
      { value: "kalokol", label: "Kalokol" },
    ],
  },
  {
    value: "uasin-gishu",
    label: "Uasin Gishu (Eldoret)",
    lat: 0.51,
    lng: 35.28,
    areas: [
      { value: "eldoret-cbd", label: "Eldoret CBD" },
      { value: "elgon-view", label: "Elgon View" },
      { value: "pioneer", label: "Pioneer" },
      { value: "langas", label: "Langas" },
      { value: "huruma", label: "Huruma" },
      { value: "kapsoya", label: "Kapsoya" },
      { value: "turbo", label: "Turbo" },
    ],
  },
  {
    value: "vihiga",
    label: "Vihiga",
    lat: 0.08,
    lng: 34.72,
    areas: [
      { value: "mbale", label: "Mbale" },
      { value: "chavakali", label: "Chavakali" },
      { value: "luanda", label: "Luanda" },
      { value: "majengo", label: "Majengo" },
      { value: "serem", label: "Serem" },
    ],
  },
  {
    value: "wajir",
    label: "Wajir",
    lat: 1.75,
    lng: 40.06,
    areas: [
      { value: "wajir-town", label: "Wajir Town" },
      { value: "habaswein", label: "Habaswein" },
      { value: "tarbaj", label: "Tarbaj" },
      { value: "eldas", label: "Eldas" },
      { value: "griftu", label: "Griftu" },
    ],
  },
  {
    value: "west-pokot",
    label: "West Pokot",
    lat: 1.24,
    lng: 35.12,
    areas: [
      { value: "kapenguria", label: "Kapenguria" },
      { value: "makutano", label: "Makutano" },
      { value: "chepareria", label: "Chepareria" },
      { value: "sigor", label: "Sigor" },
    ],
  },
];

/**
 * Normalizes any string representation of a Kenyan county to its standard form.
 * Handles "Tharaka Nithi", "tharaka-nithi", "tharaka nithi county", "eldoret", etc.
 */
export function normalizeCounty(input?: string | null): string {
  if (!input) return "Nairobi";
  const cleaned = input.toLowerCase().trim().replace(/county/i, "").trim().replace(/\s+/g, "-");

  // Alias lookup
  if (cleaned.includes("tharaka") || cleaned.includes("nithi")) return "Tharaka-Nithi";
  if (cleaned.includes("eldoret") || cleaned.includes("uasin")) return "Uasin Gishu (Eldoret)";
  if (cleaned.includes("marakwet") || cleaned.includes("elgeyo")) return "Elgeyo-Marakwet";
  if (cleaned.includes("taita") || cleaned.includes("taveta")) return "Taita-Taveta";
  if (cleaned.includes("homa")) return "Homa Bay";
  if (cleaned.includes("trans")) return "Trans Nzoia";
  if (cleaned.includes("pokot")) return "West Pokot";
  if (cleaned.includes("murang")) return "Murang'a";

  const found = KENYAN_COUNTIES.find(
    (c) => c.value === cleaned || c.label.toLowerCase() === input.toLowerCase().trim()
  );
  return found ? found.label : input.trim();
}

/**
 * Returns the display label for a county+area combination.
 * e.g. getLocationLabel("Tharaka-Nithi", "Chuka") → "Chuka, Tharaka-Nithi"
 */
export function getLocationLabel(countyValue?: string | null, areaValue?: string | null): string {
  if (!countyValue) return "Kenya";
  const normalizedCounty = normalizeCounty(countyValue);
  if (!areaValue) return normalizedCounty;

  const countyObj = KENYAN_COUNTIES.find(
    (c) => c.label.toLowerCase() === normalizedCounty.toLowerCase() || c.value === countyValue.toLowerCase()
  );
  if (!countyObj) return `${areaValue}, ${normalizedCounty}`;

  const areaObj = countyObj.areas.find(
    (a) => a.value.toLowerCase() === areaValue.toLowerCase() || a.label.toLowerCase() === areaValue.toLowerCase()
  );
  return areaObj ? `${areaObj.label}, ${countyObj.label}` : `${areaValue}, ${countyObj.label}`;
}

/**
 * Returns areas for a given county value or label.
 */
export function getAreasForCounty(countyInput?: string | null): KenyanArea[] {
  if (!countyInput) return [];
  const normalized = normalizeCounty(countyInput).toLowerCase();
  const county = KENYAN_COUNTIES.find(
    (c) => c.value === countyInput.toLowerCase() || c.label.toLowerCase() === normalized
  );
  return county?.areas ?? [];
}

/**
 * Calculates distance in kilometers between two GPS points using the Haversine formula.
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Finds the nearest Kenyan county and area from GPS coordinates using centroid distance.
 */
export function findNearestKenyanCounty(
  lat: number,
  lng: number
): { county: string; area: string; distanceKm: number } {
  let nearestCounty = KENYAN_COUNTIES[0];
  let minDistance = Infinity;

  for (const county of KENYAN_COUNTIES) {
    const dist = calculateDistanceKm(lat, lng, county.lat, county.lng);
    if (dist < minDistance) {
      minDistance = dist;
      nearestCounty = county;
    }
  }

  // Check if an area within that county has coordinates closer
  let bestArea = nearestCounty.areas[0]?.label || nearestCounty.label;
  let areaMinDist = Infinity;
  for (const a of nearestCounty.areas) {
    if (a.lat !== undefined && a.lng !== undefined) {
      const aDist = calculateDistanceKm(lat, lng, a.lat, a.lng);
      if (aDist < areaMinDist) {
        areaMinDist = aDist;
        bestArea = a.label;
      }
    }
  }

  return {
    county: nearestCounty.label,
    area: bestArea,
    distanceKm: minDistance,
  };
}
