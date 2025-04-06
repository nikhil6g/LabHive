import { useState, useEffect } from "react";
import { Container, Grid, Title, Card, Text, Badge, Group, Image, SimpleGrid, Tabs } from "@mantine/core";
import { appProps } from "../common/types";
import { ERROR } from "../common/utils";

interface User {
  _id: string;
  name: string;
  role: string;
  email: string;
}

interface BorrowedItem {
  _id: string;
  item: {
    _id: string;
    name: string;
    description: string;
    image?: string;
  };
  serialNumber: string;
  borrowDate: string;
  dueDate: string;
}

interface ReturnedItem {
  _id: string;
  item: {
    _id: string;
    name: string;
    description: string;
    image?: string;
  };
  serialNumber: string;
  returnDate: string;
}

export default function Dashboard({
  backendURL,
  displayError,
  toggleLoader,
}: appProps) {
  const [user, setUser] = useState<User | null>(null);
  const [borrowedItems, setBorrowedItems] = useState<BorrowedItem[]>([]);
  const [returnedItems, setReturnedItems] = useState<ReturnedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<string | null>("borrowed");
  
  // Fetch user profile to determine role
  async function fetchUserProfile() {
    const token = localStorage.getItem("token");
    if (!token) return;
    
    toggleLoader(true);
    try {
      const res = await fetch(`${backendURL}/api/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
      });
      
      if (!res.ok) {
        displayError("Failed to fetch user profile");
      } else {
        const userData = await res.json();
        setUser(userData);
        
        // If not admin, fetch user items
        if (userData.role !== "Admin") {
          await Promise.all([
            fetchBorrowedItems(),
            fetchReturnedItems()
          ]);
        }
      }
    } catch (err) {
      displayError(ERROR.SERVER_CONNECTION);
    } finally {
      toggleLoader(false);
      setIsLoading(false);
    }
  }

  async function fetchBorrowedItems() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${backendURL}/api/usages/borrowed-items`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        displayError(res.statusText);
      } else {
        const items = await res.json();
        setBorrowedItems(items);
      }
    } catch (err) {
      displayError(ERROR.SERVER_CONNECTION);
    }
  }

  async function fetchReturnedItems() {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${backendURL}/api/usages/returned-items`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        displayError(res.statusText);
      } else {
        const items = await res.json();
        setReturnedItems(items);
      }
    } catch (err) {
      displayError(ERROR.SERVER_CONNECTION);
    }
  }

  useEffect(() => {
    fetchUserProfile();
  }, []);

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString();
  }

  function getDaysRemaining(dueDate: string) {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return (
    <Container fluid>
      
        <>
          <Title mb={20}>Your Items</Title>
          <Tabs value={activeTab} onChange={setActiveTab} mb="xl">
            <Tabs.List>
              <Tabs.Tab value="borrowed" color="blue">
                Currently Borrowed ({borrowedItems.length})
              </Tabs.Tab>
              <Tabs.Tab value="returned" color="green">
                Recently Returned ({returnedItems.length})
              </Tabs.Tab>
            </Tabs.List>
            
            <Tabs.Panel value="borrowed" pt="md">
              {borrowedItems.length === 0 ? (
                <Text>You don't have any borrowed items.</Text>
              ) : (
                <SimpleGrid
                  cols={3}
                  spacing="lg"
                >
                  {borrowedItems.map((item) => (
                    <Card key={`${item._id}-${item.serialNumber}`} shadow="sm" padding="lg" radius="md" withBorder>
                      {item.item.image && (
                        <Card.Section>
                          <Image
                            src={item.item.image}
                            height={160}
                            alt={item.item.name}
                          />
                        </Card.Section>
                      )}
                      <Group mt="md" mb="xs">
                        <Text>{item.item.name}</Text>
                        <Badge color={getDaysRemaining(item.dueDate) < 0 ? "red" : getDaysRemaining(item.dueDate) < 3 ? "orange" : "green"}>
                          {getDaysRemaining(item.dueDate) < 0 
                            ? "Overdue" 
                            : `Due in ${getDaysRemaining(item.dueDate)} days`}
                        </Badge>
                      </Group>
                      <Text size="sm" color="dimmed" mb="md">{item.item.description}</Text>
                      <Text size="xs">Serial: {item.serialNumber}</Text>
                      <Text size="xs">Borrowed on: {formatDate(item.borrowDate)}</Text>
                      <Text size="xs">Due date: {formatDate(item.dueDate)}</Text>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </Tabs.Panel>
            
            <Tabs.Panel value="returned" pt="md">
              {returnedItems.length === 0 ? (
                <Text>You don't have any recently returned items.</Text>
              ) : (
                <SimpleGrid
                  cols={3}
                  spacing="lg"
                >
                  {returnedItems.map((item) => (
                    <Card key={`${item._id}-${item.serialNumber}`} shadow="sm" padding="lg" radius="md" withBorder>
                      {item.item.image && (
                        <Card.Section>
                          <Image
                            src={item.item.image}
                            height={160}
                            alt={item.item.name}
                          />
                        </Card.Section>
                      )}
                      <Group mt="md" mb="xs">
                        <Text>{item.item.name}</Text>
                        <Badge color="green">Returned</Badge>
                      </Group>
                      <Text size="sm" color="dimmed" mb="md">{item.item.description}</Text>
                      <Text size="xs">Serial: {item.serialNumber}</Text>
                      <Text size="xs">Returned on: {formatDate(item.returnDate)}</Text>
                    </Card>
                  ))}
                </SimpleGrid>
              )}
            </Tabs.Panel>
          </Tabs>
        </>
    </Container>
  );
}
