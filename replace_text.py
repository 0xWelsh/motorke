import os
import re

def replace_text_colors(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
            
    def replacer(match):
        prefix = match.group(1) # 'text-' or 'dark:text-'
        color = match.group(2) # e.g. 'slate'
        shade = int(match.group(3)) # e.g. '400'
        
        # Don't replace if it's already black or white
        if color in ['black', 'white']:
            return match.group(0)
            
        # We classify text as light if the shade is < 500
        # If shade is < 500, it generally means light text -> map to white
        # If shade is >= 500, it generally means dark text -> map to black
        new_color = 'black' if shade >= 500 else 'white'
        
        return f"{prefix}{new_color}"

    # Match patterns like text-slate-500, dark:text-gray-400, hover:text-emerald-600
    # Also group:1 matches prefixes safely.
    new_content = re.sub(r'\b([a-z0-9:-]*text-)([a-z]+)-(\d+)\b', replacer, content)
    
    # Let's also check if they did text-slate-900/50 (opacity modifiers)
    # The regex \b matched at the end of the digit. If followed by /50, it won't consume the /50
    # Wait, \b matches boundary between digit and `/`. So the replacement stays valid.
    
    # Also handles cases like: text-muted, text-primary, text-secondary?
    # No, those don't have numbers. We only map numbered shades here.
    
    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    count = 0
    for root, _, files in os.walk('src'):
        for file in files:
            if file.endswith(('.js', '.jsx', '.ts', '.tsx', '.css')):
                if replace_text_colors(os.path.join(root, file)):
                    print(f"Updated {os.path.join(root, file)}")
                    count += 1
    print(f"Finished updating {count} files.")

if __name__ == "__main__":
    main()
