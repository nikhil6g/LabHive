import { Group, Stack, Title, Card, Text, rem, Avatar } from "@mantine/core";
import HorizontalBarChart from "../components/charts/HorizontalBarChart";
import PieChart from "../components/charts/PieChart";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  IconBoxSeam,
  IconCategory,
  IconTruckDelivery,
  IconUsers,
} from "@tabler/icons-react";
import { appProps, Item } from "../common/types";
import { formatRelative } from "date-fns";
import { ERROR } from "../common/utils";

export default function Homepage({
  backendURL,
  displayError,
  toggleLoader,
}: appProps) {
  const router = useRouter();
  const [totalItems, setTotalItems] = useState(0);
  const [totalCategories, setTotalCategories] = useState(0);
  const [recentItems, setRecentItems] = useState<Item[]>([]);
  const [barData, setBarData] = useState<any | null>(null);
  const [pieData, setPieData] = useState<any | null>(null); //https://stackoverflow.com/a/65240675/17627866
  const datasetSize = 5;

  async function fetchDataAt(pathname: string) {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.push("/login");
      }
      const res = await fetch(backendURL + pathname, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach token in Authorization header
        },
      });
      const jsonObj = await res.json();
      return jsonObj;
    } catch (error) {
      throw error;
    }
  }

  async function fetchAllData() {
    toggleLoader(true);
    try {
      // fetch data as dictionaries
      const fetchedRecentItems = await fetchDataAt("/api/items/recent/3");
      const itemTotal = await fetchDataAt("/api/items/total");
      const categoriesTotal = await fetchDataAt("/api/categories/total");
      const itemsByCategory = await fetchDataAt(
        "/api/items/grouped-by-category"
      );
      const itemsByStatus = await fetchDataAt("/api/items/grouped-by-status");

      if (fetchedRecentItems) setRecentItems(fetchedRecentItems);
      if (itemTotal) setTotalItems(itemTotal);
      if (categoriesTotal) setTotalCategories(categoriesTotal);

      setPieData([
        itemsByStatus.map((e: any) => e.status),
        itemsByStatus.map((e: any) => e.totalItems),
      ]);

      setBarData([
        itemsByCategory.map((e: any) => e.category),
        itemsByCategory.map((e: any) => e.totalItems),
      ]);
      toggleLoader(false);
    } catch (error) {
      displayError(ERROR.SERVER_CONNECTION);
    }
  }

  useEffect(() => {
    fetchAllData();
  }, []);

  function getRelativeDate(_id: String) {
    const timestamp = _id.toString().substring(0, 8);
    const date = new Date(parseInt(timestamp, 16) * 1000);
    return `created ${formatRelative(date, new Date())}`;
  }

  return (
    <Stack>
      <Title>Dashboard</Title>

      <Group justify="space-between">
        <Card
          style={{ flex: "1" }}
          h={340}
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
        >
          {barData ? (
            <HorizontalBarChart
              dataLabel="Count"
              labelsArray={barData[0].slice(0, datasetSize)}
              dataArray={barData[1].slice(0, datasetSize)}
            />
          ) : (
            <HorizontalBarChart />
          )}
        </Card>
        <Card shadow="sm" padding="lg" radius="md" withBorder>
          {pieData ? (
            <PieChart labelsArray={pieData[0]} dataArray={pieData[1]} />
          ) : (
            <PieChart />
          )}
        </Card>
      </Group>
      <Group style={{ height: "300px" }} gap={20}>
        <Card
          style={{ flex: 1, height: "100%" }}
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
        >
          <Text fw={600} size="sm">
            Insights
          </Text>
          <Group mt="lg">
            <IconBoxSeam
              style={{ width: rem(30), height: rem(30), color: "#FF66B2" }}
              stroke={1.5}
            />
            <Text fz={"sm"}>Total items: {totalItems}</Text>
          </Group>
          <Group mt="lg">
            <IconCategory
              style={{ width: rem(30), height: rem(30), color: "#FFB266" }}
              stroke={1.5}
            />{" "}
            <Text fz={"sm"}>Total categories: {totalCategories}</Text>
          </Group>
        </Card>

        <Card
          style={{ flex: 1, height: "100%" }}
          shadow="sm"
          padding="lg"
          radius="md"
          withBorder
        >
          <Text fw={600} size="sm">
            Latest items
          </Text>
          {recentItems.map((item, i) => (
            <Group mt="lg" key={`${item.name}-${i}-summary`}>
              <Avatar src={null} alt={item.name} radius="sm">
                I{" "}
              </Avatar>
              <div>
                <Text fw={500}>{item.name}</Text>
                <Text fz="xs" c="dimmed">
                  {getRelativeDate(item._id)}
                </Text>
              </div>
            </Group>
          ))}
        </Card>
      </Group>
    </Stack>
  );
}
