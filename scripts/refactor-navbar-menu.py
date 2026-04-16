import re

with open('src/components/Navbar.js', 'r') as f:
    content = f.read()

# Desktop Menu Trigger Button
content = content.replace('bg-white border border-slate-200 pl-2 pr-5 py-2 rounded-xl hover:border-slate-300 transition-all', 'bg-white border border-[#ddd4c8] pl-2 pr-5 py-2 rounded-none hover:border-slate-900 transition-none')
content = content.replace('w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-sm uppercase text-white bg-[#111111]', 'w-9 h-9 rounded-none flex items-center justify-center font-black text-sm uppercase text-white bg-[#ff5a2f]')

# Dropdown Box
content = content.replace('w-72 bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden p-3', 'w-72 bg-white border border-[#ddd4c8] rounded-none shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)] overflow-hidden p-0')

# Dropdown User Info Region
content = content.replace('px-5 py-4 bg-slate-50 rounded-2xl mb-3', 'px-5 py-5 bg-[#f7f6f3] border-b border-[#ddd4c8] mb-0 rounded-none')
content = content.replace('<p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 mb-1">Signed in</p>', '<p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Signed in</p>')
content = content.replace('<p className="text-sm font-extrabold text-slate-900 truncate">', '<p className="text-sm font-black text-slate-900 truncate">')

# Action lines and Signout
content = content.replace('<div className="space-y-1">', '<div className="space-y-0 divide-y divide-[#ddd4c8]">')
content = content.replace('my-2 h-px bg-slate-100 mx-4', 'hidden') # Hide spacer since we use divide-y now
content = content.replace('w-full flex items-center gap-4 px-5 py-4 text-[11px] font-extrabold uppercase tracking-widest text-rose-500 hover:bg-rose-50 rounded-2xl transition-all', 'w-full flex items-center gap-4 px-5 py-4 text-[11px] font-black uppercase tracking-widest text-[#ff5a2f] hover:bg-[#111111] hover:text-white rounded-none transition-none')

# MenuDropdownItem component
content = content.replace('flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-widest text-slate-900 hover:bg-[#faf7f2] rounded-xl transition-colors', 'flex items-center gap-3 px-5 py-4 text-[11px] font-black uppercase tracking-[0.15em] text-slate-900 hover:bg-[#fbfcfe] hover:text-[#ff5a2f] rounded-none transition-none')

# Mobile Menu Trigger / Auth / Signed In UI
content = content.replace('w-12 h-12 rounded-full overflow-hidden bg-white border border-slate-200 flex items-center justify-center shrink-0', 'w-12 h-12 rounded-none bg-white border border-[#ddd4c8] flex items-center justify-center shrink-0')
content = content.replace('text-[10px] font-extrabold uppercase tracking-widest text-slate-400', 'text-[10px] font-black uppercase tracking-[0.2em] text-slate-500')
content = content.replace('text-base font-extrabold text-slate-900 leading-tight', 'text-base font-black uppercase text-slate-900 tracking-widest leading-tight')
content = content.replace('flex items-center gap-4 px-5 py-4 bg-slate-50 rounded-2xl text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors', 'flex items-center gap-4 px-5 py-4 bg-white border border-[#ddd4c8] rounded-none text-slate-900 hover:bg-[#111111] hover:text-white hover:border-[#111111] transition-none')
content = content.replace('w-full flex items-center justify-center gap-2 px-5 py-4 bg-rose-50 text-rose-600 rounded-2xl text-[11px] font-extrabold uppercase tracking-widest hover:bg-rose-100 transition-colors mt-4', 'w-full flex items-center justify-center gap-2 px-5 py-4 bg-[#111111] text-white rounded-none text-[11px] font-black uppercase tracking-[0.2em] hover:bg-[#ff5a2f] transition-none mt-6')
content = content.replace('w-full mk-pill-btn bg-[#111111] hover:bg-[#ff5a2f] text-white px-5 py-4 text-xs uppercase font-extrabold flex justify-center mb-3', 'w-full bg-[#111111] hover:bg-[#ff5a2f] text-white rounded-none border border-[#111111] px-5 py-4 text-[11px] uppercase font-black tracking-widest flex justify-center mb-3 transition-none')
content = content.replace('w-full flex justify-center px-5 py-4 text-sm font-extrabold text-slate-900 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors', 'w-full flex justify-center px-5 py-4 text-[11px] uppercase font-black tracking-widest text-slate-900 bg-white border border-[#ddd4c8] rounded-none hover:bg-[#fbfcfe] transition-none')

with open('src/components/Navbar.js', 'w') as f:
    f.write(content)
