/**
 * Convert technical error messages into user-friendly messages
 */
export function getUserFriendlyErrorMessage(error: any): string {
  if (!error) {
    return 'An unexpected error occurred. Please try again.';
  }

  const errorMessage = error.message || error.toString();
  const errorName = error.name;

  // Handle abort errors - usually happen when user navigates away quickly
  if (errorName === 'AbortError' || errorMessage === 'Aborted') {
    return 'Please try again. The request was interrupted.';
  }

  // Handle network errors
  if (errorMessage.includes('Network request failed') || errorMessage.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  // Handle timeout errors
  if (errorMessage.includes('timeout') || errorMessage.includes('Request timed out')) {
    return 'Request timed out. Please try again.';
  }

  // Handle authentication errors
  if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('Email not confirmed')) {
    return 'Invalid email or password. Please check your credentials.';
  }

  if (errorMessage.includes('User not found') || errorMessage.includes('Invalid credentials')) {
    return 'Invalid email or password. Please check your credentials.';
  }

  if (errorMessage.includes('Email rate limit exceeded')) {
    return 'Too many attempts. Please wait a few minutes before trying again.';
  }

  if (errorMessage.includes('Password should be at least')) {
    return 'Password must be at least 6 characters long.';
  }

  if (errorMessage.includes('User already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }

  if (errorMessage.includes('Invalid email')) {
    return 'Please enter a valid email address.';
  }

  // Handle database/server errors
  if (errorMessage.includes('duplicate key') || errorMessage.includes('already exists')) {
    return 'This information already exists. Please try different details.';
  }

  if (errorMessage.includes('permission denied') || errorMessage.includes('not authorized')) {
    return 'You don\'t have permission to perform this action.';
  }

  if (errorMessage.includes('not found') || errorMessage.includes('does not exist')) {
    return 'The requested information could not be found.';
  }

  // Handle validation errors
  if (errorMessage.includes('required') || errorMessage.includes('cannot be empty')) {
    return 'Please fill in all required fields.';
  }

  if (errorMessage.includes('invalid format') || errorMessage.includes('malformed')) {
    return 'Please check the format of your information and try again.';
  }

  // Handle quota/limit errors
  if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
    return 'Too many requests. Please wait a moment and try again.';
  }

  // Handle server errors
  if (errorMessage.includes('Internal server error') || errorMessage.includes('500')) {
    return 'Server error. Please try again in a few moments.';
  }

  if (errorMessage.includes('Service unavailable') || errorMessage.includes('503')) {
    return 'Service temporarily unavailable. Please try again later.';
  }

  // For unknown errors, return a generic but helpful message
  // But still log the actual error for debugging
  console.error('Unmapped error:', error);
  
  return 'Something went wrong. Please try again or contact support if the problem persists.';
}

/**
 * Get user-friendly error message specifically for authentication flows
 */
export function getAuthErrorMessage(error: any): string {
  const baseMessage = getUserFriendlyErrorMessage(error);
  
  // Add auth-specific context to generic messages
  if (baseMessage === 'Something went wrong. Please try again or contact support if the problem persists.') {
    return 'Unable to sign in. Please check your credentials and try again.';
  }
  
  return baseMessage;
}

/**
 * Get user-friendly error message for network/API operations
 */
export function getApiErrorMessage(error: any, operation: string = 'complete this action'): string {
  const baseMessage = getUserFriendlyErrorMessage(error);
  
  // Add operation context to generic messages
  if (baseMessage === 'Something went wrong. Please try again or contact support if the problem persists.') {
    return `Unable to ${operation}. Please try again.`;
  }
  
  return baseMessage;
}