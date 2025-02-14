# Website Analyzer API

## Endpoints

### 1. Convert HTML to Markdown
```
GET /analyze-website/markdown?url={url}
```
Returns markdown version of HTML content with image information.

**Response:**
```json
{
  "markdown": "# Title\n\nContent...",
  "images": [
    { "altText": "image description" }
  ]
}
```

### 2. Analyze Links
```
GET /analyze-website/links?url={url}
```
Collects all links and generates statistics.

**Response:**
```json
{
  "total": 15,
  "external": 8,
  "internal": 7,
  "withImages": 3,
  "items": [
    {
      "url": "https://example.com/link1",
      "text": "Link 1",
      "isExternal": false,
      "hasImage": false
    }
  ]
}
```

### 3. Page Metrics
```
GET /analyze-website/metrics?url={url}
```
Analyzes text metrics and sentiment.

**Response:**
```json
{
  "wordCount": 250,
  "charCount": 1200,
  "paragraphCount": 15,
  "headingsCount": 4,
  "averageWordLength": 5,
  "sentiment": {
    "score": 18.5,
    "comparative": 0.074,
    "keywords": [
      { "word": "example", "sentiment": 1.2 }
    ]
  },
  "language": "en"
}
```

## Note
- All endpoints require valid URL parameter
- Invalid/missing URL returns 400 error