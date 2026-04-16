import re

path = 'src/app/layout.js'
with open(path, 'r') as f:
    content = f.read()

# Instead of blindly replacing, let's substitute the footer tag
# It starts at <footer and ends at </footer>

footer_pattern = re.compile(r'<footer.*?</footer>', re.DOTALL)

# Let's replace the first match
if footer_pattern.search(content):
    content = footer_pattern.sub('<GlobalFooter />', content, count=1)

# Add the import at the top
if 'import GlobalFooter from "@/components/GlobalFooter";' not in content:
    # insert before export const metadata
    content = content.replace('export const metadata = {', 'import GlobalFooter from "@/components/GlobalFooter";\n\nexport const metadata = {')

with open(path, 'w') as f:
    f.write(content)

print("Replaced footer in layout.js")
