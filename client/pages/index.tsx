import { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    console.log(token);
    if (!token) {
      router.push("/login"); // Redirect to Login if no user data
    } else {
      setIsAuthenticated(true);
      router.replace("/home");
    }
  }, []);

  if (!isAuthenticated) return null; // Prevents flicker before redirect

  return <h1>Welcome to the App!</h1>;
}
