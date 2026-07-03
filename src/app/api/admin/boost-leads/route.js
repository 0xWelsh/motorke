// src/app/api/admin/boost-leads/route.js
import { requireSuperAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const FIRST_NAMES = [
  "James", "Mary", "John", "Grace", "Peter", "Faith", "David", "Esther",
  "Daniel", "Sarah", "Samuel", "Elizabeth", "Joseph", "Margaret", "Paul",
  "Jane", "Kevin", "Nancy", "Brian", "Diana", "Patrick", "Agnes", "Michael",
  "Ruth", "George", "Catherine", "Timothy", "Dorcas", "Robert", "Hellen",
  "Alex", "Lucy", "Stephen", "Ann", "Chris", "Rose", "Kennedy", "Priscilla",
  "Vincent", "Monica", "Geoffrey", "Caroline", "Francis", "Veronica", "Collins",
  "Teresa", "Dennis", "Cynthia", "Moses", "Florence",
];

const LAST_NAMES = [
  "Kamau", "Wanjiku", "Muthoni", "Njoroge", "Nyambura", "Omondi", "Akinyi",
  "Kiprop", "Chebet", "Mwangi", "Wambui", "Ndegwa", "Kariuki", "Waithera",
  "Otieno", "Achieng", "Kipkorir", "Jelagat", "Mutua", "Ndungu", "Wekesa",
  "Nasimiyu", "Barasa", "Nekesa", "Odhiambo", "Anyango", "Kipkemoi", "Kosgei",
  "Kinyua", "Njenga", "Macharia", "Waweru", "Githinji", "Kibaki", "Koech",
  "Sigei", "Rono", "Ketter", "Langat", "Mutai", "Cheruiyot", "Biwiott",
  "Sang", "Kemboi", "Towett", "Yego",
];

const LEAD_MESSAGES = [
  "Hi, is this still available? I'd like to come view it this weekend.",
  "What's the final price? I'm a serious buyer.",
  "I'm interested. Can you share more photos of the interior?",
  "Hello, what's the mileage and service history?",
  "Is the price negotiable? I can pay cash.",
  "Where exactly are you located for viewing?",
  "Can you deliver to Nairobi? I'll cover the cost.",
  "I saw this car and I'm very interested. Please call me.",
  "What's the condition of the tyres and brakes?",
  "Do you have a video of the engine running?",
  "I'd like to take it for a test drive tomorrow morning.",
  "Please send me the full specs including fuel consumption.",
  "How long have you had this listing? Why are you selling?",
  "Hello, is the car still on sale? I'm in Mombasa.",
  "Looks clean! Any known mechanical issues?",
];

const LEAD_CHANNELS = ["web", "web", "web", "whatsapp", "call"];

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "proton.me"];

function randomPhone() {
  const prefix = pick(["0700", "0711", "0722", "0733", "0743", "0757", "0777", "0789", "0799", "0100", "0110", "0111"]);
  return prefix + String(rand(100000, 999999));
}

export async function POST(req) {
  try {
    await requireSuperAdmin();

    const { count: rawCount } = await req.json();
    let count = parseInt(rawCount, 10);
    if (isNaN(count) || count < 1 || count > 1000) {
      return Response.json({ error: "Count must be between 1 and 1,000." }, { status: 400 });
    }

    const cars = await db.car.findMany({
      where: { available: true },
      select: { id: true, dealerId: true },
      take: 500,
    });

    if (!cars.length) {
      return Response.json({ error: "No active cars found to attach leads to." }, { status: 400 });
    }

    const now = new Date();
    let created = 0;

    for (let i = 0; i < count; i++) {
      const car = pick(cars);
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const channel = pick(LEAD_CHANNELS);
      const hoursAgo = rand(0, 72);
      const createdAt = new Date(now.getTime() - hoursAgo * 3600000 - rand(0, 3600000));
      const statuses = ["NEW", "NEW", "NEW", "CONTACTED", "INTERESTED", "NEGOTIATING"];
      const status = pick(statuses);

      await db.lead.create({
        data: {
          carId: car.id,
          dealerId: car.dealerId,
          name: `${first} ${last}`,
          phone: randomPhone(),
          email: `${first.toLowerCase()}${last.toLowerCase()}${rand(1, 99)}@${pick(EMAIL_DOMAINS)}`,
          message: channel !== "call" ? pick(LEAD_MESSAGES) : null,
          channel,
          createdAt,
          status,
        },
      });

      created++;
    }

    return Response.json({ success: true, message: `Added ${created} leads across ${cars.length} active cars.` });
  } catch (err) {
    console.error("boost-leads error:", err);
    return Response.json({ error: "Failed to boost leads." }, { status: 500 });
  }
}
