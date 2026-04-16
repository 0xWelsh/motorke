const fs = require("fs");
let code = fs.readFileSync("src/app/api/admin/dealers/route.js", "utf8");

// We need to inject user creation logic right after creating the dealer.
// Let's import bcrypt to hash a default password, or we can just send an invite link
// For now, let's create a User if email is provided.

let injection = `
      } catch (err) {
        const isSlugConflict =
          err?.code === "P2002" &&
          Array.isArray(err?.meta?.target) &&
          err.meta.target.includes("slug");
        if (!isSlugConflict || attempt === 5) throw err;
      }
    }

    if (!created) {
      throw new Error("Unable to create dealer. Please try again.");
    }

    // CREATE USER IF EMAIL IS PROVIDED
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
            dealerId: created.id,
            active: true
          }
        });
      } else if (!existingUser.dealerId) {
        await db.user.update({
          where: { id: existingUser.id },
          data: { dealerId: created.id, role: "DEALER" }
        });
      }
    }
`;

code = code.replace(`      } catch (err) {
        const isSlugConflict =
          err?.code === "P2002" &&
          Array.isArray(err?.meta?.target) &&
          err.meta.target.includes("slug");
        if (!isSlugConflict || attempt === 5) throw err;
      }
    }

    if (!created) {
      throw new Error("Unable to create dealer. Please try again.");
    }`, injection);

fs.writeFileSync("src/app/api/admin/dealers/route.js", code);
console.log("Dealer creation API updated to create User");
