# Crownedgear Luxury Feedback System

A modern and elegant feedback collection system with analytics dashboard for Crownedgear Luxury brand.

## Updated Features

- New focused feedback questions specific to Crownedgear Luxury brand
- Seven targeted feedback sections:
  1. Product Perception
  2. Pricing and Value
  3. Brand Image & Awareness
  4. Customer Experience
  5. Communication & Engagement
  6. Shopping Behavior
  7. Competitor Comparison
- Responsive and animated UI
- Voice recording feedback option
- Elegant luxury branding throughout
- Professional analytics dashboard

## Deployment to Hostinger

Follow these steps to deploy the Crownedgear Luxury Feedback System to Hostinger:

### 1. Build the project

```bash
npm run build
```

This will generate a static export in the `out` directory.

### 2. Upload to Hostinger

1. Log in to your Hostinger control panel
2. Navigate to File Manager or use FTP credentials with an FTP client like FileZilla
3. Upload all contents from the `out` directory to your web hosting's public folder (usually `public_html`)

### 3. Create Server-Side Functionality

Since this is a static export, you'll need to implement server functionality for API routes separately:

#### Option 1: Setup PHP API endpoints
Create PHP files to handle data storage and retrieval. For example:
```php
// save-feedback.php
<?php
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
$feedbackFile = 'data/feedback.json';

// Create directory if it doesn't exist
if (!file_exists('data')) {
    mkdir('data', 0755, true);
}

// Initialize empty array if file doesn't exist
if (!file_exists($feedbackFile)) {
    file_put_contents($feedbackFile, json_encode([]));
}

// Get existing feedback
$existingFeedback = json_decode(file_get_contents($feedbackFile), true);

// Add new feedback
$data['id'] = uniqid();
$data['timestamp'] = date('c');
$existingFeedback[] = $data;

// Save feedback
file_put_contents($feedbackFile, json_encode($existingFeedback));

echo json_encode(['success' => true]);
?>
```

#### Option 2: Use a Backend Service

Consider using a backend service like:
- Firebase Realtime Database
- Supabase
- Vercel Serverless Functions

### 4. Update Client Code

Update the fetch URLs in the client code to point to your new API endpoints:

1. Adjust feedback form submission to point to your PHP endpoint
2. Update dashboard data fetching to read from your data source

### 5. Configure Hostinger Settings

1. In the Hostinger control panel, go to "Website" → "Hosting" → "Manage"
2. Set the correct document root to point to where you uploaded the files
3. Ensure PHP is enabled if you're using PHP for API functionality

## Development

To run the project locally:

```bash
npm install
npm run dev
```

## Features

- Modern UI with animations
- Text and voice feedback collection
- Analytics dashboard
- Sentiment analysis
- Professional brand representation
- Mobile-responsive design

## Technologies Used

- Next.js
- React
- TypeScript
- Framer Motion
- Tailwind CSS 