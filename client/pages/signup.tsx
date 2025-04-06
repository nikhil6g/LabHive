import { useState } from "react";
import { TextInput, Button, Container, Title, Stack } from "@mantine/core";
import { useRouter } from "next/router";
import { appProps, Item } from "../common/types";

export default function Signup({
  backendURL,
  displayError,
  toggleLoader,
}: appProps) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleSignup() {
    toggleLoader(true);
    try {
      const res = await fetch(backendURL + "/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, name, role }),
      });

      if (!res.ok) {
        throw new Error("sign up failed: " + res.statusText);
      }

      const jsonObj = await res.json();
      localStorage.setItem("token", jsonObj.token); // Store token in localStorage

      // After signup success, fetch user profile to determine role
      const profileRes = await fetch(backendURL + "/api/auth/profile", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jsonObj.token}`, 
        },
      });

      if (!profileRes.ok) {
        throw new Error("Failed to fetch user profile");
      }

      const userData = await profileRes.json();
      
      // Redirect based on user role
      if (userData.role === "Admin") {
        router.push("/home"); // Admin goes to home page
      } else {
        router.push("/dashboard"); // Non-admin goes to dashboard
      }
    } catch (error) {
      console.error("Error during signup:", error);
      displayError("Signup failed. Please check your information.");
    } finally {
      toggleLoader(false);
    }
  }

  return (
    <Container>
      <Stack>
        <Title>Sign Up</Title>
        <TextInput
          label="Name"
          placeholder="Enter your name"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <TextInput
          label="Role"
          placeholder="Enter your role"
          value={role}
          onChange={(e) => setRole(e.currentTarget.value)}
        />
        <TextInput
          label="Email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.currentTarget.value)}
        />
        <TextInput
          label="Password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
        />
        <Button onClick={handleSignup}>Sign Up</Button>
      </Stack>
    </Container>
  );
}
