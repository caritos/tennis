import { StyleSheet } from 'react-native';

/**
 * Compact styles to minimize vertical space and avoid scrolling
 * These values ensure consistency across all screens
 */
export const CompactStyles = {
  // Header styles
  header: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  
  // Content container
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
  },
  
  // Typography
  title: {
    fontSize: 20,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    marginBottom: 4,
  },
  
  // Form elements
  inputGroup: {
    marginBottom: 12,
  },
  input: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    borderRadius: 8,
  },
  
  // Buttons
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    minHeight: 44,
  },
  buttonText: {
    fontSize: 16,
  },
  
  // Spacing
  sectionMargin: 16,
  itemMargin: 12,
  smallMargin: 8,
  
  // Error text
  errorText: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Help text
  helpText: {
    fontSize: 12,
    marginTop: 2,
  },
  
  // Links
  link: {
    fontSize: 14,
  },
};

// Pre-built style combinations for common use cases
export const compactStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: CompactStyles.header.paddingHorizontal,
    paddingVertical: CompactStyles.header.paddingVertical,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  
  scrollContent: {
    paddingHorizontal: CompactStyles.scrollContent.paddingHorizontal,
    paddingTop: CompactStyles.scrollContent.paddingTop,
    paddingBottom: CompactStyles.scrollContent.paddingBottom,
  },
  
  inputGroup: {
    marginBottom: CompactStyles.inputGroup.marginBottom,
  },
  
  label: {
    fontSize: CompactStyles.label.fontSize,
    fontWeight: '500',
    marginBottom: CompactStyles.label.marginBottom,
  },
  
  input: {
    borderWidth: 1,
    borderRadius: CompactStyles.input.borderRadius,
    paddingHorizontal: CompactStyles.input.paddingHorizontal,
    paddingVertical: CompactStyles.input.paddingVertical,
    fontSize: CompactStyles.input.fontSize,
  },
  
  button: {
    paddingVertical: CompactStyles.button.paddingVertical,
    paddingHorizontal: CompactStyles.button.paddingHorizontal,
    borderRadius: CompactStyles.button.borderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: CompactStyles.button.minHeight,
  },
  
  buttonText: {
    color: '#ffffff',
    fontSize: CompactStyles.buttonText.fontSize,
    fontWeight: '600',
  },
  
  errorText: {
    color: '#FF6B6B',
    fontSize: CompactStyles.errorText.fontSize,
    marginTop: CompactStyles.errorText.marginTop,
  },
  
  helpText: {
    fontSize: CompactStyles.helpText.fontSize,
    marginTop: CompactStyles.helpText.marginTop,
  },
  
  link: {
    fontSize: CompactStyles.link.fontSize,
    textDecorationLine: 'underline',
  },
});