const fs = require("fs");
let code = fs.readFileSync("src/app/api/admin/dealers/[id]/route.js", "utf8");

let replacement = `
    const email = formData.get("email")?.toString().trim() || null;
    const name = formData.get("name")?.toString().trim();

    await db.dealer.update({
      where: { id: id },
      data: {
        name,
        county:      formData.get("county")?.toString()         || "Nairobi",
        location:    formData.get("location")?.toString().trim(),
        address:     formData.get("address")?.toString().trim() || null,
        lat:         formData.get("lat") ? parseFloat(formData.get("lat")) : null,
        lng:         formData.get("lng") ? parseFloat(formData.get("lng")) : null,
        phone:       formData.get("phone")?.toString().trim(),
        whatsapp:    formData.get("whatsapp")?.toString().trim() || null,
        email,
        website:     formData.get("website")?.toString().trim()  || null,
        description: formData.get("description")?.toString().trim() || null,
        verified:    formData.get("verified") === "on",
        featured:    formData.get("featured") === "on",
      },
    });

    if (email) {
      const existingUser = await db.user.findUnique({ where: { email } });
      if (!existingUser) {
        const { hash } = require("bcryptjs");
        const defaultPasswordHash = await hash("Motorke123!", 10);
        await db.user.create({
          data: {
            email,
            passwordHash: defaultPasswordHash,
            name: name,
            role: "DEALER",
            dealerId: id,
            active: true
          }
        });
      } else if (!existingUser.dealerId) {
        await db.user.update({
          where: { id: existingUser.id },
          data: { dealerId: id, role: "DEALER" }
        });
      }
    }
`;

code = code.replace(/await db\.dealer\.update\(\{[^}]+\},\s*data:\s*\{[\s\S]+?\},[\s\n]*\}\);/gm, replacement);

fs.writeFileSync("src/app/api/admin/dealers/[id]/route.js", code);
console.log("Dealer update API updated to create User");
