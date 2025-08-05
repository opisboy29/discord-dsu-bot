#!/bin/bash
# Quick setup script by opisboy29

echo "🤖 Setting up DSU Discord Bot..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "⚠️  Please edit .env with your Discord bot token and channel ID"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs

echo "🎉 Setup complete!"
echo "📖 Next steps:"
echo "   1. Edit .env with your bot credentials"
echo "   2. Run 'npm test' to test connection"
echo "   3. Run 'npm start' to start the bot" 