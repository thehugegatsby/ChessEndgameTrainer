// Mock for react-native-safe-area-context
const React = require('react');

module.exports = {
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: jest.fn(() => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  })),
  useSafeAreaFrame: jest.fn(() => ({
    x: 0,
    y: 0,
    width: 375,
    height: 812,
  })),
  SafeAreaFrameContext: React.createContext(null),
  SafeAreaInsetsContext: React.createContext(null),
};