<?php
// Crownedgear Luxury Feedback System Installation Script

// Set headers
header('Content-Type: text/html');

// Define paths
$dataDir = './data';
$voiceDir = $dataDir . '/voice';
$feedbackFile = $dataDir . '/feedback.json';

// Track installation steps
$steps = [];
$success = true;

// Create data directory
if (!file_exists($dataDir)) {
    if (mkdir($dataDir, 0755, true)) {
        $steps[] = [
            'status' => 'success',
            'message' => "Created data directory at $dataDir"
        ];
    } else {
        $success = false;
        $steps[] = [
            'status' => 'error',
            'message' => "Failed to create data directory at $dataDir"
        ];
    }
} else {
    $steps[] = [
        'status' => 'info',
        'message' => "Data directory already exists at $dataDir"
    ];
}

// Set permissions on data directory
if (file_exists($dataDir)) {
    if (chmod($dataDir, 0755)) {
        $steps[] = [
            'status' => 'success',
            'message' => "Set permissions on data directory (755)"
        ];
    } else {
        $steps[] = [
            'status' => 'warning',
            'message' => "Failed to set permissions on data directory. You may need to do this manually: chmod 755 $dataDir"
        ];
    }
}

// Create voice directory
if (!file_exists($voiceDir)) {
    if (mkdir($voiceDir, 0755, true)) {
        $steps[] = [
            'status' => 'success',
            'message' => "Created voice directory at $voiceDir"
        ];
    } else {
        $success = false;
        $steps[] = [
            'status' => 'error',
            'message' => "Failed to create voice directory at $voiceDir"
        ];
    }
} else {
    $steps[] = [
        'status' => 'info',
        'message' => "Voice directory already exists at $voiceDir"
    ];
}

// Set permissions on voice directory
if (file_exists($voiceDir)) {
    if (chmod($voiceDir, 0755)) {
        $steps[] = [
            'status' => 'success',
            'message' => "Set permissions on voice directory (755)"
        ];
    } else {
        $steps[] = [
            'status' => 'warning',
            'message' => "Failed to set permissions on voice directory. You may need to do this manually: chmod 755 $voiceDir"
        ];
    }
}

// Create or check feedback file
if (!file_exists($feedbackFile)) {
    if (file_put_contents($feedbackFile, '[]')) {
        $steps[] = [
            'status' => 'success',
            'message' => "Created feedback file at $feedbackFile"
        ];
    } else {
        $success = false;
        $steps[] = [
            'status' => 'error',
            'message' => "Failed to create feedback file at $feedbackFile"
        ];
    }
} else {
    $steps[] = [
        'status' => 'info',
        'message' => "Feedback file already exists at $feedbackFile"
    ];
}

// Set permissions on feedback file
if (file_exists($feedbackFile)) {
    if (chmod($feedbackFile, 0666)) {
        $steps[] = [
            'status' => 'success',
            'message' => "Set permissions on feedback file (666)"
        ];
    } else {
        $steps[] = [
            'status' => 'warning',
            'message' => "Failed to set permissions on feedback file. You may need to do this manually: chmod 666 $feedbackFile"
        ];
    }
}

// Check PHP extensions
$requiredExtensions = ['json', 'fileinfo', 'mbstring'];
$missingExtensions = [];

foreach ($requiredExtensions as $ext) {
    if (extension_loaded($ext)) {
        $steps[] = [
            'status' => 'success',
            'message' => "PHP extension '$ext' is loaded"
        ];
    } else {
        $missingExtensions[] = $ext;
        $steps[] = [
            'status' => 'error',
            'message' => "PHP extension '$ext' is not loaded"
        ];
    }
}

if (!empty($missingExtensions)) {
    $success = false;
}

// Test API endpoints
$endpoints = [
    'api/feedback/index.php' => 'Feedback API',
    'api/analytics/index.php' => 'Analytics API',
    'api/feedback/voice/index.php' => 'Voice API'
];

foreach ($endpoints as $endpoint => $name) {
    if (file_exists($endpoint)) {
        $steps[] = [
            'status' => 'success',
            'message' => "$name endpoint exists at /$endpoint"
        ];
    } else {
        $success = false;
        $steps[] = [
            'status' => 'error',
            'message' => "$name endpoint not found at /$endpoint"
        ];
    }
}

// Generate HTML output
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Crownedgear Luxury - Installation</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            color: #1a1a1a;
            margin-bottom: 30px;
        }
        .steps {
            margin-bottom: 30px;
        }
        .step {
            padding: 10px 15px;
            margin-bottom: 8px;
            border-radius: 4px;
        }
        .success {
            background-color: #d4edda;
            color: #155724;
            border-left: 5px solid #28a745;
        }
        .error {
            background-color: #f8d7da;
            color: #721c24;
            border-left: 5px solid #dc3545;
        }
        .warning {
            background-color: #fff3cd;
            color: #856404;
            border-left: 5px solid #ffc107;
        }
        .info {
            background-color: #d1ecf1;
            color: #0c5460;
            border-left: 5px solid #17a2b8;
        }
        .summary {
            padding: 15px;
            border-radius: 4px;
            margin-top: 20px;
        }
        .next-steps {
            margin-top: 30px;
            padding: 15px;
            background-color: #e9ecef;
            border-radius: 4px;
        }
        code {
            background: #f4f4f4;
            padding: 2px 5px;
            border-radius: 3px;
        }
    </style>
</head>
<body>
    <h1>Crownedgear Luxury Feedback System - Installation</h1>
    
    <div class="steps">
        <h2>Installation Steps</h2>
        <?php foreach ($steps as $step): ?>
            <div class="step <?php echo $step['status']; ?>">
                <?php echo htmlspecialchars($step['message']); ?>
            </div>
        <?php endforeach; ?>
    </div>
    
    <div class="summary <?php echo $success ? 'success' : 'error'; ?>">
        <h2>Installation <?php echo $success ? 'Completed' : 'Failed'; ?></h2>
        <p>
            <?php if ($success): ?>
                The installation was completed successfully. Your feedback system is ready to use.
            <?php else: ?>
                The installation encountered some issues. Please review the errors above and fix them manually.
            <?php endif; ?>
        </p>
    </div>
    
    <div class="next-steps">
        <h2>Next Steps</h2>
        <ol>
            <li>Delete this installation file (<code>install.php</code>) for security reasons</li>
            <li>Go to <a href="/">the feedback form</a> to test the system</li>
            <li>Visit <a href="/dashboard/">the dashboard</a> to view analytics</li>
        </ol>
    </div>
    
    <footer>
        <p>&copy; <?php echo date('Y'); ?> Crownedgear Luxury. All rights reserved.</p>
    </footer>
</body>
</html> 