import re

for filename in ['src/components/LoginForm.js', 'src/components/SignupForm.js']:
    with open(filename, 'r') as f:
        content = f.read()

    # Small tweaks
    content = content.replace('rounded', 'rounded-none')
    content = content.replace('rounded-none-none', 'rounded-none') # accident fix
    content = content.replace('text-sm font-semibold text-slate-900 mb-2 block', 'text-[10px] font-black uppercase tracking-[0.16em] text-slate-900 mb-2 block')
    content = content.replace('text-sm text-slate-700', 'text-[11px] font-bold text-slate-500 uppercase tracking-widest')
    content = content.replace('checked:bg-slate-900 checked:border-slate-900', 'checked:bg-[#ff5a2f] checked:border-[#ff5a2f] cursor-pointer accent-[#ff5a2f]')

    with open(filename, 'w') as f:
        f.write(content)
