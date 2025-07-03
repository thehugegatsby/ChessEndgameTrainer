import React from 'react';
import App from '../App';

// Since this is a React Native component and we're in a web test environment,
// we'll just test that the component exports correctly
describe('Mobile App', () => {
  test('App component is exported', () => {
    expect(App).toBeDefined();
  });

  test('App is a function component', () => {
    expect(typeof App).toBe('function');
  });
});