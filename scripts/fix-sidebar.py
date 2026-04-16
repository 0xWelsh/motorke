import re

with open('src/app/admin/layout.js', 'r') as f:
    c = f.read()

# Branding box
c = c.replace('bg-slate-900 rounded-none flex items-center justify-center group-hover:bg-[#ff5a2f]', 'bg-[#111111] rounded-none flex items-center justify-center group-hover:bg-[#ff5a2f]')
c = c.replace('img src="/headerlogo.png" alt="Motorke" className="w-7 h-7 object-contain rounded-none"', 'img src="/headerlogo.png" alt="Motorke" className="w-8 h-8 object-contain rounded-none filter invert brightness-200"')

# NavLink
c = c.replace('? "bg-[#ff5a2f] text-white shadow-none shadow-[#ff5a2f]/20"\n          : "text-slate-700 hover:text-slate-900 hover:bg-slate-100"', '? "bg-[#111111] border border-[#111111] text-white shadow-none"\n          : "text-slate-900 bg-white border border-transparent hover:bg-[#fbfcfe] hover:border-[#ddd4c8]"')

c = c.replace('<Icon size={18} className={clsx("transition-colors", active ? "text-white" : "group-hover:text-[#ff5a2f]")} />', '<Icon size={18} className={clsx("transition-none", active ? "text-[#ff5a2f]" : "group-hover:text-[#ff5a2f]")} />')
c = c.replace('<span className="text-[13px] font-bold uppercase tracking-wider">{label}</span>', '<span className="text-[11px] font-black uppercase tracking-[0.15em]">{label}</span>')


# Headers "Core Operations"
c = c.replace('<p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Core Operations</p>', '<p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Core Operations</p>')
c = c.replace('<p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em]">Management</p>', '<p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em]">Management</p>')

# Background color of the right main area
c = c.replace('className="flex bg-[#f7f6f3] text-slate-900', 'className="flex bg-[#fbfcfe] text-slate-900')


with open('src/app/admin/layout.js', 'w') as f:
    f.write(c)

