#!/bin/bash

# Install Redux dependencies for Zen admin dashboard
echo "Installing Redux dependencies..."

cd Zen

# Install Redux Toolkit, React-Redux, and Redux Persist
npm install @reduxjs/toolkit react-redux redux-persist

# Install TypeScript types for Redux Persist
npm install --save-dev @types/redux-persist

echo "Redux dependencies installed successfully!"
echo ""
echo "Dependencies added:"
echo "- @reduxjs/toolkit: Modern Redux with best practices"
echo "- react-redux: React bindings for Redux"
echo "- redux-persist: State persistence across browser sessions"
echo "- @types/redux-persist: TypeScript definitions"
echo ""
echo "Next steps:"
echo "1. Start the development server: npm run dev"
echo "2. Navigate to /admin to test the Redux integration"
echo "3. Check the Redux Test Component on the dashboard"
echo "4. Use Redux DevTools browser extension for debugging"
