import React, { useState, useEffect, useRef } from 'react';
import { TextInput, TextInputProps } from 'react-native';

interface TextInputWithE2ESupportProps extends TextInputProps {
  onChangeText?: (text: string) => void;
  e2eTestValue?: string;
  e2eTestTrigger?: boolean;
}

/**
 * Enhanced TextInput component with E2E testing support
 * This component provides a workaround for Maestro's limitation where inputText
 * can visually fill TextInput fields but onChangeText events don't fire
 * 
 * Usage:
 * <TextInputWithE2ESupport 
 *   onChangeText={handleTextChange}
 *   e2eTestValue="test value"  // Value to set in E2E tests
 *   e2eTestTrigger={someCondition}  // When to trigger E2E fill
 *   {...otherProps}
 * />
 */
export function TextInputWithE2ESupport({
  onChangeText,
  e2eTestValue,
  e2eTestTrigger,
  value,
  ...props
}: TextInputWithE2ESupportProps) {
  const [internalValue, setInternalValue] = useState(value || '');
  const inputRef = useRef<TextInput>(null);

  // E2E Test Support: Auto-fill when triggered
  useEffect(() => {
    if (e2eTestTrigger && e2eTestValue && onChangeText) {
      console.log('🤖 TextInput E2E Support: Auto-filling with:', e2eTestValue);
      setInternalValue(e2eTestValue);
      onChangeText(e2eTestValue);
    }
  }, [e2eTestTrigger, e2eTestValue, onChangeText]);

  // Handle regular text changes
  const handleTextChange = (text: string) => {
    setInternalValue(text);
    onChangeText?.(text);
  };

  // Handle focus events - potential workaround trigger
  const handleFocus = () => {
    console.log('🔍 TextInput focused, current value:', internalValue);
    props.onFocus?.();
  };

  // Handle blur events - another potential trigger point
  const handleBlur = () => {
    console.log('🔍 TextInput blurred, final value:', internalValue);
    props.onBlur?.();
  };

  return (
    <TextInput
      ref={inputRef}
      {...props}
      value={value !== undefined ? value : internalValue}
      onChangeText={handleTextChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
    />
  );
}