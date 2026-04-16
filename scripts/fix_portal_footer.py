import re

path = 'src/app/layout.js'
with open(path, 'r') as f:
    content = f.read()

# Modify the isPortal regex / logic to properly catch /portal paths
# Wait, let's see how isPortal/isAdmin is implemented currently

import os
