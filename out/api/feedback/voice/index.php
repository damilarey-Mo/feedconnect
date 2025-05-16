<?php
// Set headers for cross-origin requests
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Define paths
$voiceDir = '../../../data/voice';

// Create voice directory if it doesn't exist
if (!file_exists($voiceDir)) {
    mkdir($voiceDir, 0755, true);
}

// Handle POST request - save voice recording
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Check if audio file was uploaded
        if (!isset($_FILES['audio']) || $_FILES['audio']['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => [
                    'code' => 'INVALID_INPUT',
                    'message' => 'No audio file provided or upload error'
                ]
            ]);
            exit();
        }
        
        // Generate a unique filename
        $fileName = 'voice_' . time() . '.webm';
        $filePath = $voiceDir . '/' . $fileName;
        
        // Move uploaded file to target directory
        if (move_uploaded_file($_FILES['audio']['tmp_name'], $filePath)) {
            // Return success response
            header('Content-Type: application/json');
            echo json_encode([
                'success' => true,
                'data' => [
                    'audioUrl' => '/data/voice/' . $fileName,
                    'timestamp' => date('c'),
                    'duration' => 0 // You would need additional processing to determine actual duration
                ]
            ]);
        } else {
            throw new Exception('Failed to move uploaded file');
        }
    } catch (Exception $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'INTERNAL_ERROR',
                'message' => 'Failed to process voice recording: ' . $e->getMessage()
            ]
        ]);
    }
    exit();
}

// Handle GET request - stream voice recording
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get filename from query string or URL path
    $fileName = isset($_GET['file']) ? $_GET['file'] : null;
    
    // If no filename provided directly, try to extract from path info
    if (!$fileName) {
        $pathInfo = pathinfo($_SERVER['REQUEST_URI']);
        $fileName = $pathInfo['basename'];
    }
    
    // Security check - only allow webm files with valid naming pattern
    if (!$fileName || !preg_match('/^voice_\d+\.webm$/', $fileName)) {
        http_response_code(400);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'INVALID_INPUT',
                'message' => 'Invalid or missing filename'
            ]
        ]);
        exit();
    }
    
    $filePath = $voiceDir . '/' . $fileName;
    
    // Check if file exists
    if (!file_exists($filePath)) {
        http_response_code(404);
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => [
                'code' => 'NOT_FOUND',
                'message' => 'Voice recording not found'
            ]
        ]);
        exit();
    }
    
    // Stream the file
    $fileSize = filesize($filePath);
    header('Content-Type: audio/webm');
    header('Content-Length: ' . $fileSize);
    header('Content-Disposition: inline; filename="' . $fileName . '"');
    header('Accept-Ranges: bytes');
    
    // Support for range requests
    if (isset($_SERVER['HTTP_RANGE'])) {
        $range = explode('=', $_SERVER['HTTP_RANGE']);
        $start = intval(explode('-', $range[1])[0]);
        $end = $fileSize - 1;
        
        header('HTTP/1.1 206 Partial Content');
        header('Content-Range: bytes ' . $start . '-' . $end . '/' . $fileSize);
        header('Content-Length: ' . ($end - $start + 1));
        
        $fp = fopen($filePath, 'rb');
        fseek($fp, $start);
        $data = fread($fp, $end - $start + 1);
        fclose($fp);
        echo $data;
    } else {
        // Output the whole file
        readfile($filePath);
    }
    exit();
}

// If we get here, it's an unsupported method
http_response_code(405);
header('Content-Type: application/json');
echo json_encode([
    'success' => false,
    'error' => [
        'code' => 'METHOD_NOT_ALLOWED',
        'message' => 'Method not allowed'
    ]
]);
?> 