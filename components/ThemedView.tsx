import React from 'react';
import { View, type ViewProps } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({ style, lightColor, darkColor, children, ...otherProps }: ThemedViewProps) {
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, 'background');

  // Filter out any string children to prevent "Text strings must be rendered within a <Text> component" errors
  const validChildren = React.Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return null; // Filter out strings and numbers
    }
    return child;
  });

  return (
    <View style={[{ backgroundColor }, style]} {...otherProps}>
      {validChildren}
    </View>
  );
}
