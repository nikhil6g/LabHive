import { Title, Grid, Stack, Flex, TextInput, Button } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";
import ArticleCardFooter from "../components/ArticleCardFooter";
import EmptyCard from "../components/EmptyCard";
import { appProps } from "../common/types";
import { useState, useEffect } from "react";
import { Item } from "../common/types";
import { ERROR } from "../common/utils";
import { useRouter } from "next/router";

export default function Items({
  backendURL,
  displayError,
  toggleLoader,
}: appProps) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");

  const filteredItems = items.filter((item) => {
    const term = appliedSearch.toLowerCase();
    return (
      item._id.toString().includes(term) ||
      item.name.toLowerCase().includes(term)
    );
  });

  async function fetchItems() {
    toggleLoader(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }
      const res = await fetch(`${backendURL}/api/items/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) {
        displayError(res.statusText);
      } else {
        const jsonObj = await res.json();
        setItems(jsonObj);
      }
    } catch (err) {
      displayError(ERROR.SERVER_CONNECTION);
    } finally {
      toggleLoader(false);
    }
  }

  useEffect(() => {
    fetchItems();
  }, []);

  function handleSearch() {
    setAppliedSearch(inputValue);
  }

  function handleKeyPress(event: React.KeyboardEvent) {
    if (event.key === "Enter") {
      handleSearch();
    }
  }

  function getItemComponents() {
    const columns: number[][] = [[], [], []];
    for (let i = 0; i < filteredItems.length; i++) {
      columns[i % 3].push(i);
    }

    return (
      <Grid grow gutter={{ base: 5, xs: "md", md: "xl", xl: 50 }}>
        {columns.map((col, colIndex) => (
          <Grid.Col key={colIndex} span={4}>
            <Flex direction="column" gap="lg">
              {col.map((i) => (
                <ArticleCardFooter
                  key={`card-col${colIndex}-${i}`}
                  item={filteredItems[i]}
                />
              ))}
              {filteredItems.length % 3 === colIndex && <EmptyCard />}
            </Flex>
          </Grid.Col>
        ))}
      </Grid>
    );
  }

  return (
    <Stack gap="lg">
      <Flex gap="md" align="flex-end" mb="sm">
        <TextInput
          placeholder="Search by ID or name"
          value={inputValue}
          onChange={(e) => setInputValue(e.currentTarget.value)}
          onKeyDown={handleKeyPress}
          leftSection={<IconSearch size={18} />}
          style={{ flex: 1 }}
          radius="md"
        />
        <Button
          onClick={handleSearch}
          leftSection={<IconSearch size={18} />}
          radius="md"
        >
          Search
        </Button>
      </Flex>

      <Title order={2} mb="sm">
        All items ({filteredItems.length})
      </Title>

      {filteredItems.length > 0 ? (
        getItemComponents()
      ) : (
        <Flex justify="center" mt="xl">
          <Title order={3} c="dimmed">
            No items found
          </Title>
        </Flex>
      )}
    </Stack>
  );
}
