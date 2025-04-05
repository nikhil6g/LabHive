import {
  TextInput,
  Button,
  Group,
  Box,
  Title,
  NumberInput,
  Select,
  Stack,
  Grid,
  Alert,
  Text,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { useRouter } from "next/router";
import { Item, appProps, Category } from "../../common/types";
import { useEffect, useState, SyntheticEvent } from "react";
import { ERROR } from "../../common/utils";
import ImageUpload from "../../components/ImageUpload";
import { IconAlertCircle, IconCheck, IconPlus } from "@tabler/icons-react";

export default function ItemForm({ backendURL, displayError }: appProps) {
  const router = useRouter();
  const editMode = router.query.item ? true : false; // if item has been specified, edit mode  = true
  const [categories, setCategories] = useState<Category[]>([]);
  const validStatus = ["Available", "Maintenance", "Borrowed", "Reserved"];
  const [imageUrl, setImageUrl] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  function getInitialItem() {
    if (editMode) {
      // edit item mode
      const item = JSON.parse(router.query.item as string);
      // Set the image URL if it exists
      if (item.image) {
        setImageUrl(item.image);
      }
      return item;
    }

    // create item mode
    const initialItem: Item = {
      _id: "",
      name: "",
      description: "",
      lowStockThreshold: 0,
      image: "",
      availableQuantity: 0,
      totalQuantity: 0,
      category: "",
      instances: [],
    };

    return initialItem;
  }

  function getCategoryNames() {
    return categories.map((e: Category) => e.name);
  }

  const form = useForm({
    initialValues: getInitialItem(),

    validate: {
      name: (value: string) => {
        if (value.length < 3) return "Name must have at least 3 characters";
        if (value.length > 100) return "Name must have at most 100 characters";
        return null;
      },
      description: (value: string) => {
        if (value.length < 3)
          return "Description must have at least 3 characters";
        if (value.length > 100)
          return "Description must have at most 100 characters";
        return null;
      },
      lowStockThreshold: (value: number) =>
        value < 0 ? "lowStockThreshold must be a non-negative number" : null,
      totalQuantity: (value: number) =>
        value < 0 ? "totalQuantity must be a non-negative number" : null,
      category: (value: string) =>
        getCategoryNames().includes(value) ? null : `Invalid category`,
    },

    transformValues: (values) => {
      // replace category name with category id
      if (editMode) {
        return {
          _id: values._id,
          name: values.name,
          description: values.description,
          lowStockThreshold: values.lowStockThreshold,
          totalQuantity: values.totalQuantity,
          image: imageUrl,
          category: getCategoryID(values.category),
        };
      }

      // if new item is created, do not include item id
      return {
        name: values.name,
        description: values.description,
        lowStockThreshold: values.lowStockThreshold,
        totalQuantity: values.totalQuantity,
        image: imageUrl, // Include the image URL
        category: getCategoryID(values.category),
      };
    },
  });

  function getCategoryID(categoryName: string) {
    const matches = categories.filter((e) => e.name == categoryName);
    if (matches.length > 0) return matches[0]._id;
    return "";
  }

  async function fetchCategories() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        router.replace("/login");
      }
      const res = await fetch(`${backendURL}/api/categories/categories`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach token in Authorization header
        },
      });
      if (!res.ok) {
        displayError(res.statusText);
      } else {
        const jsonObj = await res.json();
        console.log("Fetched categories", jsonObj);
        setCategories(jsonObj);
        return jsonObj;
      }
    } catch (err) {
      displayError(ERROR.SERVER_CONNECTION);
      return [];
    }
  }

  async function onLoad() {
    const latestCategories = await fetchCategories(); //! value of categories variable may not be up-to-date
    const size = latestCategories.length;

    // Check if categories list is empty: output error
    if (size == 0) {
      displayError(ERROR.EMPTY_CATEGORY_LIST);
      return;
    }

    form.setFieldValue("category", latestCategories[0].name);
  }

  useEffect(() => {
    onLoad();
  }, []);

  async function submitItem(e: SyntheticEvent) {
    const createURL = `${backendURL}/api/items/add`;
    const editURL = editMode
      ? `${backendURL}/item/${
          JSON.parse(router.query.item as string)._id
        }/update`
      : "";

    e.preventDefault(); // prevent form from reloading on submission
    console.log("Form values: ", form.values);
    const x = form.getTransformedValues();
    console.log("Form transformed values: ", form.getTransformedValues());
    const finalFormValues = form.getTransformedValues();
    // validate form and display any errors to user
    form.validate();

    // if form has no errors, send request
    if (form.isValid()) {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/login");
        }
        const response = await fetch(editMode ? editURL : createURL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(finalFormValues),
        });
        console.log(response);
        if (response.ok) {
          router.push({
            pathname: "/items",
          });
        } else {
          displayError(response.statusText);
        }
      } catch (error: any) {
        displayError(ERROR.SERVER_CONNECTION);
      }
    }
  }

  return (
    <Box
      maw={1200}
      mx="auto"
      p={{ base: "md", sm: "xl" }}
      py="xl"
      h="100vh"
      style={{
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Title order={1} mb="md">
        {editMode ? "Edit Item" : "Create New Item"}
      </Title>
      <Text c="dimmed" mb="xl">
        {editMode
          ? "Update the item details below"
          : "Fill out the form to add a new item to inventory"}
      </Text>

      {formError && (
        <Alert
          icon={<IconAlertCircle />}
          title="Form Error"
          color="red"
          mb="xl"
          variant="filled"
        >
          {formError}
        </Alert>
      )}

      <form onSubmit={submitItem}>
        <Stack gap="xl">
          <Grid gutter="xl">
            <Grid.Col span={{ base: 12, md: 8 }}>
              <Stack gap="xl">
                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <TextInput
                      label="Item Name"
                      withAsterisk
                      placeholder="Enter item name"
                      {...form.getInputProps("name")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <Select
                      label="Category"
                      withAsterisk
                      placeholder="Select category"
                      data={getCategoryNames()}
                      {...form.getInputProps("category")}
                    />
                  </Grid.Col>
                </Grid>

                <TextInput
                  label="Description"
                  withAsterisk
                  placeholder="Enter item description"
                  {...form.getInputProps("description")}
                />

                <Grid gutter="md">
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label="Total Quantity"
                      min={0}
                      placeholder="Enter total quantity"
                      description="Total items in inventory"
                      {...form.getInputProps("totalQuantity")}
                    />
                  </Grid.Col>
                  <Grid.Col span={{ base: 12, sm: 6 }}>
                    <NumberInput
                      label="Low Stock Threshold"
                      min={0}
                      placeholder="Enter threshold"
                      description="Trigger warning when stock reaches this level"
                      {...form.getInputProps("lowStockThreshold")}
                    />
                  </Grid.Col>
                </Grid>

                {editMode && (
                  <NumberInput
                    label="Currently Available"
                    value={form.values.availableQuantity}
                    disabled
                    description="Available items calculated from inventory"
                  />
                )}
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 4 }}>
              <Box mb="md">
                <Text fw={500} size="sm" mb="xs">
                  Item Image
                </Text>
                <Text c="dimmed" size="sm" mb="sm">
                  Recommended size: 500x500px (max 2MB)
                </Text>
                <ImageUpload
                  initialImage={imageUrl}
                  onImageChange={(url) => setImageUrl(url)}
                />
              </Box>
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              type="submit"
              leftSection={
                editMode ? <IconCheck size={18} /> : <IconPlus size={18} />
              }
              size="md"
            >
              {editMode ? "Update Item" : "Create Item"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
}
