// Reference: https://ui.mantine.dev/category/headers/#header-mega-menu
import {
  Group,
  Divider,
  Box,
  Burger,
  Drawer,
  ScrollArea,
  rem,
  Menu,
  Avatar,
  Text,
  UnstyledButton,
} from "@mantine/core";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";
import classes from "../styles/HeaderMegaMenu.module.css";

interface User {
  name: string;
  role: "Admin" | "Student" | "Researcher";
  email: string;
  maxBorrowLimit: number;
  profileImage?: string; // Optional field if you have profile pictures
}

export default function HeaderMegaMenu() {
  const pathname = usePathname(); // Get current page URL
  const router = useRouter(); // Next.js router for navigation
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  async function fetchUserDetails() {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        return;
      }
      const res = await fetch(`http://localhost:8000/api/auth/profile`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Attach token in Authorization header
        },
      });

      if (!res.ok) {
        console.log("Error occured");
      }
      const user = await res.json();
      setUser(user);
      console.log(user);
    } catch (error: any) {
      console.log(`Error occured ${error.message}`);
    }
  }
  useEffect(() => {
    const token = localStorage.getItem("token"); // Check login state
    setIsLoggedIn(!!token);
    fetchUserDetails();
  }, []);

  // Hide navbar when user is on login or signup page
  if (pathname === "/login" || pathname === "/signup") {
    return null;
  }

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const links = [
    ...(isLoggedIn
      ? []
      : [
          { text: "Login", href: "/login" },
          { text: "Signup", href: "/signup" },
        ]),
    ...(user && user.role !== "Admin"
      ? []
      : [
          { text: "Home", href: "/home" },
          { text: "Usage", href: "/usage-logs" },
        ]),

    { text: "Items", href: "/items" },
    { text: "Categories", href: "/categories" },
  ];
  const linkComponents = links.map((e) => (
    <a href={e.href} key={`tab-link-${e.text}`} className={classes.link}>
      {e.text}
    </a>
  ));
  const [drawerOpened, { toggle: toggleDrawer, close: closeDrawer }] =
    useDisclosure(false);

  return (
    <Box pb={50}>
      <header className={classes.header}>
        <Group className={classes.group}>
          <Group h="100%" gap={0} visibleFrom="sm">
            {linkComponents}
          </Group>

          {/* Profile Menu */}
          {isLoggedIn && user && (
            <Menu shadow="md" width={200}>
              <Menu.Target>
                <UnstyledButton>
                  <Group>
                    <Avatar radius="xl" src={user.profileImage || ""} />
                    <Text>{user.name}</Text>
                  </Group>
                </UnstyledButton>
              </Menu.Target>

              <Menu.Dropdown>
                <Menu.Item onClick={() => router.push("/profile")}>
                  Profile
                </Menu.Item>
                <Menu.Item onClick={() => router.push("/settings")}>
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item onClick={handleLogout} color="red">
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          )}

          <Burger
            aria-label="Open menu"
            opened={drawerOpened}
            onClick={toggleDrawer}
            hiddenFrom="sm"
          />
        </Group>
      </header>

      {/* Drawer for mobile navigation */}
      <Drawer
        opened={drawerOpened}
        onClose={closeDrawer}
        size="100%"
        padding="md"
        title="Navigation"
        hiddenFrom="sm"
        zIndex={1000000}
      >
        <ScrollArea h={`calc(100vh - ${rem(80)})`} mx="-md">
          <Divider my="sm" />
          {linkComponents}
        </ScrollArea>
      </Drawer>
    </Box>
  );
}
