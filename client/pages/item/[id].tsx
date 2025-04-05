import {
  Container,
  Grid,
  SimpleGrid,
  rem,
  Image,
  Text,
  Spoiler,
  Group,
  RingProgress,
  Badge,
  ActionIcon,
  useMantineTheme,
  Flex,
  Table,
  Modal,
  TextInput,
  Button,
  Select,
  Tooltip,
} from "@mantine/core";
import { useRouter } from "next/router";
import Link from "next/link";
import { IconPremiumRights, IconEdit, IconTrash } from "@tabler/icons-react";
import { ERROR, getStatusBadgeColor } from "../../common/utils";
import { placeholderItem } from "../../common/utils";
import { Instance, Item, appProps } from "../../common/types";
import { useEffect, useState } from "react";
import { useDisclosure } from "@mantine/hooks";
import { IconDownload, IconQrcode } from "@tabler/icons-react";
import { QRCodeCanvas } from "qrcode.react";
import { createRoot } from "react-dom/client";

export default function ItemPage({ backendURL, displayError }: appProps) {
  const [editingInstance, setEditingInstance] = useState<{
    serialNumber: string;
    status: string;
  } | null>(null);
  const [opened, { open, close }] = useDisclosure(false);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const PRIMARY_COL_HEIGHT = rem(300);
  const router = useRouter();
  const theme = useMantineTheme();
  const [item, setItem] = useState<Item>(placeholderItem);
  // Reference https://ui.mantine.dev/category/grids/#lead-grid
  const SECONDARY_COL_HEIGHT = `calc(${PRIMARY_COL_HEIGHT} / 2 - var(--mantine-spacing-md) / 2)`;
  const stockLevel: number =
    100 * (item.availableQuantity / item.totalQuantity);
  // Update the image URL logic in the ItemPage component
  // Around line 45-50
  const imageURL =
    item.image && item.image.length > 0
      ? item.image
      : `https://source.unsplash.com/random/600x400?${
          item.category
        }&${Math.random()}`;
  console.log(`${imageURL} ${imageURL}`, item);
  const [returnOpened, { open: openReturn, close: closeReturn }] =
    useDisclosure(false);
  const [serialForReturn, setSerialForReturn] = useState("");
  const [userId, setUserId] = useState("");

  const downloadQRCode = (serialNumber: string, itemId: string) => {
    const qrSize = 256;

    // Create QR code directly on the canvas
    const qr = (
      <QRCodeCanvas
        value={`http://localhost:3000/${itemId}/${serialNumber}`}
        size={qrSize}
        level="H"
      />
    );

    // Render the QR code to canvas
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);
    root.render(qr);

    // Wait for rendering to complete
    setTimeout(() => {
      const renderedCanvas = container.querySelector("canvas");
      if (renderedCanvas) {
        // Create download link
        const link = document.createElement("a");
        link.download = `QR-${itemId}-${serialNumber}.png`;
        link.href = renderedCanvas.toDataURL("image/png");
        link.click();
      }

      // Clean up
      root.unmount();
      document.body.removeChild(container);
    }, 100);
  };
  async function updateInstanceStatus() {
    if (!editingInstance) return;

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${backendURL}/api/items/instances/${editingInstance.serialNumber}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: editingInstance.status }),
        }
      );

      if (response.ok) {
        await fetchItem(); // Refresh data
        close();
      } else {
        displayError("Failed to update status");
      }
    } catch (error) {
      displayError(ERROR.SERVER_CONNECTION);
    }
  }

  async function allocateItem() {
    const userId = prompt("Enter user ID for allocation:");
    if (!userId) {
      displayError("User ID is required");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${backendURL}/api/items/${item._id}/allocate`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId }),
        }
      );

      if (response.ok) {
        await fetchItem();
        displayError("Allocation Successful");
      } else {
        displayError("Allocation failed");
      }
    } catch (error: any) {
      displayError(error.message);
    }
  }

  async function handleReturn() {
    try {
      const itemId = item._id;
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${backendURL}/api/items/instances/${serialForReturn}/return`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userId, itemId }),
        }
      );

      if (response.ok) {
        await fetchItem(); // Refresh the data
        displayError("Item returned successfully");
      } else {
        displayError("Return failed");
      }
    } catch (error: any) {
      displayError(error.message);
    }
  }
  async function checkCurrentUserAdmin() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
      }
      const res = await fetch(`${backendURL}/api/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach token in Authorization header
        },
      });

      if (!res.ok) {
        displayError(res.statusText);
      }
      const user = await res.json();
      console.log(user);
      setIsAdmin(user.role === "Admin");
    } catch (error: any) {
      displayError(error.message);
    }
  }
  async function fetchItem() {
    if (!router.query.id) {
      displayError(ERROR.MISSING_ITEM_ID);
      return;
    }
    const id = router.query.id;
    console.log("Item id", id);
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
      }
      const res = await fetch(`${backendURL}/api/items/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach token in Authorization header
        },
      });
      console.log(res);

      if (!res.ok) {
        displayError(res.statusText);
        return;
      }

      const item = await res.json();
      const categoryRes = await fetch(
        `${backendURL}/api/categories/get/${item.category}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Attach token in Authorization header
          },
        }
      );

      if (!categoryRes.ok) {
        displayError(categoryRes.statusText);
        return;
      }

      const category = await categoryRes.json();
      item.category = category.name;
      setItem(item);
    } catch (error: any) {
      displayError(error.message);
    }
  }

  useEffect(() => {
    fetchItem();
    checkCurrentUserAdmin();
  }, []);

  async function deleteItem() {
    console.log(item.instances[0]);
    // ask for admin password
    const password = prompt("Enter admin password");
    if (!password || password.length < 3) {
      displayError("Invalid admin password");
      return;
    }

    try {
      const response = await fetch(`${backendURL}/item/${item._id}/delete`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });
      console.log(response);

      if (response.ok) {
        // redirect to items page
        router.push({
          pathname: "/items",
        });
      } else {
        displayError(response.statusText);
      }
    } catch (error) {
      displayError(ERROR.SERVER_CONNECTION);
    }
  }

  return (
    <Container my="md">
      <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
        <Group pos={"relative"} h={parseInt(PRIMARY_COL_HEIGHT, 10)}>
          <Image
            src={imageURL}
            alt="A random image"
            fallbackSrc="https://placehold.co/600x400?text=Image"
            radius={"md"}
          />
        </Group>
        <Grid gutter="md">
          <Grid.Col>
            <Container p={0} h={SECONDARY_COL_HEIGHT}>
              <Flex justify={"space-between"}>
                <Group>
                  <Text fw={500} fz={40}>
                    {item.name}
                  </Text>
                </Group>
                <Link
                  style={{ justifySelf: "flex-end", alignSelf: "center" }}
                  href={{
                    pathname: "/edit/item",
                    query: { item: JSON.stringify(item) },
                  }}
                >
                  <ActionIcon variant="subtle" color="gray">
                    <IconEdit
                      style={{ width: rem(20), height: rem(20) }}
                      color={theme.colors.yellow[6]}
                      stroke={1.5}
                    />
                  </ActionIcon>
                </Link>
              </Flex>
              <Text c="dimmed">{item.category}</Text>
              <Spoiler
                style={{ zIndex: "0" }}
                maxHeight={30}
                showLabel="Show more"
                hideLabel="Hide"
              >
                {item.description}
              </Spoiler>{" "}
            </Container>
          </Grid.Col>

          <Grid.Col style={{ display: "grid", placeItems: "center" }} span={6}>
            <Grid.Col span={6}>
              <RingProgress
                sections={[{ value: stockLevel, color: "blue" }]}
                label={
                  <Text c="blue" fw={700} ta="center" size="xl">
                    {item.availableQuantity}
                  </Text>
                }
              />
            </Grid.Col>
          </Grid.Col>
        </Grid>
      </SimpleGrid>

      {item.instances && isAdmin && (
        <>
          <Flex gap="md" justify="flex-end" mt="md">
            <Button variant="light" color="green" onClick={allocateItem}>
              Allocate Item
            </Button>
            <Button variant="light" color="green" onClick={openReturn}>
              Return
            </Button>
            <Modal
              opened={returnOpened}
              onClose={closeReturn}
              title="RETURN ITEM"
            >
              <TextInput
                label="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                mt="md"
                required
              />
              <TextInput
                label="Serial No"
                value={serialForReturn}
                onChange={(e) => setSerialForReturn(e.target.value)}
                mt="md"
                required
              />

              <Button onClick={handleReturn} mt="md" fullWidth>
                Confirm Return
              </Button>
            </Modal>
            <ActionIcon onClick={deleteItem} variant="subtle" color="gray">
              <IconTrash
                style={{ width: rem(20), height: rem(20) }}
                color={theme.colors.red[6]}
                stroke={1.5}
              />
            </ActionIcon>
          </Flex>
          <Table highlightOnHover mt="md">
            <thead>
              <tr>
                <th style={{ width: "35%" }}>Serial Number</th>
                <th style={{ width: "4%" }}>Status</th>
                <th style={{ width: "5%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {item.instances.map((instance, index) => (
                <tr key={index}>
                  <td style={{ fontFamily: "monospace" }}>
                    {instance.serialNumber}
                    <div style={{ display: "none" }}>
                      <QRCodeCanvas
                        id={`qr-${instance.serialNumber}`}
                        value={`http://localhost:3000/${item._id}/${instance.serialNumber}`}
                        size={128}
                      />
                    </div>
                  </td>
                  <td>
                    <Badge
                      color={getStatusBadgeColor(instance.status)}
                      variant="filled"
                    >
                      {instance.status}
                    </Badge>
                  </td>
                  <td>
                    <Group gap="xs">
                      <Tooltip label="Edit Status">
                        <ActionIcon
                          variant="subtle"
                          onClick={() => {
                            setEditingInstance(instance);
                            open();
                          }}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Download QR Code">
                        <ActionIcon
                          variant="subtle"
                          onClick={() =>
                            downloadQRCode(instance.serialNumber, item._id)
                          }
                        >
                          <IconDownload size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Modal opened={opened} onClose={close} title="Edit Instance Status">
            <TextInput
              label="Serial Number"
              value={editingInstance?.serialNumber || ""}
              disabled
            />
            <Select
              label="Status"
              value={editingInstance?.status || ""}
              onChange={(value) =>
                setEditingInstance((prev) =>
                  prev && value
                    ? { ...prev, status: value as Instance["status"] }
                    : null
                )
              }
              data={[
                { value: "available", label: "Available" },
                { value: "borrowed", label: "Borrowed" },
                { value: "reserved", label: "Reserved" },
                { value: "maintenance", label: "Maintenance" },
              ]}
              placeholder="Select status"
              required
            />
            <Button onClick={updateInstanceStatus} mt="md">
              Save Changes
            </Button>
          </Modal>
        </>
      )}
    </Container>
  );
}
