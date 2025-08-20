import { redirect } from 'next/navigation';

/**
 * Home page component
 * @returns Redirects to training page
 */
export default function HomePage(): never {
  redirect('/training');
}
