<?php
// Set headers for cross-origin requests and JSON response
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only allow GET method
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'METHOD_NOT_ALLOWED',
            'message' => 'Method not allowed'
        ]
    ]);
    exit();
}

// Define paths
$dataDir = '../../data';
$feedbackFile = $dataDir . '/feedback.json';

// Check if feedback file exists
if (!file_exists($feedbackFile)) {
    echo json_encode([
        'success' => true,
        'data' => [
            'totalResponses' => 0,
            'averageSentiment' => 0,
            'responsesByType' => [
                'text' => 0,
                'voice' => 0
            ],
            'sentimentDistribution' => [
                'positive' => 0,
                'neutral' => 0,
                'negative' => 0
            ],
            'topSections' => [],
            'recentTrends' => []
        ]
    ]);
    exit();
}

try {
    // Read feedback data
    $feedback = json_decode(file_get_contents($feedbackFile), true) ?: [];
    
    // Calculate analytics
    $totalResponses = count($feedback);
    
    // Initialize counters
    $responsesByType = ['text' => 0, 'voice' => 0];
    $sentimentDistribution = ['positive' => 0, 'neutral' => 0, 'negative' => 0];
    $sentimentScoreSum = 0;
    $sectionStats = [];
    
    // Process feedback data
    foreach ($feedback as $item) {
        // Count response types
        $type = isset($item['type']) ? $item['type'] : 'text';
        $responsesByType[$type] = ($responsesByType[$type] ?? 0) + 1;
        
        // Process sentiment
        if (isset($item['sentiment']['label'])) {
            $label = $item['sentiment']['label'];
            $sentimentDistribution[$label] = ($sentimentDistribution[$label] ?? 0) + 1;
            $sentimentScoreSum += $item['sentiment']['score'] ?? 0.5;
        } else {
            $sentimentDistribution['neutral'] = ($sentimentDistribution['neutral'] ?? 0) + 1;
            $sentimentScoreSum += 0.5;
        }
        
        // Process sections
        if (isset($item['sections']) && is_array($item['sections'])) {
            foreach ($item['sections'] as $sectionId => $section) {
                if (!isset($sectionStats[$sectionId])) {
                    $sectionStats[$sectionId] = [
                        'responseCount' => 0,
                        'sentimentSum' => 0
                    ];
                }
                
                $sectionStats[$sectionId]['responseCount']++;
                $sectionStats[$sectionId]['sentimentSum'] += $item['sentiment']['score'] ?? 0.5;
            }
        }
    }
    
    // Calculate average sentiment
    $averageSentiment = $totalResponses > 0 ? $sentimentScoreSum / $totalResponses : 0;
    
    // Generate top sections
    $topSections = [];
    foreach ($sectionStats as $sectionId => $stats) {
        $topSections[] = [
            'sectionId' => $sectionId,
            'responseCount' => $stats['responseCount'],
            'averageSentiment' => $stats['responseCount'] > 0 ? $stats['sentimentSum'] / $stats['responseCount'] : 0
        ];
    }
    
    // Sort by response count
    usort($topSections, function($a, $b) {
        return $b['responseCount'] <=> $a['responseCount'];
    });
    
    // Generate recent trends (last 7 days)
    $recentTrends = [];
    for ($i = 6; $i >= 0; $i--) {
        $date = date('Y-m-d', strtotime("-$i days"));
        $dayFeedback = array_filter($feedback, function($item) use ($date) {
            return isset($item['timestamp']) && substr($item['timestamp'], 0, 10) === $date;
        });
        
        $dayCount = count($dayFeedback);
        $daySentimentSum = 0;
        
        foreach ($dayFeedback as $item) {
            $daySentimentSum += $item['sentiment']['score'] ?? 0.5;
        }
        
        $recentTrends[] = [
            'date' => $date,
            'count' => $dayCount,
            'averageSentiment' => $dayCount > 0 ? $daySentimentSum / $dayCount : 0
        ];
    }
    
    // Return analytics data
    echo json_encode([
        'success' => true,
        'data' => [
            'totalResponses' => $totalResponses,
            'averageSentiment' => $averageSentiment,
            'responsesByType' => $responsesByType,
            'sentimentDistribution' => $sentimentDistribution,
            'topSections' => $topSections,
            'recentTrends' => $recentTrends
        ]
    ]);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => [
            'code' => 'INTERNAL_ERROR',
            'message' => 'Failed to generate analytics: ' . $e->getMessage()
        ]
    ]);
}
?> 