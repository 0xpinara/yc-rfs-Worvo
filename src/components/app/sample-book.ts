// Sample book: synthetic, realistic data for the demo's Invoices and Prices pages.
// Twenty fictional service businesses, each with its own price list, customers and recent invoices.
// It never feeds live pricing: real invoices are priced only from src/server/invoices/catalog.ts.
// Every business, person and email here is made up (emails use reserved example domains).

export type PriceEntry = { name: string; cents: number; per: string };

export type SampleLine = {
  description: string;
  quantity: number;
  unit: "minute" | "each";
  rateCents: number;
};

export type SampleStatus = "paid" | "sent" | "ready" | "question";

export type SampleInvoice = {
  number: string;
  date: string; // YYYY-MM-DD
  customer: string;
  said: string; // what the worker told the band
  status: SampleStatus;
  lines: SampleLine[];
  question?: string; // set when status is "question"
};

export type SampleBusiness = {
  id: string;
  trade: string;
  name: string;
  owner: string;
  city: string;
  labor: PriceEntry | null;
  services: PriceEntry[];
  parts: PriceEntry[];
  customers: { name: string; email: string }[];
  daysUntilDue: number;
  invoices: SampleInvoice[];
};

const usd = (dollars: number) => Math.round(dollars * 100);
const price = (name: string, dollars: number, per = "each"): PriceEntry => ({ name, cents: usd(dollars), per });
const work = (labor: PriceEntry, minutes: number): SampleLine => ({
  description: labor.name,
  quantity: minutes,
  unit: "minute",
  rateCents: labor.cents,
});
const item = (entry: PriceEntry, quantity = 1): SampleLine => ({
  description: entry.name,
  quantity,
  unit: "each",
  rateCents: entry.cents,
});

/** Same rule as the server: labor billed per minute, rounded half-up once to whole cents. */
export function lineCents(line: SampleLine): number {
  return line.unit === "minute" ? Math.floor((line.quantity * line.rateCents + 30) / 60) : line.quantity * line.rateCents;
}

export function invoiceCents(invoice: SampleInvoice): number {
  return invoice.lines.reduce((sum, line) => sum + lineCents(line), 0);
}

// ---------- Plumbing ----------
const plumbLabor = price("Labor", 135, "hour");
const plumbCall = price("Service call", 79, "visit");
const heaterFlush = price("Water heater flush", 149, "visit");
const mainLine = price("Drain clearing (main line)", 225, "job");
const shutoff = price("Shutoff valve", 22.5);
const pTrap = price("P-trap kit", 18);
const waxRing = price("Wax ring", 12);
const fillValve = price("Toilet fill valve", 24);

// ---------- Electrical ----------
const elecLabor = price("Labor", 140, "hour");
const elecCall = price("Service call", 95, "visit");
const panelCheck = price("Panel inspection", 175, "visit");
const permit = price("Permit fee", 85, "permit");
const gfci = price("GFCI outlet", 28);
const breaker = price("20A breaker", 34);
const recessed = price("LED recessed light", 42);
const evKit = price("EV charger install kit", 210, "kit");

// ---------- HVAC ----------
const hvacLabor = price("Labor", 145, "hour");
const hvacCall = price("Service call", 89, "visit");
const tuneUp = price("AC tune-up", 129, "unit");
const furnaceCheck = price("Furnace safety check", 119, "unit");
const capacitor = price("Run capacitor", 65);
const refrigerant = price("R-410A refrigerant", 95, "lb");
const filter = price("Air filter (16x25)", 24);
const condensatePump = price("Condensate pump", 139);

// ---------- Handyman ----------
const handyLabor = price("Labor", 85, "hour");
const tripCharge = price("Trip charge", 45, "visit");
const tvMount = price("TV wall mount install", 129, "TV");
const patchKit = price("Drywall patch kit", 24);
const hingeSet = price("Door hinge set", 14);
const cabinetHardware = price("Cabinet hardware pack", 36);
const caulk = price("Caulk & sealant", 11);

// ---------- Appliance repair ----------
const applianceLabor = price("Labor", 115, "hour");
const diagnosticVisit = price("Diagnostic visit", 95, "visit");
const dryerBelt = price("Dryer belt", 38);
const drainPump = price("Washer drain pump", 86);
const doorGasket = price("Dishwasher door gasket", 44);
const defrostThermostat = price("Fridge defrost thermostat", 52);

// ---------- Locksmith ----------
const lockLabor = price("Labor", 95, "hour");
const lockCall = price("Service call", 65, "visit");
const lockout = price("Lockout (after hours)", 150, "call");
const rekey = price("Rekey", 25, "cylinder");
const deadbolt = price("Deadbolt (grade 1)", 59);
const keypadDeadbolt = price("Keypad deadbolt", 149);
const keyCopy = price("Key copy", 4.5);

// ---------- Auto repair ----------
const autoLabor = price("Labor", 145, "hour");
const scan = price("Diagnostic scan", 120, "vehicle");
const oilChange = price("Synthetic oil change", 89, "vehicle");
const rotation = price("Tire rotation", 35, "vehicle");
const brakePads = price("Front brake pads", 89, "set");
const rotor = price("Brake rotor", 78);
const cabinFilter = price("Cabin air filter", 32);
const serpentine = price("Serpentine belt", 54);

// ---------- Mobile mechanic ----------
const mobileLabor = price("Labor", 125, "hour");
const travelFee = price("Travel fee", 49, "visit");
const batteryTest = price("Battery test", 25, "vehicle");
const battery = price("Car battery (H6)", 189);
const starter = price("Starter motor (reman)", 165);
const wipers = price("Wiper blades", 34, "pair");

// ---------- Car detailing ----------
const sedanDetail = price("Full detail (sedan)", 229, "car");
const suvDetail = price("Full detail (SUV)", 269, "car");
const interior = price("Interior refresh", 149, "car");
const ceramic = price("Ceramic coating", 499, "car");
const petHair = price("Pet hair removal", 45, "car");
const headlights = price("Headlight restoration", 79, "pair");

// ---------- Dog walking ----------
const walk30 = price("30-min walk", 25, "walk");
const walk60 = price("60-min walk", 40, "walk");
const dropIn = price("Drop-in visit", 22, "visit");
const holiday = price("Holiday surcharge", 10, "day");

// ---------- Pet grooming ----------
const groomSmall = price("Full groom (small dog)", 75, "dog");
const groomLarge = price("Full groom (large dog)", 110, "dog");
const bath = price("Bath & brush", 55, "dog");
const nails = price("Nail trim", 18, "dog");
const deShed = price("De-shedding treatment", 35, "dog");

// ---------- House cleaning ----------
const cleanTime = price("Cleaning time", 55, "hour");
const standardClean = price("Standard clean (2-bed)", 160, "visit");
const deepClean = price("Deep clean (3-bed)", 320, "visit");
const moveOut = price("Move-out clean", 380, "visit");
const fridge = price("Inside fridge", 35);
const oven = price("Inside oven", 40);

// ---------- Landscaping ----------
const crewLabor = price("Crew labor", 75, "hour");
const mow = price("Weekly mow & edge", 55, "visit");
const hedges = price("Hedge trimming", 120, "visit");
const haulAway = price("Yard waste haul-away", 65, "load");
const mulch = price("Mulch", 58, "cubic yard");
const shrub = price("Shrub (5 gal)", 34);
const sprinkler = price("Sprinkler head", 9);

// ---------- Pool service ----------
const poolWeekly = price("Weekly pool service", 45, "visit");
const filterClean = price("Filter clean", 95, "visit");
const greenToClean = price("Green-to-clean treatment", 275, "pool");
const chlorine = price("Chlorine tabs (25 lb)", 89, "bucket");
const shock = price("Pool shock (4-pack)", 32, "pack");

// ---------- Pest control ----------
const pestGeneral = price("General pest treatment", 135, "visit");
const termite = price("Termite inspection", 95, "home");
const baitStation = price("Rodent bait station", 28);
const followUp = price("Follow-up visit", 65, "visit");

// ---------- Painting ----------
const paintLabor = price("Labor", 65, "hour");
const consult = price("Color consultation", 75, "visit");
const paint = price("Premium paint", 62, "gallon");
const primer = price("Primer", 38, "gallon");
const supplies = price("Supplies & tape", 35, "job");

// ---------- Moving ----------
const moveCrew = price("Crew (2 movers)", 140, "hour");
const truck = price("Truck fee", 95, "move");
const piano = price("Piano handling", 150, "piano");
const boxes = price("Moving box", 3.5);
const mattressBag = price("Mattress bag", 12);

// ---------- Computer repair ----------
const techLabor = price("Labor", 110, "hour");
const pcDiagnostic = price("Diagnostic", 79, "device");
const dataTransfer = price("Data transfer", 60, "device");
const virus = price("Virus removal", 99, "device");
const ssd = price("1TB SSD", 89);
const laptopBattery = price("Laptop battery", 109);
const ram = price("8GB RAM module", 39);

// ---------- Window cleaning ----------
const windowPane = price("Window (inside & out)", 9, "window");
const screens = price("Screen cleaning", 3, "screen");
const tracks = price("Track & sill detail", 4, "window");

// ---------- Bike repair ----------
const bikeLabor = price("Labor", 80, "hour");
const bikeTune = price("Standard tune-up", 85, "bike");
const flatFix = price("Flat fix", 20, "wheel");
const tube = price("Inner tube", 12);
const bikePads = price("Brake pads", 18, "pair");
const chain = price("Chain", 34);

export const SAMPLE_BOOK: SampleBusiness[] = [
  {
    id: "rivera-plumbing",
    trade: "Plumbing",
    name: "Rivera Plumbing & Drain",
    owner: "Luis Rivera",
    city: "Oakland, CA",
    labor: plumbLabor,
    services: [plumbCall, heaterFlush, mainLine],
    parts: [shutoff, pTrap, waxRing, fillValve],
    customers: [
      { name: "Bluebird Bakery", email: "billing@bluebirdbakery.example.com" },
      { name: "Dana Whitfield", email: "dana.whitfield@example.com" },
      { name: "Marlow Apartments", email: "manager@marlowapts.example.com" },
    ],
    daysUntilDue: 14,
    invoices: [
      {
        number: "RPD-1042",
        date: "2026-11-13",
        customer: "Bluebird Bakery",
        said: "Bill Bluebird Bakery for the main line clearing this morning, an hour and a half of labor and a new P-trap under the prep sink.",
        status: "sent",
        lines: [item(mainLine), work(plumbLabor, 90), item(pTrap)],
      },
      {
        number: "RPD-1039",
        date: "2026-11-10",
        customer: "Dana Whitfield",
        said: "Invoice Dana Whitfield: service call, swapped the toilet fill valve and the wax ring, forty-five minutes.",
        status: "paid",
        lines: [item(plumbCall), item(fillValve), item(waxRing), work(plumbLabor, 45)],
      },
      {
        number: "RPD-1035",
        date: "2026-11-04",
        customer: "Marlow Apartments",
        said: "Marlow Apartments, unit 4B. Water heater flush and two shutoff valves at the standard price.",
        status: "paid",
        lines: [item(heaterFlush), item(shutoff, 2)],
      },
    ],
  },
  {
    id: "brightline-electric",
    trade: "Electrical",
    name: "Brightline Electric",
    owner: "Priya Natarajan",
    city: "San Jose, CA",
    labor: elecLabor,
    services: [elecCall, panelCheck, permit],
    parts: [gfci, breaker, recessed, evKit],
    customers: [
      { name: "Hollis & Pine Dental", email: "office@hollispine.example.com" },
      { name: "Mark Okafor", email: "mark.okafor@example.net" },
      { name: "Sunnyvale Self Storage", email: "ap@sunnyvalestorage.example.com" },
    ],
    daysUntilDue: 15,
    invoices: [
      {
        number: "BLE-2210",
        date: "2026-11-12",
        customer: "Mark Okafor",
        said: "Mark Okafor, EV charger circuit in the garage. Three hours, the install kit and the permit fee.",
        status: "sent",
        lines: [work(elecLabor, 180), item(evKit), item(permit)],
      },
      {
        number: "BLE-2207",
        date: "2026-11-08",
        customer: "Hollis & Pine Dental",
        said: "Hollis and Pine Dental: replaced four GFCI outlets in the operatories, an hour fifteen.",
        status: "paid",
        lines: [work(elecLabor, 75), item(gfci, 4)],
      },
      {
        number: "BLE-2203",
        date: "2026-11-02",
        customer: "Sunnyvale Self Storage",
        said: "Panel inspection for Sunnyvale Self Storage, and I swapped two twenty-amp breakers.",
        status: "paid",
        lines: [item(panelCheck), item(breaker, 2)],
      },
    ],
  },
  {
    id: "coolwell-hvac",
    trade: "HVAC",
    name: "Coolwell Heating & Air",
    owner: "Jordan Hayes",
    city: "Phoenix, AZ",
    labor: hvacLabor,
    services: [hvacCall, tuneUp, furnaceCheck],
    parts: [capacitor, refrigerant, filter, condensatePump],
    customers: [
      { name: "Elena Brooks", email: "elena.brooks@example.com" },
      { name: "Saguaro Family Clinic", email: "facilities@saguaroclinic.example.org" },
      { name: "Mesa Ridge HOA", email: "board@mesaridgehoa.example.org" },
    ],
    daysUntilDue: 10,
    invoices: [
      {
        number: "CWH-3318",
        date: "2026-11-14",
        customer: "Elena Brooks",
        said: "Elena Brooks, AC not cooling. Service call, new run capacitor, two pounds of refrigerant, forty minutes.",
        status: "ready",
        lines: [item(hvacCall), item(capacitor), item(refrigerant, 2), work(hvacLabor, 40)],
      },
      {
        number: "CWH-3311",
        date: "2026-11-06",
        customer: "Saguaro Family Clinic",
        said: "Saguaro Family Clinic, three AC tune-ups and three new sixteen-by-twenty-five filters.",
        status: "paid",
        lines: [item(tuneUp, 3), item(filter, 3)],
      },
      {
        number: "CWH-3302",
        date: "2026-10-29",
        customer: "Mesa Ridge HOA",
        said: "Mesa Ridge clubhouse: replaced the condensate pump, about an hour.",
        status: "paid",
        lines: [item(condensatePump), work(hvacLabor, 60)],
      },
    ],
  },
  {
    id: "harbor-handyman",
    trade: "Handyman",
    name: "Harbor Handyman Co.",
    owner: "Sam Whitaker",
    city: "Seattle, WA",
    labor: handyLabor,
    services: [tripCharge, tvMount],
    parts: [patchKit, hingeSet, cabinetHardware, caulk],
    customers: [
      { name: "Pike Street Books", email: "owner@pikestreetbooks.example.com" },
      { name: "Ana Lindqvist", email: "ana.lindqvist@example.com" },
      { name: "Rainier Rentals", email: "maintenance@rainierrentals.example.com" },
    ],
    daysUntilDue: 7,
    invoices: [
      {
        number: "HHC-0871",
        date: "2026-11-13",
        customer: "Pike Street Books",
        said: "Pike Street Books: patched two drywall holes and rehung the back door. Two hours, two patch kits, one hinge set.",
        status: "sent",
        lines: [work(handyLabor, 120), item(patchKit, 2), item(hingeSet)],
      },
      {
        number: "HHC-0866",
        date: "2026-11-07",
        customer: "Ana Lindqvist",
        said: "Ana Lindqvist, TV wall mount in the living room, plus the trip charge.",
        status: "paid",
        lines: [item(tvMount), item(tripCharge)],
      },
      {
        number: "HHC-0860",
        date: "2026-10-31",
        customer: "Rainier Rentals",
        said: "Rainier Rentals, unit twelve. Re-caulked the tub and swapped the kitchen cabinet hardware, ninety minutes.",
        status: "paid",
        lines: [work(handyLabor, 90), item(caulk), item(cabinetHardware)],
      },
    ],
  },
  {
    id: "spin-cycle-appliance",
    trade: "Appliance repair",
    name: "Spin Cycle Appliance Repair",
    owner: "Rosa Delgado",
    city: "Denver, CO",
    labor: applianceLabor,
    services: [diagnosticVisit],
    parts: [dryerBelt, drainPump, doorGasket, defrostThermostat],
    customers: [
      { name: "Highland Laundromat", email: "accounts@highlandlaundry.example.com" },
      { name: "Tom Kowalski", email: "tkowalski@example.net" },
      { name: "Maya Chen", email: "maya.chen@example.com" },
    ],
    daysUntilDue: 14,
    invoices: [
      {
        number: "SCA-5520",
        date: "2026-11-12",
        customer: "Highland Laundromat",
        said: "Highland Laundromat, machine six. Diagnostic, a new drain pump and one hour of labor.",
        status: "sent",
        lines: [item(diagnosticVisit), item(drainPump), work(applianceLabor, 60)],
      },
      {
        number: "SCA-5514",
        date: "2026-11-05",
        customer: "Tom Kowalski",
        said: "Tom Kowalski's dryer: replaced the belt, thirty minutes, plus the diagnostic.",
        status: "paid",
        lines: [item(diagnosticVisit), item(dryerBelt), work(applianceLabor, 30)],
      },
      {
        number: "SCA-5511",
        date: "2026-11-03",
        customer: "Maya Chen",
        said: "Maya Chen, fridge not defrosting. Diagnostic, and I swapped a part, I'll check which one.",
        status: "question",
        question: "Which part did you replace?",
        lines: [item(diagnosticVisit)],
      },
    ],
  },
  {
    id: "keyright-locksmith",
    trade: "Locksmith",
    name: "KeyRight Locksmith",
    owner: "Andre Fontaine",
    city: "Chicago, IL",
    labor: lockLabor,
    services: [lockCall, lockout, rekey],
    parts: [deadbolt, keypadDeadbolt, keyCopy],
    customers: [
      { name: "Lakeview Lofts", email: "leasing@lakeviewlofts.example.com" },
      { name: "Grace Mbeki", email: "grace.mbeki@example.org" },
      { name: "North Shore Pediatrics", email: "admin@northshorepeds.example.org" },
    ],
    daysUntilDue: 7,
    invoices: [
      {
        number: "KRL-4407",
        date: "2026-11-11",
        customer: "Lakeview Lofts",
        said: "Lakeview Lofts move-out: rekeyed six cylinders, twelve key copies, plus the service call.",
        status: "paid",
        lines: [item(lockCall), item(rekey, 6), item(keyCopy, 12)],
      },
      {
        number: "KRL-4403",
        date: "2026-11-09",
        customer: "Grace Mbeki",
        said: "Grace Mbeki, after-hours lockout, and she wanted a new grade one deadbolt.",
        status: "sent",
        lines: [item(lockout), item(deadbolt)],
      },
      {
        number: "KRL-4399",
        date: "2026-11-01",
        customer: "North Shore Pediatrics",
        said: "North Shore Pediatrics, keypad deadbolt on the staff door, forty-five minutes.",
        status: "paid",
        lines: [item(keypadDeadbolt), work(lockLabor, 45)],
      },
    ],
  },
  {
    id: "eastside-auto",
    trade: "Auto repair",
    name: "Eastside Auto Care",
    owner: "Mike Delaney",
    city: "Austin, TX",
    labor: autoLabor,
    services: [scan, oilChange, rotation],
    parts: [brakePads, rotor, cabinFilter, serpentine],
    customers: [
      { name: "Lone Star Florist", email: "orders@lonestarflorist.example.com" },
      { name: "Hannah Price", email: "hannah.price@example.com" },
      { name: "Carlos Mendez", email: "cmendez@example.net" },
    ],
    daysUntilDue: 0,
    invoices: [
      {
        number: "EAC-7781",
        date: "2026-11-14",
        customer: "Lone Star Florist",
        said: "Lone Star Florist van: front pads and both rotors, an hour and a half, and do the oil change too.",
        status: "ready",
        lines: [item(brakePads), item(rotor, 2), work(autoLabor, 90), item(oilChange)],
      },
      {
        number: "EAC-7774",
        date: "2026-11-10",
        customer: "Hannah Price",
        said: "Hannah Price, check engine light on the Civic. Diagnostic scan, new serpentine belt, forty minutes.",
        status: "sent",
        lines: [item(scan), item(serpentine), work(autoLabor, 40)],
      },
      {
        number: "EAC-7768",
        date: "2026-11-03",
        customer: "Carlos Mendez",
        said: "Carlos Mendez, F-150. Oil change, tire rotation and a cabin air filter.",
        status: "paid",
        lines: [item(oilChange), item(rotation), item(cabinFilter)],
      },
    ],
  },
  {
    id: "wrenchrunner-mobile",
    trade: "Mobile mechanic",
    name: "WrenchRunner Mobile Mechanic",
    owner: "Keisha Brown",
    city: "Atlanta, GA",
    labor: mobileLabor,
    services: [travelFee, batteryTest],
    parts: [battery, starter, wipers],
    customers: [
      { name: "Peachtree Couriers", email: "fleet@peachtreecouriers.example.com" },
      { name: "Derek Simmons", email: "derek.simmons@example.com" },
      { name: "Linda Osei", email: "linda.osei@example.org" },
    ],
    daysUntilDue: 7,
    invoices: [
      {
        number: "WMM-1209",
        date: "2026-11-13",
        customer: "Peachtree Couriers",
        said: "Peachtree Couriers, van two. Travel fee, a reman starter and two hours on site.",
        status: "sent",
        lines: [item(travelFee), item(starter), work(mobileLabor, 120)],
      },
      {
        number: "WMM-1204",
        date: "2026-11-08",
        customer: "Derek Simmons",
        said: "Derek Simmons in his office lot: travel, battery test, new H6 battery, twenty minutes.",
        status: "paid",
        lines: [item(travelFee), item(batteryTest), item(battery), work(mobileLabor, 20)],
      },
      {
        number: "WMM-1198",
        date: "2026-10-30",
        customer: "Linda Osei",
        said: "Linda Osei, new wiper blades and a battery test. No travel fee, she's on my route.",
        status: "paid",
        lines: [item(batteryTest), item(wipers)],
      },
    ],
  },
  {
    id: "mirror-finish-detailing",
    trade: "Car detailing",
    name: "Mirror Finish Mobile Detailing",
    owner: "Tony Reyes",
    city: "Los Angeles, CA",
    labor: null,
    services: [sedanDetail, suvDetail, interior, ceramic, petHair, headlights],
    parts: [],
    customers: [
      { name: "Westside Realty", email: "office@westsiderealty.example.com" },
      { name: "Jasmine Wu", email: "jasmine.wu@example.com" },
      { name: "Owen Gallagher", email: "owen.gallagher@example.net" },
    ],
    daysUntilDue: 0,
    invoices: [
      {
        number: "MFD-3021",
        date: "2026-11-12",
        customer: "Westside Realty",
        said: "Westside Realty: two full sedan details and one SUV for the agents' cars.",
        status: "sent",
        lines: [item(sedanDetail, 2), item(suvDetail)],
      },
      {
        number: "MFD-3017",
        date: "2026-11-06",
        customer: "Jasmine Wu",
        said: "Jasmine Wu, interior refresh with pet hair removal. Golden retriever, lots of hair.",
        status: "paid",
        lines: [item(interior), item(petHair)],
      },
      {
        number: "MFD-3012",
        date: "2026-10-28",
        customer: "Owen Gallagher",
        said: "Owen Gallagher, ceramic coating and headlight restoration.",
        status: "paid",
        lines: [item(ceramic), item(headlights)],
      },
    ],
  },
  {
    id: "happy-tails-walking",
    trade: "Dog walking",
    name: "Happy Tails Dog Walking",
    owner: "Mia Larson",
    city: "Portland, OR",
    labor: null,
    services: [walk30, walk60, dropIn, holiday],
    parts: [],
    customers: [
      { name: "The Nguyen family", email: "nguyen.family@example.com" },
      { name: "Ellie Morgan", email: "ellie.morgan@example.org" },
      { name: "Ben Adler", email: "ben.adler@example.net" },
    ],
    daysUntilDue: 7,
    invoices: [
      {
        number: "HTD-0652",
        date: "2026-11-14",
        customer: "The Nguyen family",
        said: "Bill the Nguyens for five thirty-minute walks for Biscuit this week, plus the holiday surcharge for Wednesday.",
        status: "ready",
        lines: [item(walk30, 5), item(holiday)],
      },
      {
        number: "HTD-0648",
        date: "2026-11-07",
        customer: "Ellie Morgan",
        said: "Ellie Morgan, Pepper and Moose: four hour-long walks and two drop-ins while she was away.",
        status: "paid",
        lines: [item(walk60, 4), item(dropIn, 2)],
      },
      {
        number: "HTD-0641",
        date: "2026-10-31",
        customer: "Ben Adler",
        said: "Ben Adler, Juno. Ten thirty-minute walks for the last two weeks.",
        status: "paid",
        lines: [item(walk30, 10)],
      },
    ],
  },
  {
    id: "suds-snips-grooming",
    trade: "Pet grooming",
    name: "Suds & Snips Mobile Grooming",
    owner: "Carmen Ortiz",
    city: "San Diego, CA",
    labor: null,
    services: [groomSmall, groomLarge, bath, nails, deShed],
    parts: [],
    customers: [
      { name: "Pacific Beach Pet Hotel", email: "frontdesk@pbpethotel.example.com" },
      { name: "David Shah", email: "david.shah@example.com" },
      { name: "Rachel Kim", email: "rachel.kim@example.org" },
    ],
    daysUntilDue: 0,
    invoices: [
      {
        number: "SSG-2290",
        date: "2026-11-13",
        customer: "Pacific Beach Pet Hotel",
        said: "Pacific Beach Pet Hotel: three bath and brush, and two nail trims.",
        status: "sent",
        lines: [item(bath, 3), item(nails, 2)],
      },
      {
        number: "SSG-2286",
        date: "2026-11-09",
        customer: "David Shah",
        said: "David Shah's Bruno: large dog full groom with the de-shedding treatment.",
        status: "paid",
        lines: [item(groomLarge), item(deShed)],
      },
      {
        number: "SSG-2281",
        date: "2026-11-02",
        customer: "Rachel Kim",
        said: "Mochi for Rachel Kim, small dog full groom and a nail trim.",
        status: "paid",
        lines: [item(groomSmall), item(nails)],
      },
    ],
  },
  {
    id: "fresh-nest-cleaning",
    trade: "House cleaning",
    name: "Fresh Nest Cleaning",
    owner: "Tasha Green",
    city: "Charlotte, NC",
    labor: cleanTime,
    services: [standardClean, deepClean, moveOut, fridge, oven],
    parts: [],
    customers: [
      { name: "Laura Bennett", email: "laura.bennett@example.com" },
      { name: "Queen City Coworking", email: "ops@queencitycowork.example.com" },
      { name: "Kevin O’Neil", email: "kevin.oneil@example.net" },
    ],
    daysUntilDue: 7,
    invoices: [
      {
        number: "FNC-1188",
        date: "2026-11-14",
        customer: "Laura Bennett",
        said: "Laura Bennett, deep clean on the three-bed, inside the oven and inside the fridge.",
        status: "sent",
        lines: [item(deepClean), item(oven), item(fridge)],
      },
      {
        number: "FNC-1181",
        date: "2026-11-10",
        customer: "Queen City Coworking",
        said: "Queen City Coworking, four hours of office cleaning after their event.",
        status: "paid",
        lines: [work(cleanTime, 240)],
      },
      {
        number: "FNC-1174",
        date: "2026-11-01",
        customer: "Kevin O’Neil",
        said: "Kevin O'Neil, move-out clean, and inside the fridge.",
        status: "paid",
        lines: [item(moveOut), item(fridge)],
      },
    ],
  },
  {
    id: "greenline-lawn",
    trade: "Landscaping",
    name: "Greenline Lawn & Garden",
    owner: "Diego Ramos",
    city: "Sacramento, CA",
    labor: crewLabor,
    services: [mow, hedges, haulAway],
    parts: [mulch, shrub, sprinkler],
    customers: [
      { name: "Capitol Park Apartments", email: "manager@capitolparkapts.example.com" },
      { name: "Sarah Lindgren", email: "sarah.lindgren@example.com" },
      { name: "Fair Oaks Library Friends", email: "friends@fairoakslibrary.example.org" },
    ],
    daysUntilDue: 14,
    invoices: [
      {
        number: "GLG-0907",
        date: "2026-11-12",
        customer: "Capitol Park Apartments",
        said: "Capitol Park: four weekly mows this month and one yard waste haul-away.",
        status: "sent",
        lines: [item(mow, 4), item(haulAway)],
      },
      {
        number: "GLG-0901",
        date: "2026-11-05",
        customer: "Sarah Lindgren",
        said: "Sarah Lindgren: spread three yards of mulch, planted four shrubs, three hours of crew time.",
        status: "paid",
        lines: [item(mulch, 3), item(shrub, 4), work(crewLabor, 180)],
      },
      {
        number: "GLG-0896",
        date: "2026-10-30",
        customer: "Fair Oaks Library Friends",
        said: "Fair Oaks library garden: replaced six sprinkler heads, forty-five minutes.",
        status: "paid",
        lines: [item(sprinkler, 6), work(crewLabor, 45)],
      },
    ],
  },
  {
    id: "clearwater-pool",
    trade: "Pool service",
    name: "Clearwater Pool Service",
    owner: "Grant Mills",
    city: "Orlando, FL",
    labor: null,
    services: [poolWeekly, filterClean, greenToClean],
    parts: [chlorine, shock],
    customers: [
      { name: "Lake Nona Villas HOA", email: "board@lakenonavillas.example.org" },
      { name: "The Patel family", email: "patel.home@example.com" },
      { name: "Sunrise Swim School", email: "hello@sunriseswim.example.com" },
    ],
    daysUntilDue: 10,
    invoices: [
      {
        number: "CPS-6614",
        date: "2026-11-11",
        customer: "Lake Nona Villas HOA",
        said: "Lake Nona Villas: four weekly services and one bucket of chlorine tabs.",
        status: "sent",
        lines: [item(poolWeekly, 4), item(chlorine)],
      },
      {
        number: "CPS-6609",
        date: "2026-11-07",
        customer: "The Patel family",
        said: "The Patels' pool went green after the storm. Green-to-clean and two packs of shock.",
        status: "paid",
        lines: [item(greenToClean), item(shock, 2)],
      },
      {
        number: "CPS-6602",
        date: "2026-10-29",
        customer: "Sunrise Swim School",
        said: "Sunrise Swim School, filter clean.",
        status: "paid",
        lines: [item(filterClean)],
      },
    ],
  },
  {
    id: "shield-pest",
    trade: "Pest control",
    name: "Shield Pest Control",
    owner: "Marcus Webb",
    city: "Houston, TX",
    labor: null,
    services: [pestGeneral, termite, followUp],
    parts: [baitStation],
    customers: [
      { name: "Bayou Burger Co.", email: "manager@bayouburger.example.com" },
      { name: "Angela Torres", email: "angela.torres@example.com" },
      { name: "Heights Montessori", email: "office@heightsmontessori.example.org" },
    ],
    daysUntilDue: 14,
    invoices: [
      {
        number: "SPC-3390",
        date: "2026-11-13",
        customer: "Bayou Burger Co.",
        said: "Bayou Burger: general treatment in the kitchen and four bait stations out back.",
        status: "sent",
        lines: [item(pestGeneral), item(baitStation, 4)],
      },
      {
        number: "SPC-3384",
        date: "2026-11-06",
        customer: "Angela Torres",
        said: "Angela Torres, termite inspection before closing on the house.",
        status: "paid",
        lines: [item(termite)],
      },
      {
        number: "SPC-3378",
        date: "2026-10-30",
        customer: "Heights Montessori",
        said: "Heights Montessori: general treatment, plus the follow-up visit next week.",
        status: "paid",
        lines: [item(pestGeneral), item(followUp)],
      },
    ],
  },
  {
    id: "true-coat-painting",
    trade: "Painting",
    name: "True Coat Painting",
    owner: "Will Carter",
    city: "Nashville, TN",
    labor: paintLabor,
    services: [consult, supplies],
    parts: [paint, primer],
    customers: [
      { name: "Jenna Fox", email: "jenna.fox@example.com" },
      { name: "Germantown Bistro", email: "gm@germantownbistro.example.com" },
      { name: "Music Row Studios", email: "studio@musicrowstudios.example.com" },
    ],
    daysUntilDue: 14,
    invoices: [
      {
        number: "TCP-5512",
        date: "2026-11-12",
        customer: "Jenna Fox",
        said: "Jenna Fox, painted the nursery: six hours, three gallons of premium and supplies.",
        status: "sent",
        lines: [work(paintLabor, 360), item(paint, 3), item(supplies)],
      },
      {
        number: "TCP-5507",
        date: "2026-11-04",
        customer: "Germantown Bistro",
        said: "Germantown Bistro dining room: eight hours, five gallons of premium and two of primer.",
        status: "paid",
        lines: [work(paintLabor, 480), item(paint, 5), item(primer, 2)],
      },
      {
        number: "TCP-5501",
        date: "2026-10-27",
        customer: "Music Row Studios",
        said: "Music Row Studios, color consultation for the lobby.",
        status: "paid",
        lines: [item(consult)],
      },
    ],
  },
  {
    id: "easy-haul-movers",
    trade: "Moving",
    name: "Easy Haul Movers",
    owner: "Ray Jackson",
    city: "Dallas, TX",
    labor: moveCrew,
    services: [truck, piano],
    parts: [boxes, mattressBag],
    customers: [
      { name: "Lauren Whitman", email: "lauren.whitman@example.com" },
      { name: "Chris Park", email: "chris.park@example.net" },
      { name: "Oak Lawn Realty", email: "relo@oaklawnrealty.example.com" },
    ],
    daysUntilDue: 0,
    invoices: [
      {
        number: "EHM-2018",
        date: "2026-11-13",
        customer: "Chris Park",
        said: "Chris Park, studio move with an upright piano. Two and a half hours plus the truck fee.",
        status: "sent",
        lines: [work(moveCrew, 150), item(piano), item(truck)],
      },
      {
        number: "EHM-2014",
        date: "2026-11-09",
        customer: "Lauren Whitman",
        said: "Lauren Whitman, two-bedroom move: four hours, truck fee, twenty boxes and two mattress bags.",
        status: "paid",
        lines: [work(moveCrew, 240), item(truck), item(boxes, 20), item(mattressBag, 2)],
      },
    ],
  },
  {
    id: "bytefix-computer",
    trade: "Computer repair",
    name: "ByteFix Computer Repair",
    owner: "Nina Kapoor",
    city: "Boston, MA",
    labor: techLabor,
    services: [pcDiagnostic, dataTransfer, virus],
    parts: [ssd, laptopBattery, ram],
    customers: [
      { name: "Beacon Hill Law Group", email: "it@beaconhilllaw.example.com" },
      { name: "Ethan Cole", email: "ethan.cole@example.com" },
      { name: "Fenway Tutoring", email: "frontdesk@fenwaytutoring.example.org" },
    ],
    daysUntilDue: 14,
    invoices: [
      {
        number: "BFC-7740",
        date: "2026-11-14",
        customer: "Beacon Hill Law Group",
        said: "Beacon Hill Law: upgraded three laptops to one-terabyte SSDs with data transfer, two hours.",
        status: "sent",
        lines: [item(ssd, 3), item(dataTransfer, 3), work(techLabor, 120)],
      },
      {
        number: "BFC-7733",
        date: "2026-11-07",
        customer: "Ethan Cole",
        said: "Ethan Cole, virus removal and a new laptop battery.",
        status: "paid",
        lines: [item(virus), item(laptopBattery)],
      },
      {
        number: "BFC-7729",
        date: "2026-11-03",
        customer: "Fenway Tutoring",
        said: "Fenway Tutoring: diagnostic on the front desk PC, added a RAM stick, thirty minutes.",
        status: "paid",
        lines: [item(pcDiagnostic), item(ram), work(techLabor, 30)],
      },
    ],
  },
  {
    id: "crystal-view-windows",
    trade: "Window cleaning",
    name: "Crystal View Window Cleaning",
    owner: "Erik Johansson",
    city: "Minneapolis, MN",
    labor: null,
    services: [windowPane, screens, tracks],
    parts: [],
    customers: [
      { name: "North Loop Lofts HOA", email: "board@northlooplofts.example.org" },
      { name: "Megan Larsen", email: "megan.larsen@example.com" },
      { name: "Uptown Yoga Studio", email: "hello@uptownyoga.example.com" },
    ],
    daysUntilDue: 10,
    invoices: [
      {
        number: "CVW-1410",
        date: "2026-11-12",
        customer: "North Loop Lofts HOA",
        said: "North Loop Lofts lobby and stairwells: sixty-four windows, inside and out.",
        status: "sent",
        lines: [item(windowPane, 64)],
      },
      {
        number: "CVW-1405",
        date: "2026-11-06",
        customer: "Megan Larsen",
        said: "Megan Larsen: twenty-two windows, all the screens and the tracks.",
        status: "paid",
        lines: [item(windowPane, 22), item(screens, 22), item(tracks, 22)],
      },
      {
        number: "CVW-1401",
        date: "2026-10-31",
        customer: "Uptown Yoga Studio",
        said: "Uptown Yoga, fourteen windows and their screens.",
        status: "paid",
        lines: [item(windowPane, 14), item(screens, 14)],
      },
    ],
  },
  {
    id: "spoke-chain-bikes",
    trade: "Bike repair",
    name: "Spoke & Chain Mobile Bike Repair",
    owner: "Jules Martin",
    city: "Brooklyn, NY",
    labor: bikeLabor,
    services: [bikeTune, flatFix],
    parts: [tube, bikePads, chain],
    customers: [
      { name: "Greenpoint Deliveries", email: "fleet@greenpointdeliveries.example.com" },
      { name: "Zoe Alvarez", email: "zoe.alvarez@example.com" },
      { name: "Prospect Park Cycling Club", email: "captain@ppcycling.example.org" },
    ],
    daysUntilDue: 7,
    invoices: [
      {
        number: "SCB-0533",
        date: "2026-11-14",
        customer: "Greenpoint Deliveries",
        said: "Greenpoint Deliveries, three cargo bikes: new chains and brake pads on all three, an hour and a half.",
        status: "sent",
        lines: [item(chain, 3), item(bikePads, 3), work(bikeLabor, 90)],
      },
      {
        number: "SCB-0530",
        date: "2026-11-11",
        customer: "Zoe Alvarez",
        said: "Zoe Alvarez, tune-up and, uh, a couple of tubes I think.",
        status: "question",
        question: "How many inner tubes did you use?",
        lines: [item(bikeTune)],
      },
      {
        number: "SCB-0528",
        date: "2026-11-08",
        customer: "Prospect Park Cycling Club",
        said: "Prospect Park Cycling Club, four tune-ups before Sunday's race.",
        status: "paid",
        lines: [item(bikeTune, 4)],
      },
    ],
  },
];

export const SAMPLE_TRADES = SAMPLE_BOOK.map((business) => business.trade);
