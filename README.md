# node-mediaplan-backend
 // crawl4.ai

## Frontend Error Handling Prompt

This prompt is for implementing a unified error handling system in the frontend application that works with our backend error responses.

```
You are tasked with implementing a unified error handling system for our React frontend application. The backend already returns standardized error responses in the following format:

{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": {} // Optional additional details
  }
}

Error codes from the backend include:
- UNAUTHORIZED: Authentication issues
- INSUFFICIENT_TOKENS: User lacks required tokens/credits
- INVALID_INPUT: Form validation or input problems
- NOT_FOUND: Requested resource doesn't exist
- RATE_LIMIT_EXCEEDED: Too many requests (includes retryAfter in details)
- FIREBASE_AUTH_ERROR: Authentication system issues
- FIREBASE_DB_ERROR: Database access problems
- INTERNAL_ERROR: Unexpected server errors
- SERVICE_UNAVAILABLE: System temporarily down

For AI service-specific errors (OpenAI and Gemini):
- INSUFFICIENT_TOKENS: Special handling needed for subscription/token purchase prompts
- INTERNAL_ERROR: When AI services return errors (includes service name in details)

Your task:

1. Create a centralized error handling utility that:
   - Intercepts all API requests (using axios interceptors or similar)
   - Processes error responses consistently
   - Maps backend error codes to user-friendly messages
   - Provides appropriate UI feedback based on error type
   - Handles AI-specific errors with specialized messaging

2. Implement user-friendly error components that:
   - Display appropriate severity levels (warning vs. error)
   - Provide clear guidance on how to resolve the issue
   - Offer retry/refresh options when appropriate
   - Show technical details only when useful for debugging
   - Include specialized handling for AI service errors (token purchase prompts, service status)
   
3. Create error boundaries to:
   - Prevent UI crashes from unexpected errors
   - Capture client-side runtime errors
   - Log errors for monitoring purposes
   - Present appropriate fallback UI

4. Design a notification system that:
   - Distinguishes between different error types
   - Provides toast notifications for transient errors
   - Shows modal dialogs for blocking errors
   - Manages multiple simultaneous errors intelligently
   - Special handling for AI-related errors with clear next steps

For AI-specific errors, the user experience should guide users to:
- Purchase more tokens when INSUFFICIENT_TOKENS is returned
- Understand when AI services are unavailable
- Retry with modified inputs when appropriate
- See relevant troubleshooting steps based on the specific AI service

The implementation should follow our application's design system, provide a consistent user experience, and handle both expected and unexpected error conditions.
```