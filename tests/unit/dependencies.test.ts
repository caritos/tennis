// Test for navigation dependencies
describe('Navigation Dependencies', () => {
  it('should have @react-navigation/bottom-tabs installed', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.dependencies['@react-navigation/bottom-tabs']).toBeDefined();
  });

  it('should have @react-navigation/native installed', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.dependencies['@react-navigation/native']).toBeDefined();
  });

  it('should have required peer dependencies', () => {
    const packageJson = require('../../package.json');
    expect(packageJson.dependencies['react-native-screens']).toBeDefined();
    expect(packageJson.dependencies['react-native-safe-area-context']).toBeDefined();
  });
});