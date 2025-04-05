import { useState } from "react";
import {
  TextInput,
  Button,
  Container,
  Title,
  Stack,
  Anchor,
} from "@mantine/core";
import { appProps, Item } from "../common/types";
import { useRouter } from "next/router";

export default function Login({
  backendURL,
  displayError,
  toggleLoader,
}: appProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin() {
    console.log("Logging in with:", email, password);

    try {
      const res = await fetch(backendURL + "/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        throw new Error("login failed: " + res.statusText);
      }

      const jsonObj = await res.json();
      localStorage.setItem("token", jsonObj.token); // Store user data in localStorage

      router.push("/home"); // Redirect after login
    } catch (error) {
      console.error("Error during login:", error);
      alert("Login failed. Please check your credentials.");
    }
  }

  return (
    <Container>
      <Stack>
        <Title>Login</Title>
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
        <Button onClick={handleLogin}>Login</Button>
        <Anchor href="/signup" size="sm">
          Don't have an account? Sign up here.
        </Anchor>
      </Stack>
    </Container>
  );
}
