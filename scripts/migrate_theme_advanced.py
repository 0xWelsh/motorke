import os
import re

def update_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    original = content

    # Hard-hitting industrial replacement dictionary
    replacements = {
        # Backgrounds: remove soft and dark background styling
        r'bg-slate-50': 'bg-[#fbfcfe]',
        r'bg-slate-100': 'bg-[#fbfcfe]',
        r'bg-slate-800': 'bg-[#111111]',
        r'bg-slate-900': 'bg-[#111111]',
        r'bg-blue-600': 'bg-[#ff5a2f]',
        r'bg-blue-500': 'bg-[#ff5a2f]',
        r'bg-emerald-600': 'bg-[#ff5a2f]',
        r'bg-emerald-500': 'bg-[#ff5a2f]',
        r'bg-orange-500': 'bg-[#ff5a2f]',
        r'bg-\[\#f97316\]': 'bg-[#ff5a2f]',
        
        # Borders: strict wireframe styling
        r'border-slate-100': 'border-[#ddd4c8]',
        r'border-slate-200': 'border-[#ddd4c8]',
        r'border-slate-300': 'border-[#ddd4c8]',
        r'border-slate-700': 'border-[#ddd4c8]',
        r'border-slate-800': 'border-[#ddd4c8]',
        r'border-blue-600': 'border-[#ff5a2f]',
        r'border-emerald-600': 'border-[#ff5a2f]',
        r'border-emerald-200': 'border-[#ff5a2f]',
        
        # Texts: remove soft grays, embrace harsh contrast
        r'text-slate-400': 'text-slate-500',
        r'text-slate-500': 'text-slate-600',
        r'text-slate-600': 'text-slate-700',
        r'text-blue-600': 'text-[#ff5a2f]',
        r'text-emerald-500': 'text-[#ff5a2f]',
        r'text-emerald-600': 'text-[#ff5a2f]',
        r'text-emerald-700': 'text-[#ff5a2f]',
        r'text-orange-500': 'text-[#ff5a2f]',
        r'text-\[\#f97316\]': 'text-[#ff5a2f]',
        
        # Shadows: flat minimal shadow
        r'shadow-sm': 'shadow-[4px_4px_0px_0px_rgba(0,0,0,0.05)]',
        r'shadow-md': 'shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]',
        r'shadow-lg': 'shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]',
        r'shadow': 'shadow-[8px_8px_0px_0px_rgba(0,0,0,0.05)]',
        
        # Remove transforms
        r'hover\:scale-105': 'transition-none',
        r'active\:scale-95': 'transition-none',
        r'transition-all': 'transition-none',

        # Typographic shifts
        r'text-xs': 'text-[10px] uppercase font-black tracking-[0.15em]',
        r'text-sm': 'text-[11px] uppercase font-black tracking-[0.10em]',
    }

    for pattern, replacement in replacements.items():
        content = re.sub(pattern, replacement, content)

    # Some specialized fixes for headings
    content = re.sub(r'<h1 className="text-2xl\s+font-bold\s+text-slate-900">', '<h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">', content)
    content = re.sub(r'<h1 className="text-3xl\s+font-bold\s+text-slate-900">', '<h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">', content)

    if content != original:
        with open(filepath, 'w') as f:
            f.write(content)
        print(f"Updated: {filepath}")

def scan_dir(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.js') or file.endswith('.jsx'):
                update_file(os.path.join(root, file))

scan_dir('src/app/portal')
scan_dir('src/app/dashboard')
scan_dir('src/app/account')
