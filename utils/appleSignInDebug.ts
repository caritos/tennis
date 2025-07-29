import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

/**
 * Apple Sign In Debug Utility
 * 
 * Provides comprehensive debugging information for Apple Sign In issues.
 * Use this to diagnose common Apple Sign In problems.
 */

export interface AppleSignInDebugInfo {
  platform: {
    isIOS: boolean;
    osVersion: string | undefined;
    deviceType: number | null;
    isDevice: boolean;
  };
  app: {
    bundleIdentifier: string | undefined;
    appName: string | undefined;
    version: string | undefined;
    usesAppleSignIn: boolean;
  };
  authentication: {
    isAvailable: boolean | null;
    availabilityCheckError: string | null;
  };
  recommendations: string[];
}

/**
 * Gathers comprehensive debugging information for Apple Sign In
 */
export async function getAppleSignInDebugInfo(): Promise<AppleSignInDebugInfo> {
  const debugInfo: AppleSignInDebugInfo = {
    platform: {
      isIOS: Platform.OS === 'ios',
      osVersion: Platform.Version?.toString(),
      deviceType: Device.deviceType,
      isDevice: Device.isDevice
    },
    app: {
      bundleIdentifier: Constants.expoConfig?.ios?.bundleIdentifier,
      appName: Constants.expoConfig?.name,
      version: Constants.expoConfig?.version,
      usesAppleSignIn: Constants.expoConfig?.ios?.usesAppleSignIn === true
    },
    authentication: {
      isAvailable: null,
      availabilityCheckError: null
    },
    recommendations: []
  };

  // Check Apple Authentication availability
  try {
    if (Platform.OS === 'ios') {
      debugInfo.authentication.isAvailable = await AppleAuthentication.isAvailableAsync();
    } else {
      debugInfo.authentication.isAvailable = false;
      debugInfo.authentication.availabilityCheckError = 'Apple Sign In is only available on iOS';
    }
  } catch (error: any) {
    debugInfo.authentication.isAvailable = false;
    debugInfo.authentication.availabilityCheckError = error?.message || 'Unknown error checking availability';
  }

  // Generate recommendations based on detected issues
  debugInfo.recommendations = generateRecommendations(debugInfo);

  return debugInfo;
}

/**
 * Generates specific recommendations based on the debug information
 */
function generateRecommendations(debugInfo: AppleSignInDebugInfo): string[] {
  const recommendations: string[] = [];

  if (!debugInfo.platform.isIOS) {
    recommendations.push('Apple Sign In is only available on iOS devices');
    return recommendations;
  }

  if (!debugInfo.platform.isDevice) {
    recommendations.push('Apple Sign In requires a real iOS device - testing on simulator is not supported');
    recommendations.push('Use a physical iOS device or TestFlight build for testing');
  }

  if (!debugInfo.app.usesAppleSignIn) {
    recommendations.push('Add "usesAppleSignIn": true to your app.json iOS configuration');
    recommendations.push('Rebuild your app after updating app.json');
  }

  if (!debugInfo.app.bundleIdentifier) {
    recommendations.push('Ensure your iOS bundle identifier is properly configured in app.json');
  } else if (!debugInfo.app.bundleIdentifier.includes('.')) {
    recommendations.push('Bundle identifier should follow reverse domain format (e.g., com.company.app)');
  }

  if (!debugInfo.authentication.isAvailable) {
    if (debugInfo.authentication.availabilityCheckError) {
      recommendations.push(`Availability check failed: ${debugInfo.authentication.availabilityCheckError}`);
    }
    recommendations.push('Ensure you are signed into iCloud on your device');
    recommendations.push('Verify your Apple Developer account has Sign In with Apple enabled');
    recommendations.push('Check that your app is properly configured in Apple Developer Portal');
  }

  if (debugInfo.platform.osVersion && parseFloat(debugInfo.platform.osVersion) < 13) {
    recommendations.push('Apple Sign In requires iOS 13.0 or later');
  }

  if (recommendations.length === 0) {
    recommendations.push('Configuration appears correct - try signing in again');
    recommendations.push('If issues persist, check Apple Developer Portal configuration');
  }

  return recommendations;
}

/**
 * Logs comprehensive Apple Sign In debug information to console
 */
export async function logAppleSignInDebugInfo(): Promise<void> {
  console.log('🍎 Apple Sign In Debug Information');
  console.log('=====================================');
  
  const debugInfo = await getAppleSignInDebugInfo();
  
  console.log('Platform Info:');
  console.log(`  iOS: ${debugInfo.platform.isIOS}`);
  console.log(`  OS Version: ${debugInfo.platform.osVersion}`);
  console.log(`  Device Type: ${debugInfo.platform.deviceType}`);
  console.log(`  Is Physical Device: ${debugInfo.platform.isDevice}`);
  
  console.log('\nApp Configuration:');
  console.log(`  Bundle ID: ${debugInfo.app.bundleIdentifier}`);
  console.log(`  App Name: ${debugInfo.app.appName}`);
  console.log(`  Version: ${debugInfo.app.version}`);
  console.log(`  Uses Apple Sign In: ${debugInfo.app.usesAppleSignIn}`);
  
  console.log('\nAuthentication Status:');
  console.log(`  Available: ${debugInfo.authentication.isAvailable}`);
  if (debugInfo.authentication.availabilityCheckError) {
    console.log(`  Error: ${debugInfo.authentication.availabilityCheckError}`);
  }
  
  console.log('\nRecommendations:');
  debugInfo.recommendations.forEach((rec, index) => {
    console.log(`  ${index + 1}. ${rec}`);
  });
  
  console.log('=====================================');
}

/**
 * Quick check to determine if Apple Sign In should work in current environment
 */
export async function isAppleSignInSupported(): Promise<{ 
  supported: boolean; 
  reason?: string;
}> {
  if (Platform.OS !== 'ios') {
    return { supported: false, reason: 'Apple Sign In is only available on iOS' };
  }

  if (!Device.isDevice) {
    return { supported: false, reason: 'Apple Sign In requires a physical device (not simulator)' };
  }

  try {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) {
      return { supported: false, reason: 'Apple Authentication is not available on this device' };
    }
  } catch (error: any) {
    return { supported: false, reason: `Availability check failed: ${error?.message}` };
  }

  return { supported: true };
}