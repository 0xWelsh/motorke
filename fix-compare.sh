#!/bin/bash
FILE="src/app/compare/CompareClient.js"

sed -i 's/rounded-nonel/rounded-none/g' $FILE
sed -i 's/rounded-nonexl/rounded-none/g' $FILE
sed -i 's/rounded-none2rem\]/rounded-none/g' $FILE
