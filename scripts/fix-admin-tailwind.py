import os
import glob
import re

def fix_tailwind(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Fix bad replacements from before:
    content = content.replace('bg-#ff5a2f', 'bg-[#ff5a2f]')
    content = content.replace('text-#ff5a2f', 'text-[#ff5a2f]')
    content = content.replace('border-#ff5a2f', 'border-[#ff5a2f]')
    content = content.replace('shadow-#ff5a2f', 'shadow-[#ff5a2f]')
    content = content.replace('bg-#ff5a2f]/20', 'bg-[#ff5a2f]/20')
    content = content.replace('bg-#ff5a2f]/10', 'bg-[#ff5a2f]/10')
    content = content.replace('hover:bg-#ff5a2f', 'hover:bg-[#ff5a2f]')
    content = content.replace('hover:text-#ff5a2f', 'hover:text-[#ff5a2f]')
    content = content.replace('ring-#ff5a2f', 'ring-[#ff5a2f]')
    content = content.replace('group-hover:text-#ff5a2f', 'group-hover:text-[#ff5a2f]')
    
    with open(filepath, 'w') as f:
        f.write(content)

admin_files = glob.glob('src/app/admin/**/*.js', recursive=True)
for f in admin_files:
    fix_tailwind(f)
    
print("Fixed tailwind classes in admin files.")
