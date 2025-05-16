<?php
// Set headers for cross-origin requests and JSON response
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Define paths
$dataDir = '../../data';
$feedbackFile = $dataDir . '/feedback.json';
$voiceDir = $dataDir . '/voice';

// Create directories if they don't exist
if (!file_exists($dataDir)) {
    mkdir($dataDir, 0755, true);
}
if (!file_exists($voiceDir)) {
    mkdir($voiceDir, 0755, true);
}

// Initialize feedback file if it doesn't exist
if (!file_exists($feedbackFile)) {
    file_put_contents($feedbackFile, json_encode([]));
}

// Handle GET request - return feedback data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    try {
        $feedbackData = json_decode(file_get_contents($feedbackFile), true) ?: [];
        echo json_encode([
            'success' => true,
            'data' => $feedbackData
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'INTERNAL_ERROR',
                'message' => 'Failed to read feedback data: ' . $e->getMessage()
            ]
        ]);
    }
    exit();
}

// Handle POST request - save feedback
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get existing feedback
        $existingFeedback = json_decode(file_get_contents($feedbackFile), true) ?: [];
        
        // Create new feedback item
        $feedbackId = 'feedback_' . time();
        $timestamp = date('c');
        
        // Process form data
        $sections = [];
        foreach ($_POST as $key => $value) {
            if (preg_match('/^(.+)_(\d+)_(.+)$/', $key, $matches)) {
                $sectionId = $matches[1];
                $questionIndex = $matches[2];
                $responseType = $matches[3];
                
                if (!isset($sections[$sectionId])) {
                    $sections[$sectionId] = [
                        'id' => $sectionId
                    ];
                }
                
                if ($responseType === 'text') {
                    $sections[$sectionId]['text'] = $value;
                }
            }
        }
        
        // Process voice files
        foreach ($_FILES as $key => $file) {
            if (preg_match('/^(.+)_(\d+)_voice$/', $key, $matches)) {
                $sectionId = $matches[1];
                $questionIndex = $matches[2];
                
                if ($file['error'] === UPLOAD_ERR_OK) {
                    $fileName = $feedbackId . '_' . $sectionId . '_' . $questionIndex . '.webm';
                    $filePath = $voiceDir . '/' . $fileName;
                    
                    if (move_uploaded_file($file['tmp_name'], $filePath)) {
                        if (!isset($sections[$sectionId])) {
                            $sections[$sectionId] = [
                                'id' => $sectionId
                            ];
                        }
                        
                        $sections[$sectionId]['audio'] = [
                            'url' => '/data/voice/' . $fileName
                        ];
                    }
                }
            }
        }
        
        // Create the feedback response
        $feedbackResponse = [
            'id' => $feedbackId,
            'timestamp' => $timestamp,
            'type' => 'text',
            'sections' => $sections,
            'metadata' => [
                'browser' => $_SERVER['HTTP_USER_AGENT'] ?? 'unknown',
                'ipAddress' => $_SERVER['REMOTE_ADDR'] ?? 'unknown'
            ]
        ];
        
        // Add to existing feedback
        $existingFeedback[] = $feedbackResponse;
        
        // Save to file
        file_put_contents($feedbackFile, json_encode($existingFeedback, JSON_PRETTY_PRINT));
        
        // Return success
        echo json_encode([
            'success' => true,
            'data' => $feedbackResponse
        ]);
    } catch (Exception $e) {
        http_response_code(500);
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'INTERNAL_ERROR',
                'message' => 'Failed to save feedback: ' . $e->getMessage()
            ]
        ]);
    }
    exit();
}

// If we get here, it's an unsupported method
http_response_code(405);
echo json_encode([
    'success' => false,
    'error' => [
        'code' => 'METHOD_NOT_ALLOWED',
        'message' => 'Method not allowed'
    ]
]);
?> 