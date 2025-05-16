#!/bin/bash

# Crownedgear Luxury Feedback System Deployment Script
echo "▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮"
echo "▮  Crownedgear Luxury Feedback System - Deploy  ▮"
echo "▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮"
echo ""

# Check for FTP credentials
if [ -z "$1" ] || [ -z "$2" ] || [ -z "$3" ]; then
  echo "Usage: ./deploy.sh <ftp-host> <ftp-user> <ftp-password> [remote-path]"
  echo ""
  echo "Example: ./deploy.sh ftp.example.com user password public_html"
  exit 1
fi

FTP_HOST=$1
FTP_USER=$2
FTP_PASS=$3
REMOTE_PATH=${4:-public_html}

echo "⚙️  Building project..."
# Move API routes to allow for static export
echo "  - Moving API routes temporarily..."
mkdir -p src/app/_api 
if [ -d "src/app/api" ]; then
    mv src/app/api/* src/app/_api/ 2>/dev/null
    rm -rf src/app/api
fi

# Run build
npm run build

# Check if build succeeded
if [ $? -ne 0 ]; then
  echo "❌ Build failed. Please check the errors above."
  exit 1
fi

echo "✅ Build completed successfully!"

# Create deployment zip
echo "📦 Creating deployment package..."

# Create a zip file containing the build output
rm -f deploy.zip
zip -r deploy.zip out/ -x "*.DS_Store"

echo "✅ Deployment package created: deploy.zip"

# Confirm with user
echo ""
echo "⚠️  Ready to deploy to $FTP_HOST in directory /$REMOTE_PATH"
echo ""
read -p "Do you want to continue with FTP upload? (y/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Deployment cancelled. You can manually upload the deploy.zip file."
  exit 0
fi

# Try to upload via ftp if lftp is available
if command -v lftp &> /dev/null; then
  echo "🔄 Uploading via FTP..."
  
  # Create a temporary LFTP script
  SCRIPT=$(mktemp)
  cat <<EOF > "$SCRIPT"
open -u $FTP_USER,$FTP_PASS $FTP_HOST
cd /$REMOTE_PATH
mirror -R --delete-first -v out/ ./
bye
EOF

  # Execute the script with lftp
  lftp -f "$SCRIPT"
  
  # Remove the temporary script
  rm "$SCRIPT"
  
  echo "✅ Upload completed! Visit your website to verify the deployment."
else
  echo "⚠️  LFTP not installed. Manual upload required."
  echo "Please upload the contents of the 'out' directory to your server."
fi

# Restore API routes for development
echo "🔄 Restoring development API routes..."
if [ -d "src/app/_api" ]; then
    mkdir -p src/app/api
    mv src/app/_api/* src/app/api/ 2>/dev/null
    rm -rf src/app/_api
fi

echo ""
echo "▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮"
echo "▮  Deployment process completed!                 ▮"
echo "▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮▮"
echo ""
echo "Don't forget to run the installation script after deployment:"
echo "https://yourdomain.com/install.php"
echo "" 