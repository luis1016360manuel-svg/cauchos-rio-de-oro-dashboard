import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const dataset = [
  {"medida": "155/R12", "marca_modelo": "VITOUR", "precio_venta": 60.0, "costo": 42.0, "rin": 12},
  {"medida": "165/65R13", "marca_modelo": "APLUS", "precio_venta": 50.0, "costo": 35.0, "rin": 13},
  {"medida": "165/65R13", "marca_modelo": "GALAXY", "precio_venta": 50.0, "costo": 35.0, "rin": 13},
  {"medida": "165/65R14", "marca_modelo": "KUMHO", "precio_venta": 55.0, "costo": 38.5, "rin": 14},
  {"medida": "165/70R13", "marca_modelo": "NEXEN NPR", "precio_venta": 65.0, "costo": 45.5, "rin": 13},
  {"medida": "165/70R13", "marca_modelo": "KUMHO", "precio_venta": 65.0, "costo": 45.5, "rin": 13},
  {"medida": "175/70R13", "marca_modelo": "TOURADOR", "precio_venta": 60.0, "costo": 42.0, "rin": 13},
  {"medida": "175/70R13", "marca_modelo": "NEXEN", "precio_venta": 65.0, "costo": 45.5, "rin": 13},
  {"medida": "175/70R13", "marca_modelo": "BLACK EAGLE", "precio_venta": 75.0, "costo": 52.5, "rin": 13},
  {"medida": "175/70R13", "marca_modelo": "GALAXY", "precio_venta": 60.0, "costo": 42.0, "rin": 13},
  {"medida": "175/65R14", "marca_modelo": "NEXEN NPR", "precio_venta": 70.0, "costo": 49.0, "rin": 14},
  {"medida": "175/65R14", "marca_modelo": "VITOUR TEMPESTAD", "precio_venta": 65.0, "costo": 45.5, "rin": 14},
  {"medida": "175/65R14", "marca_modelo": "GENERAL", "precio_venta": 80.0, "costo": 56.0, "rin": 14},
  {"medida": "175/65R14", "marca_modelo": "KUMHO", "precio_venta": 70.0, "costo": 49.0, "rin": 14},
  {"medida": "185/55R15", "marca_modelo": "KUMHO", "precio_venta": 85.0, "costo": 59.5, "rin": 15},
  {"medida": "185/60R13", "marca_modelo": "ILINK", "precio_venta": 80.0, "costo": 56.0, "rin": 13},
  {"medida": "185/60R14", "marca_modelo": "VITOUR", "precio_venta": 70.0, "costo": 49.0, "rin": 14},
  {"medida": "185/60R14", "marca_modelo": "KUMHO", "precio_venta": 70.0, "costo": 49.0, "rin": 14},
  {"medida": "185/60R14", "marca_modelo": "NEXEN NFERA", "precio_venta": 75.0, "costo": 52.5, "rin": 14},
  {"medida": "185/60R14", "marca_modelo": "GENERAL G MAX", "precio_venta": 95.0, "costo": 66.5, "rin": 14},
  {"medida": "185/65R14", "marca_modelo": "CONTINENTAL", "precio_venta": 100.0, "costo": 70.0, "rin": 14},
  {"medida": "185/65R14", "marca_modelo": "APLUS", "precio_venta": 65.0, "costo": 45.5, "rin": 14},
  {"medida": "185/65R14", "marca_modelo": "FORMULA", "precio_venta": 70.0, "costo": 49.0, "rin": 14},
  {"medida": "185/65R14", "marca_modelo": "GALAXY", "precio_venta": 60.0, "costo": 42.0, "rin": 14},
  {"medida": "185/65R15", "marca_modelo": "KUMHO ES31", "precio_venta": 90.0, "costo": 63.0, "rin": 15},
  {"medida": "185/65R15", "marca_modelo": "VITOUR TEMPESTAD", "precio_venta": 85.0, "costo": 59.5, "rin": 15},
  {"medida": "185/70R14", "marca_modelo": "VITOUR", "precio_venta": 75.0, "costo": 52.5, "rin": 14},
  {"medida": "195/50R15", "marca_modelo": "NEXEN NFERA PRIMUS", "precio_venta": 90.0, "costo": 63.0, "rin": 15},
  {"medida": "195/50R16", "marca_modelo": "KUMHO", "precio_venta": 100.0, "costo": 70.0, "rin": 16},
  {"medida": "195/55R15", "marca_modelo": "NEXEN", "precio_venta": 80.0, "costo": 56.0, "rin": 15},
  {"medida": "195/55R15", "marca_modelo": "CONTINENTAL", "precio_venta": 100.0, "costo": 70.0, "rin": 15},
  {"medida": "195/55R15", "marca_modelo": "VITOUR", "precio_venta": 85.0, "costo": 59.5, "rin": 15},
  {"medida": "195/55R16", "marca_modelo": "RADAR DMAX", "precio_venta": 100.0, "costo": 70.0, "rin": 16},
  {"medida": "195/60R13", "marca_modelo": "PNEUS", "precio_venta": 85.0, "costo": 59.5, "rin": 13},
  {"medida": "195/60R15", "marca_modelo": "NEXEN NPRIZ", "precio_venta": 85.0, "costo": 59.5, "rin": 15},
  {"medida": "195/60R15", "marca_modelo": "BLACK EAGLE", "precio_venta": 110.0, "costo": 77.0, "rin": 15},
  {"medida": "195/60R15", "marca_modelo": "CONTINENTAL", "precio_venta": 115.0, "costo": 80.5, "rin": 15},
  {"medida": "195/60R15", "marca_modelo": "YOKOHAMA", "precio_venta": 100.0, "costo": 70.0, "rin": 15},
  {"medida": "195/60R15", "marca_modelo": "KUMHO", "precio_venta": 80.0, "costo": 56.0, "rin": 15},
  {"medida": "195/60R15", "marca_modelo": "RADAR F-MAX", "precio_venta": 90.0, "costo": 63.0, "rin": 15},
  {"medida": "195/60R15", "marca_modelo": "RADAR MP800", "precio_venta": 80.0, "costo": 56.0, "rin": 15},
  {"medida": "195/60R15", "marca_modelo": "FORMULA", "precio_venta": 80.0, "costo": 56.0, "rin": 15},
  {"medida": "195/60R15", "marca_modelo": "GENERAL G-MAX", "precio_venta": 100.0, "costo": 70.0, "rin": 15},
  {"medida": "195R15C", "marca_modelo": "NEXEN", "precio_venta": 120.0, "costo": 84.0, "rin": 15},
  {"medida": "195/65R15", "marca_modelo": "GALAXY", "precio_venta": 80.0, "costo": 56.0, "rin": 15},
  {"medida": "195/65R15", "marca_modelo": "NEXEN NPRIZ", "precio_venta": 90.0, "costo": 63.0, "rin": 15},
  {"medida": "195/65R15", "marca_modelo": "GENERAL XP7", "precio_venta": 110.0, "costo": 77.0, "rin": 15},
  {"medida": "195/65R15", "marca_modelo": "CONTINENTAL", "precio_venta": 115.0, "costo": 80.5, "rin": 15},
  {"medida": "195/65R15", "marca_modelo": "KUMHO ES 31", "precio_venta": 80.0, "costo": 56.0, "rin": 15},
  {"medida": "195/60R16", "marca_modelo": "FORMULA", "precio_venta": 100.0, "costo": 70.0, "rin": 16},
  {"medida": "205/50R17", "marca_modelo": "KUMHO ES 31", "precio_venta": 140.0, "costo": 98.0, "rin": 17},
  {"medida": "205/55R15", "marca_modelo": "NEXEN", "precio_venta": 95.0, "costo": 66.5, "rin": 15},
  {"medida": "205/55R16", "marca_modelo": "GENERAL G MAX", "precio_venta": 120.0, "costo": 84.0, "rin": 16},
  {"medida": "205/55R16", "marca_modelo": "RADAR RUN FLAT", "precio_venta": 135.0, "costo": 94.5, "rin": 16},
  {"medida": "205/55R16", "marca_modelo": "KUMHO", "precio_venta": 90.0, "costo": 63.0, "rin": 16},
  {"medida": "205/55R16", "marca_modelo": "VITOUR", "precio_venta": 95.0, "costo": 66.5, "rin": 16},
  {"medida": "205/55R16", "marca_modelo": "RADAR D-MAX", "precio_venta": 100.0, "costo": 70.0, "rin": 16},
  {"medida": "205/55R16", "marca_modelo": "PNEUS", "precio_venta": 100.0, "costo": 70.0, "rin": 16},
  {"medida": "205/55R16", "marca_modelo": "NEXEN", "precio_venta": 100.0, "costo": 70.0, "rin": 16},
  {"medida": "205/55R16", "marca_modelo": "CONTINENTAL", "precio_venta": 125.0, "costo": 87.5, "rin": 16},
  {"medida": "205/60R15", "marca_modelo": "NEXEN NFERA", "precio_venta": 95.0, "costo": 66.5, "rin": 15},
  {"medida": "205/60R16", "marca_modelo": "CONTINENTAL", "precio_venta": 140.0, "costo": 98.0, "rin": 16},
  {"medida": "205/60R16", "marca_modelo": "NEXEN NFERA", "precio_venta": 110.0, "costo": 77.0, "rin": 16},
  {"medida": "205/65R15", "marca_modelo": "GENERAL XP7", "precio_venta": 120.0, "costo": 84.0, "rin": 15},
  {"medida": "205/70R15", "marca_modelo": "VITOUR ALL", "precio_venta": 120.0, "costo": 84.0, "rin": 15},
  {"medida": "205/70R15", "marca_modelo": "KUMHO TA21", "precio_venta": 110.0, "costo": 77.0, "rin": 15},
  {"medida": "205/70R15", "marca_modelo": "NEXEN", "precio_venta": 110.0, "costo": 77.0, "rin": 15},
  {"medida": "205/70R15", "marca_modelo": "APLUS", "precio_venta": 95.0, "costo": 66.5, "rin": 15},
  {"medida": "215/40R17", "marca_modelo": "TOLEDO", "precio_venta": 75.0, "costo": 52.5, "rin": 17},
  {"medida": "215/45R17", "marca_modelo": "ANDER TIRE", "precio_venta": 110.0, "costo": 77.0, "rin": 17},
  {"medida": "215/45R17", "marca_modelo": "GREENTRACK", "precio_venta": 100.0, "costo": 70.0, "rin": 17},
  {"medida": "215/55R17", "marca_modelo": "APLUS", "precio_venta": 105.0, "costo": 73.5, "rin": 17},
  {"medida": "215/50R17", "marca_modelo": "NEXEN", "precio_venta": 125.0, "costo": 87.5, "rin": 17},
  {"medida": "215/55R16", "marca_modelo": "NEXEN", "precio_venta": 95.0, "costo": 66.5, "rin": 16},
  {"medida": "215/55R18", "marca_modelo": "NEXEN", "precio_venta": 130.0, "costo": 91.0, "rin": 18},
  {"medida": "215/55R18", "marca_modelo": "VITOUR TEMPESTAD", "precio_venta": 130.0, "costo": 91.0, "rin": 18},
  {"medida": "215/60R16", "marca_modelo": "NEXEN NPN", "precio_venta": 120.0, "costo": 84.0, "rin": 16},
  {"medida": "215/60R16", "marca_modelo": "CONTINENTAL", "precio_venta": 140.0, "costo": 98.0, "rin": 16},
  {"medida": "215/60R17", "marca_modelo": "GENERAL", "precio_venta": 140.0, "costo": 98.0, "rin": 17},
  {"medida": "215/60R17", "marca_modelo": "CONTINENTAL  Contac 2", "precio_venta": 160.0, "costo": 112.0, "rin": 17},
  {"medida": "215/65R16", "marca_modelo": "GENERAL", "precio_venta": 140.0, "costo": 98.0, "rin": 16},
  {"medida": "215/65R16", "marca_modelo": "GALAXY", "precio_venta": 110.0, "costo": 77.0, "rin": 16},
  {"medida": "215/65R16", "marca_modelo": "KUMHO TA31", "precio_venta": 120.0, "costo": 84.0, "rin": 16},
  {"medida": "215/65R16", "marca_modelo": "KUMHO ES31", "precio_venta": 110.0, "costo": 77.0, "rin": 16},
  {"medida": "215/65R16", "marca_modelo": "ANDER TIRE", "precio_venta": 120.0, "costo": 84.0, "rin": 16},
  {"medida": "215/65R16", "marca_modelo": "NEXEN", "precio_venta": 110.0, "costo": 77.0, "rin": 16},
  {"medida": "225/45R17", "marca_modelo": "GENERAL GMAX", "precio_venta": 145.0, "costo": 101.5, "rin": 17},
  {"medida": "225/40R18", "marca_modelo": "VITOUR", "precio_venta": 130.0, "costo": 91.0, "rin": 18},
  {"medida": "225/45R18", "marca_modelo": "NEXEN", "precio_venta": 145.0, "costo": 101.5, "rin": 18},
  {"medida": "225/45R18", "marca_modelo": "RADAR", "precio_venta": 140.0, "costo": 98.0, "rin": 18},
  {"medida": "225/50R17", "marca_modelo": "KUMHO", "precio_venta": 135.0, "costo": 94.5, "rin": 17},
  {"medida": "225/50R17", "marca_modelo": "APLUS", "precio_venta": 110.0, "costo": 77.0, "rin": 17},
  {"medida": "225/50R17", "marca_modelo": "RADAR RUN FLAT", "precio_venta": 175.0, "costo": 122.5, "rin": 17},
  {"medida": "225/50R17", "marca_modelo": "NEXEN", "precio_venta": 130.0, "costo": 91.0, "rin": 17},
  {"medida": "225/50R17", "marca_modelo": "VITOUR GALAXY", "precio_venta": 110.0, "costo": 77.0, "rin": 17},
  {"medida": "225/50R17", "marca_modelo": "VITOUR FORMULA", "precio_venta": 120.0, "costo": 84.0, "rin": 17},
  {"medida": "225/55R16", "marca_modelo": "NEXEN", "precio_venta": 125.0, "costo": 87.5, "rin": 16},
  {"medida": "225/55R17", "marca_modelo": "HANKOOK K415", "precio_venta": 130.0, "costo": 91.0, "rin": 17},
  {"medida": "225/60R17", "marca_modelo": "PIRELLI SCORPION VERDE", "precio_venta": 140.0, "costo": 98.0, "rin": 17},
  {"medida": "225/65R17", "marca_modelo": "VITOUR QUATRO", "precio_venta": 130.0, "costo": 91.0, "rin": 17},
  {"medida": "225/65R17", "marca_modelo": "HAIDA", "precio_venta": 110.0, "costo": 77.0, "rin": 17},
  {"medida": "225/65R17", "marca_modelo": "GENERAL", "precio_venta": 160.0, "costo": 112.0, "rin": 17},
  {"medida": "225/65R17", "marca_modelo": "NEXEN", "precio_venta": 140.0, "costo": 98.0, "rin": 17},
  {"medida": "225/70R15", "marca_modelo": "GENERAL ATX", "precio_venta": 165.0, "costo": 115.5, "rin": 15},
  {"medida": "235/55R19", "marca_modelo": "RADAR", "precio_venta": 165.0, "costo": 115.5, "rin": 19},
  {"medida": "235/60R15", "marca_modelo": "VITOUR ALL", "precio_venta": 150.0, "costo": 105.0, "rin": 15},
  {"medida": "235/60R15", "marca_modelo": "COMFORSER", "precio_venta": 110.0, "costo": 77.0, "rin": 15},
  {"medida": "235/60R16", "marca_modelo": "BLACK EAGLE", "precio_venta": 120.0, "costo": 84.0, "rin": 16},
  {"medida": "235/60R16", "marca_modelo": "KUMHO TA51", "precio_venta": 120.0, "costo": 84.0, "rin": 16},
  {"medida": "235/60R17", "marca_modelo": "GENERAL", "precio_venta": 145.0, "costo": 101.5, "rin": 17},
  {"medida": "235/60R17", "marca_modelo": "TRIANGLE", "precio_venta": 130.0, "costo": 91.0, "rin": 17},
  {"medida": "235/60R18", "marca_modelo": "RADAR", "precio_venta": 160.0, "costo": 112.0, "rin": 18},
  {"medida": "235/65R17", "marca_modelo": "FORMULA", "precio_venta": 140.0, "costo": 98.0, "rin": 17},
  {"medida": "235/70R16", "marca_modelo": "PIRELLI HT", "precio_venta": 170.0, "costo": 119.0, "rin": 16},
  {"medida": "235/75R15", "marca_modelo": "ROADCRUZA RA", "precio_venta": 145.0, "costo": 101.5, "rin": 15},
  {"medida": "235/75R15", "marca_modelo": "FUJISAKI FJ02", "precio_venta": 125.0, "costo": 87.5, "rin": 15},
  {"medida": "235/75R15", "marca_modelo": "ARDUZZA", "precio_venta": 95.0, "costo": 66.5, "rin": 15},
  {"medida": "245/60R18", "marca_modelo": "KUMHO MP71", "precio_venta": 200.0, "costo": 140.0, "rin": 18},
  {"medida": "245/65R17", "marca_modelo": "TOURADOR", "precio_venta": 130.0, "costo": 91.0, "rin": 17},
  {"medida": "245/65R17", "marca_modelo": "KUMHO AT52", "precio_venta": 180.0, "costo": 126.0, "rin": 17},
  {"medida": "245/65R17", "marca_modelo": "FUJISAKI", "precio_venta": 150.0, "costo": 105.0, "rin": 17},
  {"medida": "245/70R16", "marca_modelo": "GENERAL HTS", "precio_venta": 170.0, "costo": 119.0, "rin": 16},
  {"medida": "245/75R16", "marca_modelo": "NEXEN ATLT", "precio_venta": 190.0, "costo": 133.0, "rin": 16},
  {"medida": "245/75R17", "marca_modelo": "KUMHO AT52", "precio_venta": 215.0, "costo": 150.5, "rin": 17},
  {"medida": "255/55R18", "marca_modelo": "HANKOOK", "precio_venta": 225.0, "costo": 157.5, "rin": 18},
  {"medida": "255/70R16", "marca_modelo": "KUMHO AT52", "precio_venta": 180.0, "costo": 126.0, "rin": 16},
  {"medida": "265/50R20", "marca_modelo": "VITOUR CALLE", "precio_venta": 200.0, "costo": 140.0, "rin": 20},
  {"medida": "265/60R18", "marca_modelo": "VITOUR ALL", "precio_venta": 180.0, "costo": 126.0, "rin": 18},
  {"medida": "265/60R18", "marca_modelo": "HANKOOK", "precio_venta": 200.0, "costo": 140.0, "rin": 18},
  {"medida": "265/60R18", "marca_modelo": "FALKEN", "precio_venta": 295.0, "costo": 206.5, "rin": 18},
  {"medida": "265/60R18", "marca_modelo": "RADAR", "precio_venta": 180.0, "costo": 126.0, "rin": 18},
  {"medida": "265/60R18", "marca_modelo": "KUMHO AT52", "precio_venta": 200.0, "costo": 140.0, "rin": 18},
  {"medida": "265/65R17", "marca_modelo": "KUMHO AT52", "precio_venta": 215.0, "costo": 150.5, "rin": 17},
  {"medida": "265/65R17", "marca_modelo": "CONTINENTAL LX25", "precio_venta": 220.0, "costo": 154.0, "rin": 17},
  {"medida": "265/65R17", "marca_modelo": "FALKEN", "precio_venta": 310.0, "costo": 217.0, "rin": 17},
  {"medida": "265/65R18", "marca_modelo": "KUMHO AT52", "precio_venta": 220.0, "costo": 154.0, "rin": 18},
  {"medida": "265/70R16", "marca_modelo": "HANKOOK AT", "precio_venta": 195.0, "costo": 136.5, "rin": 16},
  {"medida": "265/70R16", "marca_modelo": "KUMHO AT52", "precio_venta": 190.0, "costo": 133.0, "rin": 16},
  {"medida": "265/70R16", "marca_modelo": "MIRAGE", "precio_venta": 170.0, "costo": 119.0, "rin": 16},
  {"medida": "265/70R17", "marca_modelo": "VITOUR RT", "precio_venta": 225.0, "costo": 157.5, "rin": 17},
  {"medida": "265/70R17", "marca_modelo": "VITOUR A/TX20", "precio_venta": 225.0, "costo": 157.5, "rin": 17},
  {"medida": "265/75R16", "marca_modelo": "KUMHO AT52", "precio_venta": 195.0, "costo": 136.5, "rin": 16},
  {"medida": "265/70R18", "marca_modelo": "MICHELIN", "precio_venta": 150.0, "costo": 105.0, "rin": 18},
  {"medida": "275/45R20", "marca_modelo": "COMPASAL", "precio_venta": 145.0, "costo": 101.5, "rin": 20},
  {"medida": "275/45R20", "marca_modelo": "FORMULA", "precio_venta": 165.0, "costo": 115.5, "rin": 20},
  {"medida": "275/45R21", "marca_modelo": "VITOUR TEMPESTAD", "precio_venta": 200.0, "costo": 140.0, "rin": 21},
  {"medida": "275/55R20", "marca_modelo": "KUMHO MP71", "precio_venta": 260.0, "costo": 182.0, "rin": 20},
  {"medida": "285/60R18", "marca_modelo": "HANKOOK", "precio_venta": 260.0, "costo": 182.0, "rin": 18},
  {"medida": "285/70R17", "marca_modelo": "KUMHO AT52", "precio_venta": 250.0, "costo": 175.0, "rin": 17},
  {"medida": "285/70R17", "marca_modelo": "ROADCRUZA 1100", "precio_venta": 195.0, "costo": 136.5, "rin": 17},
  {"medida": "285/75R16", "marca_modelo": "ROADCRUZA", "precio_venta": 195.0, "costo": 136.5, "rin": 16},
  {"medida": "7.50R16", "marca_modelo": "ANDER TIRE", "precio_venta": 150.0, "costo": 105.0, "rin": 16},
  {"medida": "31x10.50R15", "marca_modelo": "GENERAL ATX", "precio_venta": 200.0, "costo": 140.0, "rin": 15}
];

async function run() {
  console.log(`Starting to seed ${dataset.length} items...`);
  const now = new Date().toISOString();

  // Create formatted objects
  const insertData = dataset.map((item, idx) => ({
    id: `ITEM-SEED-${Date.now()}-${idx}`,
    brand: item.marca_modelo,
    model: '', // Left blank as the brand string contains both
    size: item.medida,
    rim: item.rin,
    unitCost: item.costo,
    sellingPrice: item.precio_venta,
    quantity: 0, // Default stock as requested
    createdAt: now
  }));

  const { data, error } = await supabase
    .from('inventory_items')
    .insert(insertData);

  if (error) {
    console.error('Error inserting data:', error);
  } else {
    console.log('Successfully seeded 153 tires into inventory_items!');
  }
}

run();
