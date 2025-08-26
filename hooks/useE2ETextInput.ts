import { useState, useEffect, useRef } from 'react';
import { TextInput } from 'react-native';

interface UseE2ETextInputOptions {
  initialValue?: string;
  e2eTestId?: string;
  e2eAutoFillTrigger?: boolean;
  e2eDefaultValue?: string;
}

/**
 * Custom hook for TextInput with E2E testing support
 * Provides workarounds for Maestro's onChangeText limitation
 * 
 * Usage:
 * const { value, onChangeText, onFocus, onBlur, ref } = useE2ETextInput({
 *   e2eTestId: 'email-input',
 *   e2eAutoFillTrigger: isE2EMode,
 *   e2eDefaultValue: 'test@example.com'
 * });
 */
export function useE2ETextInput({
  initialValue = '',
  e2eTestId,
  e2eAutoFillTrigger,
  e2eDefaultValue
}: UseE2ETextInputOptions = {}) {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  
  // E2E Auto-fill mechanism
  useEffect(() => {
    if (e2eAutoFillTrigger && e2eDefaultValue) {
      console.log(`🤖 E2E Auto-fill triggered for ${e2eTestId}:`, e2eDefaultValue);
      setValue(e2eDefaultValue);
    }
  }, [e2eAutoFillTrigger, e2eDefaultValue, e2eTestId]);

  // Enhanced onChangeText that provides debugging
  const onChangeText = (text: string) => {
    console.log(`📝 TextInput ${e2eTestId || 'unknown'} changed:`, {
      from: value,
      to: text,
      length: text.length,
      isFocused
    });
    setValue(text);
  };

  // Enhanced focus handler with debugging
  const onFocus = () => {
    console.log(`🔍 TextInput ${e2eTestId || 'unknown'} focused, current value:`, value);
    setIsFocused(true);
    
    // E2E Workaround: Check if we need to trigger auto-fill on focus
    if (e2eAutoFillTrigger && e2eDefaultValue && value !== e2eDefaultValue) {
      console.log(`🤖 E2E Focus-triggered auto-fill for ${e2eTestId}`);
      setTimeout(() => {
        setValue(e2eDefaultValue);
      }, 100);
    }
  };

  // Enhanced blur handler with debugging
  const onBlur = () => {
    console.log(`🔍 TextInput ${e2eTestId || 'unknown'} blurred, final value:`, value);
    setIsFocused(false);
  };

  // Method to programmatically set value (useful for E2E)
  const setValueProgrammatically = (newValue: string) => {
    console.log(`🔧 Programmatically setting ${e2eTestId || 'unknown'} value:`, newValue);
    setValue(newValue);
  };

  // Method to clear the input
  const clearValue = () => {
    console.log(`🧹 Clearing ${e2eTestId || 'unknown'} value`);
    setValue('');
  };

  return {
    value,
    onChangeText,
    onFocus,
    onBlur,
    ref: inputRef,
    isFocused,
    setValue: setValueProgrammatically,
    clearValue,
    // E2E test helpers
    isE2EMode: !!e2eAutoFillTrigger,
    e2eTestId,
  };
}