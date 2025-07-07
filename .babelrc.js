module.exports = {
  presets: [
    '@babel/preset-typescript',
    ['@babel/preset-react', { runtime: 'automatic' }],
    [
      '@babel/preset-env',
      {
        // CRITICAL: Leave ES modules intact for webpack tree shaking
        modules: false,
        targets: {
          // Next.js handles browser targets automatically
          node: 'current'
        }
      }
    ]
  ],
  env: {
    test: {
      presets: [
        '@babel/preset-typescript',
        ['@babel/preset-react', { runtime: 'automatic' }], 
        [
          '@babel/preset-env',
          {
            // For Jest: Transform to CommonJS for Node
            modules: 'commonjs',
            targets: {
              node: 'current'
            }
          }
        ]
      ]
    }
  }
};