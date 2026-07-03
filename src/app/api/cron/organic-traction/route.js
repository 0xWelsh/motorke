// src/app/api/cron/organic-traction/route.js
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const revalidate = 0;

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

const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = (arr) => arr[rand(0, arr.length - 1)];
const EMAIL_DOMAINS = ["gmail.com", "yahoo.com", "outlook.com", "icloud.com", "proton.me"];

function randomPhone() {
  const prefix = pick(["0700", "0711", "0722", "0733", "0743", "0757", "0777", "0789", "0799", "0100", "0110", "0111"]);
  return prefix + String(rand(100000, 999999));
}

export async function GET(req) {
  const authHeader = req.headers.get("authorization");
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const results = { views: 0, events: 0, leads: 0 };

    // ── 1. Views ────────────────────────────────────────────────────
    // Pick ~20-50% of active cars, add 2-10 views each (single daily tick)
    const activeCars = await db.car.findMany({
      where: { available: true },
      select: { id: true, dealerId: true },
    });

    if (activeCars.length > 0) {
      const targetCount = Math.max(1, Math.floor(activeCars.length * rand(20, 50) / 100));
      const shuffled = [...activeCars].sort(() => Math.random() - 0.5).slice(0, targetCount);

      for (const car of shuffled) {
        const bump = rand(2, 10);
        await db.car.update({
          where: { id: car.id },
          data: { views: { increment: bump } },
        });
        results.views += bump;
      }
    }

    // ── 2. Events (Views Today) — spread across the day ────────────
    const eventCount = rand(30, 150);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const eventData = Array.from({ length: eventCount }, () => ({
      name: "page_view",
      createdAt: new Date(todayStart.getTime() + Math.random() * (now.getTime() - todayStart.getTime())),
    }));
    await db.marketingEvent.createMany({ data: eventData });
    results.events = eventCount;

    // ── 3. Leads — spread across last 48h ──────────────────────────
    const leadCount = rand(1, 8);
    for (let i = 0; i < leadCount; i++) {
      const car = pick(activeCars);
      if (!car) continue;
      const first = pick(FIRST_NAMES);
      const last = pick(LAST_NAMES);
      const hoursAgo = rand(0, 48);
      const channel = pick(["web", "web", "web", "whatsapp", "call"]);

      await db.lead.create({
        data: {
          carId: car.id,
          dealerId: car.dealerId,
          name: `${first} ${last}`,
          phone: randomPhone(),
          email: `${first.toLowerCase()}${last.toLowerCase()}${rand(1, 99)}@${pick(EMAIL_DOMAINS)}`,
          message: channel !== "call" ? "Hi, is this still available?" : null,
          channel,
          createdAt: new Date(now.getTime() - hoursAgo * 3600000 - rand(0, 3600000)),
        },
      });
      results.leads++;
    }

    return NextResponse.json({
      success: true,
      message: `+${results.views} views, +${results.events} events, +${results.leads} leads`,
      results,
    });
  } catch (err) {
    console.error("organic-traction error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
