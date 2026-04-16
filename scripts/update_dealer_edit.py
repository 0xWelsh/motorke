with open('src/app/admin/dealers/[id]/edit/page.js', 'r') as f:
    text = f.read()

# Add import locations
text = text.replace('"Laikipia","Other"', '"Laikipia","China (Import)", "Japan (Import)", "UK (Import)", "Other"')

# Replace classes
text = text.replace('const inputCls  = "w-full bg-white/5 border border-white/10 rounded-none px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-[#f97316]/50 transition-colors";', 
                    'const inputCls  = "w-full border border-[#ddd4c8] rounded-none bg-[#fbfcfe] px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-0 transition-none";')

text = text.replace('const selectCls = "w-full bg-surface border border-white/10 rounded-none px-4 py-3 text-sm text-white outline-none focus:border-[#f97316]/50 transition-colors";', 
                    'const selectCls = "w-full border border-[#ddd4c8] rounded-none bg-[#fbfcfe] px-4 py-3.5 text-sm text-slate-900 outline-none focus:border-slate-900 focus:ring-0 transition-none";')

text = text.replace('const labelCls  = "block text-xs text-white/40 uppercase tracking-wider mb-2";', 
                    'const labelCls  = "block text-[10px] font-black uppercase tracking-[0.16em] text-slate-900 mb-2";')

# UI fixes
text = text.replace('className="p-8 max-w-2xl"', 'className="p-8 lg:p-12 max-w-3xl"')
text = text.replace('className="bg-[#1a1a1a] border border-white/10 rounded-none p-7"', 'className="bg-white border border-[#ddd4c8] p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]"')
text = text.replace('className="text-xs text-white/40 hover:text-white transition-colors"', 'className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 hover:text-[#ff5a2f] transition-none"')
text = text.replace('<h1 className="text-2xl font-black mt-2">', '<h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mt-2">')
text = text.replace('<h1 className="text-3xl font-black mt-2">', '<h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter mt-2">')
text = text.replace('className="text-3xl font-black"', 'className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter"')
text = text.replace('className="text-2xl font-black"', 'className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter"')
text = text.replace('text-white/60 mb-8', 'text-slate-500 font-medium mb-8')

# Error box
text = text.replace('className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-none px-4 py-3 mb-5"', 'className="bg-[#111111] border border-red-500 rounded-none p-4 text-[11px] font-bold text-red-400 mb-6"')
text = text.replace('className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-none px-4 py-3 mb-5"', 'className="bg-[#fbfcfe] border border-[#ff5a2f] rounded-none p-4 text-[11px] font-bold text-[#ff5a2f] mb-6"')

# Help text
text = text.replace('className="text-xs text-white/20 mt-1"', 'className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2 block"')

# Divider
text = text.replace('border-t border-white/5', 'border-t border-[#ddd4c8]')
text = text.replace('border-white/5 pb-5', 'border-[#ddd4c8] pb-5')
text = text.replace('border border-white/10 bg-[#1a1a1a]', 'bg-[#fbfcfe] border border-[#ddd4c8]')
text = text.replace('bg-[#111] border border-white/5', 'bg-white border border-[#ddd4c8]')

# Checkboxes
text = text.replace('className="w-4 h-4 accent-[#f97316]"', 'className="w-4 h-4 border border-[#ddd4c8] rounded-none checked:bg-[#ff5a2f] checked:border-[#ff5a2f] cursor-pointer accent-[#ff5a2f]"')
text = text.replace('className="text-sm text-white/60"', 'className="text-[11px] font-bold uppercase tracking-widest text-slate-700"')

# Submit buttons
text = text.replace('bg-[#f97316] hover:bg-[#ea580c] text-white', 'bg-[#ff5a2f] hover:bg-[#111111] hover:text-white text-white rounded-none border border-transparent hover:border-[#111111] px-6 text-[11px] font-black uppercase tracking-[0.15em] transition-none')
text = text.replace('bg-white/5 hover:bg-white/10 text-white', 'bg-white hover:bg-[#fbfcfe] text-slate-900 rounded-none border border-[#ddd4c8] px-6 text-[11px] font-black uppercase tracking-[0.15em] transition-none')

with open('src/app/admin/dealers/[id]/edit/page.js', 'w') as f:
    f.write(text)
