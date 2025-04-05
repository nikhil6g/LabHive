// pages/usage-logs.tsx
import { Title, Container } from "@mantine/core";
import { useState, useEffect } from "react";
import UsageTableSort from "../components/UsageTableSort";
import { appProps } from "../common/types";
import { ERROR } from "../common/utils";

export interface UsageLog {
  _id: string;
  user: string;
  item: string;
  serialNumbers: string[];
  action: "borrowed" | "returned";
  date: Date;
  expectedReturnDate?: Date;
}

export default function UsageLogs({
  backendURL,
  displayError,
  toggleLoader,
}: appProps) {
  const [logs, setLogs] = useState<UsageLog[]>([]);

  async function fetchUsageLogs() {
    const token = localStorage.getItem("token");
    toggleLoader(true);
    try {
      const res = await fetch(`${backendURL}/api/usages/usage-logs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach token in Authorization header
        },
      });
      if (!res.ok) {
        displayError(res.statusText);
      } else {
        const logs = await res.json();
        setLogs(logs);
      }
      toggleLoader(false);
    } catch (err) {
      displayError(ERROR.SERVER_CONNECTION);
    }
  }

  useEffect(() => {
    fetchUsageLogs();
  }, []);

  return (
    <>
      <Container fluid style={{ width: "100%", maxWidth: "none" }}>
        <Title mb={20}>Usage Logs ({logs.length})</Title>
        <UsageTableSort data={logs} enableSearchBar={true} />
      </Container>
    </>
  );
}
