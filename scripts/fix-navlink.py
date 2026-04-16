import re

with open('src/app/admin/layout.js', 'r') as f:
    text = f.read()

# Replace the active nav block
pattern = r'active\s*\?\s*"bg-\[#ff5a2f\] text-white shadow-none shadow-\[#ff5a2f\]/20"\s*:\s*"text-slate-700 hover:text-slate-900 hover:bg-slate-100"'
replacement = 'active\n          ? "bg-[#111111] border border-[#111111] text-white shadow-none"\n          : "text-slate-900 bg-white border border-transparent hover:bg-[#fbfcfe] hover:border-[#ddd4c8]"'

text = re.sub(pattern, replacement, text)

with open('src/app/admin/layout.js', 'w') as f:
    f.write(text)
