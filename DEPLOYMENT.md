# Crownedgear Luxury Feedback System - Deployment Guide

This guide provides step-by-step instructions for deploying the Crownedgear Luxury Feedback System to Hostinger.

## Prerequisites

- A Hostinger hosting account
- FTP client (like FileZilla)
- PHP 7.4 or higher on the hosting

## Deployment Steps

### 1. Build the Project

```bash
npm run build
```

This will generate a static export in the `out` directory with all necessary files.

### 2. What's Included in the Build

The build includes:
- All static assets and pages
- PHP endpoints for feedback, analytics, and voice recording
- An installation script (`install.php`) that helps set up required directories and permissions
- A `.htaccess` file for improved routing and security

The project has been configured so that all necessary files, including PHP backends, are included in the final build.

### 3. Upload Files to Hostinger

1. Log in to your Hostinger control panel
2. Connect to your server using FTP:
   - Host: (from your Hostinger account)
   - Username: (from your Hostinger account)
   - Password: (from your Hostinger account)
   - Port: 21

3. Upload the files:
   - Upload all contents from the `out` directory to your web hosting's public folder (e.g., `public_html`)
   - Make sure to include the hidden `.htaccess` file (you may need to enable viewing hidden files in your FTP client)

### 4. Run the Installation Script

1. Visit `https://yourdomain.com/install.php` in your browser
2. The script will:
   - Create the required data directories
   - Set proper permissions
   - Check for required PHP extensions
   - Verify that API endpoints are accessible
3. Follow any instructions provided by the script to fix issues
4. Delete the `install.php` file when installation is complete

If you prefer to manually set up the directories and permissions:

1. Create the data directories:
   ```
   public_html/
   ├── data/
   │   ├── feedback.json
   │   └── voice/
   ```

2. Set permissions:
   ```
   chmod 755 data
   chmod 755 data/voice
   touch data/feedback.json
   chmod 666 data/feedback.json
   ```

### 5. Configure Hostinger

1. In the Hostinger control panel, go to "Website" → "Hosting" → "Manage"
2. Ensure PHP 7.4 or higher is selected
3. Enable the following PHP extensions if not already enabled:
   - json
   - fileinfo
   - mbstring
4. Make sure mod_rewrite is enabled for the .htaccess file to work properly

### 6. Test the Deployment

1. Visit your website URL
2. Test submitting feedback with text and voice
3. Check that the data is being saved correctly in `data/feedback.json`
4. Visit the dashboard page to ensure analytics are working

## Site Structure

The deployed site has the following structure:
```
public_html/
├── index.html            # Main feedback form page
├── dashboard/            # Analytics dashboard
├── api/
│   ├── feedback/         # Feedback management endpoints
│   │   ├── index.php     # Main feedback API
│   │   └── voice/        # Voice recording management
│   │       └── index.php
│   └── analytics/        # Analytics generation endpoint
│       └── index.php
├── data/                 # Data storage (created by install.php)
│   ├── feedback.json     # Stored feedback data
│   └── voice/            # Voice recording files
├── install.php           # Installation script (delete after use)
├── .htaccess             # Apache configuration for routing and security
└── _next/                # Static assets and compiled code
```

## Development Notes

When making future updates to the project, remember:

1. The Next.js API routes have been moved to `src/app/_api` to prevent them from being included in the static build. After making changes, you'll need to:
   - Manually copy any updated API route files to the PHP implementations
   - Keep the PHP endpoints in sync with any changes to the frontend logic

2. Alternatively, you can maintain two separate versions:
   - A development version that uses Next.js API routes
   - A production version that uses PHP endpoints

## Troubleshooting

### Voice Recording Issues

If voice recordings are not playing back:

1. Check browser console for errors
2. Verify that the audio files are being correctly uploaded to `data/voice/`
3. Ensure the PHP file handling is working correctly
4. Check file permissions on the `data/voice` directory

### API Response Issues

If API calls are failing:

1. Check the browser console for detailed errors
2. Verify PHP error logs on Hostinger
3. Check that the paths in the PHP files are correct for your server setup

### .htaccess Issues

If you're experiencing issues with URLs or routing:

1. Verify that mod_rewrite is enabled on your hosting
2. Check the Hostinger control panel for Apache settings
3. Look for any errors in the Apache error logs

### File Permissions

If you encounter "Permission denied" errors:

1. Ensure the `data` directory and its subdirectories have write permissions (755)
2. Ensure the `feedback.json` file has read/write permissions (666)

## Security Considerations

This setup is designed for initial deployment. For a production environment, consider:

1. Adding proper authentication to the dashboard
2. Adding CSRF protection to the API endpoints
3. Implementing rate limiting
4. Using HTTPS for all communications
5. Setting up proper error logging

## Support

For any issues or questions regarding the deployment, please contact the development team.

---

© Crownedgear Luxury. All rights reserved. 