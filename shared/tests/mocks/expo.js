// Mock for all expo modules
module.exports = {
  // expo-notifications
  getPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  scheduleNotificationAsync: jest.fn(() => Promise.resolve('notification-id')),
  getAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve([])),
  cancelAllScheduledNotificationsAsync: jest.fn(() => Promise.resolve()),
  
  // expo-haptics
  impactAsync: jest.fn(() => Promise.resolve()),
  ImpactFeedbackStyle: {
    Light: 'Light',
    Medium: 'Medium',
    Heavy: 'Heavy',
  },
  
  // expo-device
  brand: 'TestBrand',
  manufacturer: 'TestManufacturer',
  modelName: 'TestModel',
  osName: 'iOS',
  osVersion: '14.0',
  deviceName: 'TestDevice',
  
  // expo-application
  applicationName: 'TestApp',
  nativeApplicationVersion: '1.0.0',
  nativeBuildVersion: '1',
  
  // expo-battery
  getBatteryLevelAsync: jest.fn(() => Promise.resolve(0.75)),
  getBatteryStateAsync: jest.fn(() => Promise.resolve(1)),
  BatteryState: {
    UNKNOWN: 0,
    UNPLUGGED: 1,
    CHARGING: 2,
    FULL: 3,
  },
  
  // expo-clipboard
  setStringAsync: jest.fn(() => Promise.resolve()),
  getStringAsync: jest.fn(() => Promise.resolve('')),
  
  // expo-sharing
  isAvailableAsync: jest.fn(() => Promise.resolve(true)),
  shareAsync: jest.fn(() => Promise.resolve({ action: 'shared' })),
  
  // expo-status-bar
  StatusBar: {
    setStatusBarStyle: jest.fn(),
    setStatusBarHidden: jest.fn(),
  },
  
  // Default export
  default: {},
};