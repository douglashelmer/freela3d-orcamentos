import { redirect } from 'next/navigation'

// The proxy handles auth redirect; just go to admin (proxy redirects to login if unauth)
export default function Home() {
  redirect('/admin')
}
