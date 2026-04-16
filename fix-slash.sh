#!/bin/bash
sed -i 's/\.dark \.text-\[#111111\]/.dark .text-\\[\\#111111\\]/g' src/app/globals.css
sed -i 's/\.dark \.border-\[#111111\]/.dark .border-\\[\\#111111\\]/g' src/app/globals.css
