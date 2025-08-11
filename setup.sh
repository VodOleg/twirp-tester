#!/bin/bash

# Quick setup script for Twirp Proto Tester

echo "🚀 Setting up Twirp Proto Tester..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Check if PM2 is installed globally
if ! command -v pm2 &> /dev/null; then
    echo "📋 PM2 not found. Installing PM2 globally..."
    sudo npm install -g pm2
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install PM2. You can run in development mode with 'npm start'"
        exit 1
    fi
fi

echo "✅ PM2 $(pm2 --version) found"

# Create logs directory
mkdir -p logs

# Ask user if they want to set up as a service
read -p "🤔 Do you want to set up as a background service? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔧 Setting up background service..."
    
    # Start with PM2
    pm2 start ecosystem.config.js
    
    # Setup startup
    echo "🔧 Setting up auto-startup..."
    pm2 startup
    pm2 save
    
    echo ""
    echo "✅ Service setup complete!"
    echo "📊 Service status:"
    pm2 status twirp-proto-tester
    echo ""
    echo "🌐 Service is running at http://localhost:8765"
    echo ""
    echo "💡 Management commands:"
    echo "   ./service.sh status    - Check status"
    echo "   ./service.sh logs      - View logs"
    echo "   ./service.sh restart   - Restart service"
    echo "   ./service.sh open      - Open in browser"
    echo "   ./health-check.sh      - Health check"
else
    echo "✅ Setup complete!"
    echo ""
    echo "🚀 To start in development mode:"
    echo "   npm start"
    echo ""
    echo "🔧 To set up as service later:"
    echo "   pm2 start ecosystem.config.js"
    echo "   pm2 startup && pm2 save"
fi

echo ""
echo "📖 See README.md for detailed usage instructions"
