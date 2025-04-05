import { Title } from "@mantine/core";
import { useState, useEffect } from "react";
import CategoryTableSort from "../components/TableSort";
import { Category } from "../common/types";
import { appProps } from "../common/types";
import { ERROR } from "../common/utils";
import { useRouter } from "next/router";

export default function Categories({
  backendURL,
  displayError,
  toggleLoader,
}: appProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);

  async function fetchCategories() {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
    toggleLoader(true);
    try {
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
        console.log(jsonObj);
        setCategories(jsonObj);
      }
      toggleLoader(false);
    } catch (err) {
      displayError(ERROR.SERVER_CONNECTION);
    }
  }

  async function deleteCategory(category: Category) {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
    }
    // ask for admin password
    const password = prompt("Enter admin password");
    if (!password || password.length < 3) {
      displayError("Invalid admin password");
      return;
    }

    try {
      const response = await fetch(
        `${backendURL}/api/categories/${category._id}/delete`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ password }),
        }
      );
      console.log(response);

      if (response.ok) {
        // if request succeeded, fetch new list of categories
        fetchCategories();
      } else {
        displayError(response.statusText);
      }
    } catch (error) {
      displayError(ERROR.SERVER_CONNECTION);
    }
  }

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <>
      <Title mb={20}>All categories ({categories.length})</Title>
      <CategoryTableSort
        deleteHandler={deleteCategory}
        data={categories}
        enableSearchBar={true}
      />
    </>
  );
}
