/**
 * iOS Human Interface Guidelines Constants
 * 
 * This file contains design constants that align with Apple's HIG standards
 * to ensure our app feels native on iOS platforms.
 */

export const IOSTypography = {
  // iOS Typography Scale (based on iOS 17 HIG)
  largeTitle: {
    fontSize: 34,
    lineHeight: 41,
    fontWeight: '700' as const,
  },
  title1: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: '700' as const,
  },
  title2: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700' as const,
  },
  title3: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  headline: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '600' as const,
  },
  body: {
    fontSize: 17,
    lineHeight: 22,
    fontWeight: '400' as const,
  },
  callout: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: '400' as const,
  },
  subheadline: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '400' as const,
  },
  footnote: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '400' as const,
  },
  caption1: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as const,
  },
  caption2: {
    fontSize: 11,
    lineHeight: 13,
    fontWeight: '400' as const,
  },
};

export const IOSSpacing = {
  // iOS Standard Spacing
  extraTight: 4,
  tight: 8,
  medium: 12,
  standard: 16,
  comfortable: 20,
  loose: 24,
  extraLoose: 32,
  
  // Content margins
  contentMargin: 16,
  sectionSpacing: 24,
  
  // Touch targets
  minimumTouchTarget: 44,
  buttonHeight: 50, // Recommended for primary actions
  inputHeight: 44,
};

export const IOSBorderRadius = {
  // iOS Corner Radius Standards
  small: 8,
  medium: 12,
  large: 16,
  button: 12, // Standard for buttons and interactive elements
  card: 12,   // Standard for cards and containers
};

export const IOSColors = {
  // iOS System Colors (use system colors when possible)
  systemBlue: '#007AFF',
  systemGreen: '#34C759',
  systemIndigo: '#5856D6',
  systemOrange: '#FF9500',
  systemPink: '#FF2D92',
  systemPurple: '#AF52DE',
  systemRed: '#FF3B30',
  systemTeal: '#5AC8FA',
  systemYellow: '#FFCC00',
  
  // Semantic colors
  destructive: '#FF3B30',
  warning: '#FF9500',
  success: '#34C759',
  
  // Gray scale
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
};

export const IOSShadows = {
  // iOS-style shadows for depth
  subtle: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  small: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  medium: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  large: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
};

/**
 * Common style combinations following iOS HIG
 */
export const IOSStyles = {
  // Header styles
  headerTitle: {
    ...IOSTypography.headline,
    textAlign: 'center' as const,
  },
  
  // Button styles
  primaryButton: {
    paddingVertical: IOSSpacing.medium,
    paddingHorizontal: IOSSpacing.comfortable,
    borderRadius: IOSBorderRadius.button,
    minHeight: IOSSpacing.buttonHeight,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    ...IOSShadows.small,
  },
  
  // Input styles
  textInput: {
    ...IOSTypography.body,
    paddingHorizontal: IOSSpacing.standard,
    paddingVertical: IOSSpacing.medium,
    borderRadius: IOSBorderRadius.medium,
    minHeight: IOSSpacing.inputHeight,
    borderWidth: 1,
    ...IOSShadows.subtle,
  },
  
  // Card styles
  card: {
    borderRadius: IOSBorderRadius.card,
    padding: IOSSpacing.standard,
    ...IOSShadows.small,
  },
  
  // Section spacing
  section: {
    marginBottom: IOSSpacing.sectionSpacing,
  },
  
  // Content margins
  contentContainer: {
    paddingHorizontal: IOSSpacing.contentMargin,
  },
  
  // List item styles
  listItem: {
    paddingVertical: IOSSpacing.medium,
    minHeight: IOSSpacing.minimumTouchTarget,
  },
  
  // Error styles
  errorText: {
    ...IOSTypography.footnote,
    color: IOSColors.destructive,
    marginTop: IOSSpacing.tight,
  },
  
  // Loading text
  loadingText: {
    ...IOSTypography.body,
    textAlign: 'center' as const,
    marginTop: IOSSpacing.standard,
  },
  
  // Back button
  backButton: {
    padding: IOSSpacing.tight,
    minWidth: IOSSpacing.minimumTouchTarget,
    minHeight: IOSSpacing.minimumTouchTarget,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
};