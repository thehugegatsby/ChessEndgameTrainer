import TrainingScreen from '../TrainingScreen';

// Since this is a React Native component and we're in a web test environment,
// we'll just test that the component exports correctly
describe('TrainingScreen', () => {
  test('TrainingScreen component is exported', () => {
    expect(TrainingScreen).toBeDefined();
  });

  test('TrainingScreen is a function component', () => {
    expect(typeof TrainingScreen).toBe('function');
  });
});