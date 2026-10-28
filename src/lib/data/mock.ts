import type { Auction, AppNotification, Student } from "./types";

const u = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=900&q=70`;
const H = 3600_000;
const now = Date.now();
const at = (hoursFromNow: number) => new Date(now + hoursFromNow * H).toISOString();

export const students: Student[] = [
  { id: "s1", name: "Aarav Sharma", college: "IIT Delhi", hostel: "Kumaon Hostel", batch: "B.Tech '26", avatar: "AS", rating: 4.9, salesCount: 7 },
  { id: "s2", name: "Priya Iyer", college: "IIT Delhi", hostel: "Himadri Hostel", batch: "M.Sc '26", avatar: "PI", rating: 4.8, salesCount: 4 },
  { id: "s3", name: "Rohan Mehta", college: "IIT Delhi", hostel: "Aravali Hostel", batch: "B.Tech '26", avatar: "RM", rating: 4.6, salesCount: 2 },
  { id: "s4", name: "Sneha Reddy", college: "IIT Delhi", hostel: "Kailash Hostel", batch: "B.Des '26", avatar: "SR", rating: 5.0, salesCount: 9 },
];

/** The signed-in student shown in demo dashboards. */
export const demoUserId = "s1";

const bids = (start: number, step: number, names: string[]) =>
  names.map((n, i) => ({
    id: `b${start}-${i}`,
    bidderName: n,
    amount: start + step * (i + 1),
    placedAt: at(-(names.length - i) * 3),
  })).reverse();

const mk = (a: Omit<Auction, "currentBid">): Auction => ({
  ...a,
  currentBid: a.bids.length ? a.bids[0].amount : null,
});

export const auctions: Auction[] = [
  mk({
    id: "a1", title: "MacBook Air M1 (8GB / 256GB)", category: "Electronics", condition: "Good",
    description: "Used through 3rd and 4th year for coding and assignments. Battery health 86%, minor scuff on the lid. Comes with original charger and a sleeve.",
    photos: [u("photo-1517336714731-489689fd1ca8"), u("photo-1593642632559-0c6d3fc62b89")],
    startingPrice: 38000, minIncrement: 500, bids: bids(38000, 500, ["Karan V.", "Ishita P.", "Dev K.", "Karan V."]),
    questions: [{ id: "q1", askedBy: "Ishita P.", question: "Any dead pixels?", answer: "None at all, screen is perfect." }],
    sellerId: "s1", createdAt: at(-48), closesAt: at(5), status: "active", featured: true, pickup: "Kumaon Hostel gate",
  }),
  mk({
    id: "a2", title: "Hero Sprint 21-gear Cycle", category: "Cycles", condition: "Good",
    description: "Reliable campus ride, new tyres in January. Lock and front basket included.",
    photos: [u("photo-1485965120184-e220f721d03e")],
    startingPrice: 3500, minIncrement: 100, bids: bids(3500, 100, ["Nikhil S.", "Ananya R.", "Nikhil S."]),
    questions: [], sellerId: "s3", createdAt: at(-30), closesAt: at(1.2), status: "active", featured: true, pickup: "Aravali cycle stand",
  }),
  mk({
    id: "a3", title: "GATE CSE Complete Book Set (12 books)", category: "Books", condition: "Fair",
    description: "Made Easy + standard texts (Cormen, Galvin, Forouzan). Some highlighting, all pages intact.",
    photos: [u("photo-1544947950-fa07a98d237f")],
    startingPrice: 1200, minIncrement: 50, bids: bids(1200, 50, ["Tanvi M."]),
    questions: [{ id: "q2", askedBy: "Arjun B.", question: "Is the 2024 previous-year paper book included?" }],
    sellerId: "s2", createdAt: at(-10), closesAt: at(28), status: "active", pickup: "Himadri reception",
  }),
  mk({
    id: "a4", title: "Canon EOS 1500D with 18-55mm", category: "Electronics", condition: "Like New",
    description: "Bought for the photography club, under 3k shutter count. Bag, 32GB card and spare battery included.",
    photos: [u("photo-1516035069371-29a1b244cc32")],
    startingPrice: 22000, minIncrement: 500, bids: bids(22000, 500, ["Meera J.", "Sahil G.", "Meera J.", "Rahul T.", "Sahil G."]),
    questions: [], sellerId: "s4", createdAt: at(-60), closesAt: at(0.6), status: "active", featured: true, pickup: "Kailash Hostel lobby",
  }),
  mk({
    id: "a5", title: "Yamaha F310 Acoustic Guitar", category: "Instruments", condition: "Good",
    description: "Great beginner guitar, strings changed last month. Comes with gig bag and capo.",
    photos: [u("photo-1510915361894-db8b60106cb1")],
    startingPrice: 4500, minIncrement: 200, bids: [],
    questions: [], sellerId: "s1", createdAt: at(-4), closesAt: at(52), status: "active", pickup: "Kumaon Hostel gate",
  }),
  mk({
    id: "a6", title: "Study Table + Ergonomic Chair", category: "Furniture", condition: "Fair",
    description: "Engineered wood table (4ft) with a mesh-back chair. Must pick up — can help carry to your hostel.",
    photos: [u("photo-1555041469-a586c61ea9bc")],
    startingPrice: 2000, minIncrement: 100, bids: bids(2000, 100, ["Pooja L.", "Vikram N."]),
    questions: [], sellerId: "s3", createdAt: at(-20), closesAt: at(9), status: "active", pickup: "Aravali Hostel room 214",
  }),
  mk({
    id: "a7", title: "Sony WH-1000XM4 Headphones", category: "Electronics", condition: "Like New",
    description: "Noise cancelling saved me during library exam weeks. Box and case included.",
    photos: [u("photo-1505740420928-5e560c06d30e")],
    startingPrice: 12000, minIncrement: 250, bids: bids(12000, 250, ["Ayesha K.", "Rohit P."]),
    questions: [], sellerId: "s2", createdAt: at(-2), closesAt: at(70), status: "active", featured: true, pickup: "Himadri reception",
  }),
  mk({
    id: "a8", title: "Philips LED Desk Lamp", category: "Hostel Essentials", condition: "Good",
    description: "3 brightness levels, USB charging port. Perfect for late-night study.",
    photos: [u("photo-1507473885765-e6ed057f782c")],
    startingPrice: 400, minIncrement: 20, bids: bids(400, 20, ["Kabir D."]),
    questions: [], sellerId: "s4", createdAt: at(-1), closesAt: at(3), status: "active", pickup: "Kailash Hostel lobby",
  }),
  mk({
    id: "a9", title: "SG Cricket Kit (Bat, Pads, Gloves)", category: "Sports", condition: "Well Used",
    description: "Full kit used for inter-hostel tournaments. Bat is English willow, knocked in.",
    photos: [u("photo-1531415074968-036ba1b575da")],
    startingPrice: 2500, minIncrement: 100, bids: [],
    questions: [], sellerId: "s1", createdAt: at(-0.5), closesAt: at(96), status: "active", pickup: "Sports complex",
  }),
  mk({
    id: "a10", title: "OnePlus Nord CE 3 (8/128)", category: "Electronics", condition: "Good",
    description: "Screen guard since day one, no scratches. Bill available.",
    photos: [u("photo-1511707171634-5f897ff02aa9")],
    startingPrice: 11000, minIncrement: 250, bids: bids(11000, 250, ["Harsh A.", "Diya S.", "Harsh A."]),
    questions: [], sellerId: "s1", createdAt: at(-90), closesAt: at(-6), status: "closed", pickup: "Kumaon Hostel gate",
  }),
  mk({
    id: "a11", title: "Scientific Calculator Casio fx-991EX", category: "Hostel Essentials", condition: "Like New",
    description: "Used for two semesters only.",
    photos: [u("photo-1564466809058-bf4114d55352")],
    startingPrice: 800, minIncrement: 50, bids: bids(800, 50, ["Riya B."]),
    questions: [], sellerId: "s1", createdAt: at(-120), closesAt: at(-30), status: "closed", pickup: "Kumaon Hostel gate",
  }),
  mk({
    id: "a12", title: "Apple iPad Air 4 + Smart Keyboard", category: "Electronics", condition: "Like New",
    description: "Perfect for notes and PDFs. Comes with Smart Keyboard and an Apple Pencil (2nd gen). Screen protector on since day one.",
    photos: [u("photo-1593642632559-0c6d3fc62b89")],
    startingPrice: 26000, minIncrement: 500, bids: bids(26000, 500, ["Aakash R.", "Neha S."]),
    questions: [], sellerId: "s3", createdAt: at(-3), closesAt: at(4), status: "active", featured: true, pickup: "Aravali Hostel room 118",
  }),
  mk({
    id: "a13", title: "CAT 2026 Complete Prep Kit (15 books)", category: "Books", condition: "Good",
    description: "Ariman + FACT pages, VARC/DILR/Quants. Minimal marking, all solutions intact. Includes 3 mock-test booklets.",
    photos: [u("photo-1544947950-fa07a98d237f")],
    startingPrice: 1800, minIncrement: 100, bids: [],
    questions: [], sellerId: "s2", createdAt: at(-1.5), closesAt: at(40), status: "active", pickup: "Himadri reception",
  }),
  mk({
    id: "a14", title: "Firefox Fuego 21-gear Road Bike", category: "Cycles", condition: "Good",
    description: "Lightweight alloy frame, recently serviced. Helmet and bottle cage included. Great for quick campus commutes.",
    photos: [u("photo-1485965120184-e220f721d03e")],
    startingPrice: 6500, minIncrement: 200, bids: bids(6500, 200, ["Manav D."]),
    questions: [], sellerId: "s4", createdAt: at(-6), closesAt: at(7), status: "active", featured: true, pickup: "Kailash cycle stand",
  }),
  mk({
    id: "a15", title: "Overstudy Desk Shelf + Organizer", category: "Furniture", condition: "Fair",
    description: "Mountable wooden shelf with book dividers and a phone stand slot. Easy to carry, must pick up.",
    photos: [u("photo-1555041469-a586c61ea9bc")],
    startingPrice: 1200, minIncrement: 100, bids: [],
    questions: [], sellerId: "s1", createdAt: at(-0.5), closesAt: at(2), status: "active", pickup: "Kumaon Hostel gate",
  }),
  mk({
    id: "a16", title: "IFB 20L Microwave Oven", category: "Hostel Essentials", condition: "Good",
    description: "Convection microwave, works perfectly. Ideal for hostel room. 1 year old, original bill available.",
    photos: [u("photo-1507473885765-e6ed057f782c")],
    startingPrice: 3200, minIncrement: 150, bids: bids(3200, 150, ["Sanya K.", "Aditya M."]),
    questions: [], sellerId: "s3", createdAt: at(-8), closesAt: at(55), status: "active", pickup: "Aravali Hostel room 214",
  }),
  mk({
    id: "a17", title: "Bansuri Indian Bamboo Flute", category: "Instruments", condition: "Like New",
    description: "Krishna bansuri, mid octave. Handmade, rich tone. Comes with a soft carrying case.",
    photos: [u("photo-1510915361894-db8b60106cb1")],
    startingPrice: 1500, minIncrement: 100, bids: [],
    questions: [], sellerId: "s2", createdAt: at(-2), closesAt: at(30), status: "active", pickup: "Himadri reception",
  }),
  mk({
    id: "a18", title: "Yonex Badminton Racket Pair + Kit", category: "Sports", condition: "Good",
    description: "Two Yonex Nanoracket rackets with covers, a tube of shuttles and overgrips. Used for one semester of club games.",
    photos: [u("photo-1531415074968-036ba1b575da")],
    startingPrice: 2200, minIncrement: 100, bids: bids(2200, 100, ["Rhea P."]),
    questions: [], sellerId: "s4", createdAt: at(-0.2), closesAt: at(5), status: "active", featured: true, pickup: "Sports complex",
  }),
  mk({
    id: "a19", title: "Logitech Wireless Mouse + Keyboard Combo", category: "Electronics", condition: "Like New",
    description: "Silent-keys MK295 combo with a single USB receiver. Batteries included. Perfect desktop setup for a hostel room.",
    photos: [u("photo-1505740420928-5e560c06d30e")],
    startingPrice: 1100, minIncrement: 50, bids: [],
    questions: [], sellerId: "s1", createdAt: at(-4), closesAt: at(48), status: "active", pickup: "Kumaon Hostel gate",
  }),
];

export const notifications: AppNotification[] = [
  { id: "n1", kind: "outbid", message: "You were outbid on Canon EOS 1500D — current bid ₹24,500", minutesAgo: 12, read: false },
  { id: "n2", kind: "closing", message: "Hero Sprint cycle closes in about an hour", minutesAgo: 40, read: false },
  { id: "n3", kind: "match", message: "3 new items match your saved search “Books under ₹1,500”", minutesAgo: 180, read: true },
  { id: "n4", kind: "won", message: "You provisionally won the Prestige Electric Kettle at ₹650", minutesAgo: 1440, read: true },
];
