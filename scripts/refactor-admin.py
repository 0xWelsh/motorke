import os
import glob
import re

def process_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Colors
    content = content.replace('bg-slate-50 ', 'bg-[#f7f6f3] ')
    content = content.replace('bg-slate-50"', 'bg-[#f7f6f3]"')
    
    # Switch Emerald to the Industrial Orange
    content = content.replace('emerald-600', '#ff5a2f')
    content = content.replace('emerald-500', '#ff5a2f')
    content = content.replace('emerald-700', '#e54a1f')
    content = content.replace('emerald-50', '#ff5a2f]/10')
    content = content.replace('emerald-100', '#ff5a2f]/20')
    content = content.replace('emerald-900', 'slate-900')
    
    # Borders
    content = content.replace('border-slate-200', 'border-[#ddd4c8]')
    
    # Rounded corners
    content = re.sub(r'rounded-(xl|2xl|full|lg|md|sm)', 'rounded-none', content)
    content = re.sub(r'(?<!-)rounded(?!-)', 'rounded-none', content)
    # Just to be safe for double replacements
    content = content.replace('rounded-none-none', 'rounded-none')
    
    # Shadows
    content = re.sub(r'shadow-(sm|md|lg|xl|2xl)(\/[0-9]+)?', 'shadow-none', content)
    content = re.sub(r'shadow-slate-[0-9]+', 'shadow-none', content)
    
    # Replace some typical typography rules for Admin headers
    content = content.replace('text-2xl font-bold', 'text-2xl font-black uppercase tracking-widest')
    content = content.replace('text-xl font-bold', 'text-xl font-black uppercase tracking-widest')
    content = content.replace('text-lg font-semibold', 'text-lg font-black uppercase tracking-widest')
    content = content.replace('text-sm font-medium', 'text-[11px] font-bold uppercase tracking-widest')

    with open(filepath, 'w') as f:
        f.write(content)

admin_files = glob.glob('src/app/admin/**/*.js', recursive=True)
for f in admin_files:
    process_file(f)
    
print(f"Processed {len(admin_files)} files in admin portal.")
