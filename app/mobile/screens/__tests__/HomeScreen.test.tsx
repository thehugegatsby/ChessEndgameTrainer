import HomeScreen from '../HomeScreen';

// Since this is a React Native component and we're in a web test environment,
// we'll just test that the component exports correctly
describe('HomeScreen', () => {
  test('HomeScreen component is exported', () => {
    expect(HomeScreen).toBeDefined();
  });

  test('HomeScreen is a function component', () => {
    expect(typeof HomeScreen).toBe('function');
  });
});