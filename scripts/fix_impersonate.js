const fs = require('fs');

let path = 'src/app/api/auth/impersonate/route.js';
let content = fs.readFileSync(path, 'utf8');

// Replace the manual token creation and cookie setting with createSession
content = content.replace(
  /const token = crypto[\s\S]*expires: expiresAt,\n  \}\);/gm,
  `import { createSession } from "@/lib/auth";\n  await createSession(targetUser.id);`
);

// We need to move the import to the top if we inject it there, or just use createSession directly if it's already imported.
// Wait, getSessionFromRequest is imported from "@/lib/auth", let's just add createSession to it.
content = content.replace(
  /import { getSessionFromRequest } from "@\/lib\/auth";/g,
  'import { getSessionFromRequest, createSession } from "@/lib/auth";'
);

// Oh wait, the first replace injected the import inline. Let me just replace the token block with the call.
content = content.replace(/import \{ createSession \} from "@\/lib\/auth";\\n  await createSession\(targetUser.id\);/g, 'await createSession(targetUser.id);');

// Clean up
content = content.replace(
  /  \/\/ Create a new session for the target user to impersonate them[\s\S]*?expires: expiresAt,\n  \}\);/gm,
  `  // Create a new session for the target user to impersonate them\n  await createSession(targetUser.id);`
);

fs.writeFileSync(path, content);
console.log("Impersonate API fixed.");
