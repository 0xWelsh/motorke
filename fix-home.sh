#!/bin/bash
FILE="src/app/page.js"

# 1. Backgrounds
sed -i 's/bg-slate-50/bg-[#f7f6f3]/g' $FILE
sed -i 's/from-slate-50/from-[#f7f6f3]/g' $FILE
sed -i 's/to-slate-100\/50/to-[#f7f6f3]/g' $FILE
sed -i 's/bg-gradient-to-br/bg-[#f7f6f3]/g' $FILE
sed -i 's/bg-\[radial-gradient.*\]/bg-[#f7f6f3]/g' $FILE
sed -i 's/bg-zinc-50/bg-white/g' $FILE
sed -i 's/bg-zinc-100/bg-[#f7f6f3]/g' $FILE

# 2. Borders
sed -i 's/border-slate-200/border-\[#ddd4c8\]/g' $FILE
sed -i 's/border-slate-300/border-\[#ddd4c8\]/g' $FILE
sed -i 's/border-zinc-200/border-\[#ddd4c8\]/g' $FILE
sed -i 's/border-zinc-300/border-\[#ddd4c8\]/g' $FILE
sed -i 's/border-\[#e7e1d8\]/border-\[#ddd4c8\]/g' $FILE

# 3. Corners
sed -i 's/rounded-xl/rounded-none/g' $FILE
sed -i 's/rounded-2xl/rounded-none/g' $FILE
sed -i 's/rounded-3xl/rounded-none/g' $FILE
sed -i 's/rounded-lg/rounded-none/g' $FILE
sed -i 's/rounded-md/rounded-none/g' $FILE
sed -i 's/rounded-full/rounded-none/g' $FILE
sed -i 's/rounded-none/rounded-none/g' $FILE

# 4. Text
sed -i 's/text-slate-800/text-slate-900/g' $FILE
sed -i 's/font-bold/font-black/g' $FILE
sed -i 's/font-extrabold/font-black/g' $FILE
sed -i 's/text-zinc-600/text-slate-600/g' $FILE
sed -i 's/text-zinc-900/text-slate-900/g' $FILE

# 5. Accent Hover
sed -i 's/hover:border-\[#ff5a2f\]\/40/hover:border-slate-400/g' $FILE
sed -i 's/hover:bg-slate-100/hover:bg-[#f7f6f3]/g' $FILE

# Pill Buttons to Blocks
sed -i 's/mk-pill-btn//g' $FILE
