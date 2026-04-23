// src/app/api/cars/parse/route.js
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { text } = await request.json();
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "No text provided" }, { status: 400 });
    }

    // This is where you would hook up an LLM (Gemini, OpenAI, etc.)
    // For now, we provide the logic framework.
    
    const extraction = {
      make: null,
      model: null,
      year: null,
      price: null,
      mileage: null,
      engineCC: null,
      confident: false,
    };

    // Simple regex fallback (Server Side)
    const yearMatch = text.match(/\b(19|20)\d{2}\b/);
    if (yearMatch) extraction.year = parseInt(yearMatch[0], 10);

    const priceRegex = /(?:ksh|price|cost)?\s*([\d,.]+)\s*(?:m|million|k)\b/i;
    const priceMatch = text.match(priceRegex);
    if (priceMatch) {
      let val = priceMatch[1].replace(/,/g, '');
      let num = parseFloat(val);
      if (text.toLowerCase().includes('m') || text.toLowerCase().includes('million')) {
        if (num < 100) num = num * 1000000;
      }
      extraction.price = num;
    }

    const mileageMatch = text.match(/([\d,.]+)\s*(?:km|miles|k)\b/i);
    if (mileageMatch) {
      extraction.mileage = parseInt(mileageMatch[1].replace(/,/g, ''), 10);
      if (text.toLowerCase().includes('k') && extraction.mileage < 1000) {
        extraction.mileage *= 1000;
      }
    }

    extraction.confident = !!(extraction.make && extraction.price);

    return NextResponse.json({
      success: true,
      data: extraction,
      aiUsed: false,
      message: "Basic extraction complete. Add an AI API key for better results."
    });

  } catch (err) {
    console.error("Parse API Error:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
