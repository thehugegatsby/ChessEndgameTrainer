// Mock for react-navigation modules
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
  pop: jest.fn(),
  popToTop: jest.fn(),
  replace: jest.fn(),
  reset: jest.fn(),
  setParams: jest.fn(),
  dispatch: jest.fn(),
  setOptions: jest.fn(),
  addListener: jest.fn(),
  removeListener: jest.fn(),
  canGoBack: jest.fn(() => false),
  isFocused: jest.fn(() => true),
  getParent: jest.fn(),
  getState: jest.fn(),
};

module.exports = {
  // @react-navigation/native
  NavigationContainer: ({ children }) => children,
  useNavigation: jest.fn(() => mockNavigation),
  useRoute: jest.fn(() => ({ params: {} })),
  useIsFocused: jest.fn(() => true),
  useFocusEffect: jest.fn(),
  
  // @react-navigation/native-stack
  createNativeStackNavigator: jest.fn(() => ({
    Navigator: ({ children }) => children,
    Screen: ({ children }) => children,
  })),
  
  // Default exports
  default: {},
};