#!/bin/bash
FILE="src/app/globals.css"

# Remove the previously appended dark mode section
sed -i '/\/\* Dark Mode Extrusions \*\//,$d' $FILE

# Append the correct dark mode logic
cat << 'INNER_EOF' >> $FILE
/* Dark Mode Extrusions */
.dark {
  --bg:           #0a0a0a;
  --surface:      #111111;
  --text:         #f7f6f3;
  --text-muted:   #a1a1aa;
  --text-faint:   #71717a;
  
  --border:       #27272a;
  --border-light: #18181b;
  
  color-scheme: dark;
}

/* Proper Dark Mode: everything settles into dark tones rather than a strict negative invert */
.dark body { background: #0a0a0a !important; color: #f7f6f3 !important; }
.dark .bg-\[\#f7f6f3\] { background-color: #0a0a0a !important; }
.dark .bg-white { background-color: #111111 !important; color: #f7f6f3 !important; }

/* Keep dark sections dark (do not flip them to white!) */
.dark .bg-\[\#111111\] {
  background-color: #18181b !important;
  color: #ffffff !important;
}

/* Typography shifts for light-mode text */
.dark .text-slate-900 { color: #f7f6f3 !important; }
.dark .text-slate-800 { color: #e5e5e5 !important; }
.dark .text-slate-700 { color: #d4d4d8 !important; }
.dark .text-slate-600 { color: #a1a1aa !important; }
.dark .text-slate-500 { color: #71717a !important; }

/* Borders */
.dark .border-\[\#ddd4c8\] { border-color: #27272a !important; }
.dark .border-slate-200 { border-color: #27272a !important; }
.dark .border-slate-300 { border-color: #3f3f46 !important; }

/* Keep white text white in dark mode (was incorrectly inverted to black) */
.dark .text-white { color: #ffffff !important; }
.dark .text-white\/80 { color: rgba(255, 255, 255, 0.8) !important; }
.dark .text-white\/60 { color: rgba(255, 255, 255, 0.6) !important; }

/* Light backgrounds to dark */
.dark .bg-slate-50 { background-color: #18181b !important; }
.dark .bg-slate-100 { background-color: #27272a !important; }

/* Keep Neon Orange Native */
.dark .text-\[\#ff5a2f\] { color: #ff5a2f !important; }
.dark .bg-\[\#ff5a2f\] { background-color: #ff5a2f !important; color: #ffffff !important; }

/* Logo Inversion */
.dark img[src*="logo"], .dark img[alt*="Motorke"] {
  filter: invert(1) brightness(2);
}

/* Compare Engine specific fixes for dark mode */
.dark .bg-\[\#f8fafc\] { background-color: #111111 !important; }
.dark .border-\[\#e2e8f0\] { border-color: #27272a !important; }
INNER_EOF
