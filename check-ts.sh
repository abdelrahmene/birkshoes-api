#!/bin/bash
cd "C:\\Users\\abdelrahmene fares\\Desktop\\birkshoes-api"
echo "Testing TypeScript compilation..."
npx tsc --noEmit
if [ $? -eq 0 ]; then
    echo "✅ TypeScript compilation successful!"
else
    echo "❌ TypeScript compilation failed!"
fi
