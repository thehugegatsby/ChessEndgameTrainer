import React from 'react';

/**
 * Mock implementation of next/link
 * Prevents IntersectionObserver errors in tests
 */
const Link = ({ children, href, ...props }: any) => {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};

export default Link;
