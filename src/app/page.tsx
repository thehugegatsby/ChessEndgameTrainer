import { redirect } from "next/navigation";

/**
 * Home page component
 * @returns Redirects to training page
 */
export default function HomePage() {
  redirect("/train/1");
}
