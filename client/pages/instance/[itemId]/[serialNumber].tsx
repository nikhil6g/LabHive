import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Container,
  Text,
  Button,
  Loader,
  Alert,
  Group,
  Badge,
  Stack,
  Title,
  Image,
  Divider,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconArrowBack,
  IconInfoCircle,
} from "@tabler/icons-react";
import { Item, ItemStatus, Instance, appProps } from "../../../common/types";
import { ApiError } from "next/dist/server/api-utils";

export default function InstanceDetails({
  backendURL,
  displayError,
}: appProps) {
  const router = useRouter();
  const { itemId, serialNumber } = router.query;
  const [instance, setInstance] = useState<Instance | null>(null);
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchInstance = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          router.push("/login");
          return;
        }

        const response = await fetch(
          `${backendURL}/api/items/${itemId}/instances/${serialNumber}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
          }
          throw new Error("Failed to fetch instance");
        }

        const data = await response.json();
        setInstance(data.instance);
        setItem(data.item);
        setError("");
      } catch (err) {
        setError(
          (err as ApiError).message || "Failed to load instance details"
        );
      } finally {
        setLoading(false);
      }
    };

    if (itemId && serialNumber) {
      fetchInstance();
    }
  }, [itemId, serialNumber]);

  const handleReturn = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(
        `${backendURL}/api/items/instances/${serialNumber}/return`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            itemId,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Return failed");
      }
      if (instance) {
        instance.status = "Available";
        setInstance(instance);
      }
    } catch (err) {
      setError((err as ApiError).message);
    }
  };

  const handleBorrowRequest = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${backendURL}/api/items/${itemId}/allocate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            serialNumber,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Borrow request failed");
      }

      // Refresh instance data after successful request
      const updatedResponse = await fetch(
        `${backendURL}/api/items/${itemId}/instances/${serialNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedData = await updatedResponse.json();
      setInstance(updatedData);
    } catch (err) {
      setError((err as ApiError).message);
    }
  };

  if (loading) {
    return (
      <Container
        style={{ display: "flex", justifyContent: "center", padding: "2rem" }}
      >
        <Loader size="xl" />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert icon={<IconAlertCircle />} title="Error" color="red" mt="xl">
          {error}
        </Alert>
        <Button
          mt="md"
          leftSection={<IconArrowBack />}
          onClick={() => router.push("/")}
        >
          Back to Home
        </Button>
      </Container>
    );
  }

  return (
    instance &&
    item && (
      <Container size="md" py="xl">
        <Button
          variant="subtle"
          leftSection={<IconArrowBack />}
          onClick={() => router.back()}
          mb="xl"
        >
          Back
        </Button>

        <Stack gap="lg">
          <Title order={1}>{item.name} Details</Title>

          {item.image && (
            <Image
              src={item.image}
              alt={item.name}
              height={200}
              fit="contain"
              radius="md"
            />
          )}

          <Group justify="space-between">
            <Text fw={500}>Item Name:</Text>
            <Text>{item.name}</Text>
          </Group>

          <Group justify="space-between">
            <Text fw={500}>Category:</Text>
            <Text>{item.category}</Text>
          </Group>

          <Group justify="space-between">
            <Text fw={500}>Description:</Text>
            <Text>{item.description}</Text>
          </Group>
          <Divider my="md" />

          <Title order={2}>Instance Details</Title>
          <Group justify="space-between">
            <Text fw={500}>Serial Number:</Text>
            <Text style={{ fontFamily: "monospace" }}>
              {instance.serialNumber}
            </Text>
          </Group>

          <Group justify="space-between">
            <Text fw={500}>Current Status:</Text>
            <Badge
              color={
                instance.status === "Available"
                  ? "green"
                  : instance.status === "Borrowed"
                  ? "orange"
                  : instance.status === "Reserved"
                  ? "blue"
                  : "gray"
              }
              size="lg"
            >
              {instance.status}
            </Badge>
          </Group>

          <Group justify="center" mt="xl">
            {instance.status === "Available" && (
              <Button color="green" size="lg" onClick={handleBorrowRequest}>
                Request Borrow
              </Button>
            )}

            {instance.status === "Borrowed" && (
              <Button color="red" size="lg" onClick={handleReturn}>
                Initiate Return
              </Button>
            )}

            {instance.status === "Reserved" && (
              <Alert
                color="blue"
                title="Reservation Notice"
                icon={<IconInfoCircle />}
              >
                This item is currently reserved. Please contact the lab
                administrator for more details.
              </Alert>
            )}
          </Group>
        </Stack>
      </Container>
    )
  );
}
