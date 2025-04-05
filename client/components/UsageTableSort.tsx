// components/UsageTableSort.tsx
import { useEffect, useState } from "react";
import {
  Table,
  ScrollArea,
  UnstyledButton,
  Group,
  Text,
  Center,
  TextInput,
  rem,
  Badge,
  Button,
  Container,
} from "@mantine/core";
import {
  IconSelector,
  IconChevronDown,
  IconChevronUp,
  IconSearch,
  IconDownload,
} from "@tabler/icons-react";
import classes from "../styles/TableSort.module.css";
import { UsageLog } from "../pages/usage-logs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface ThProps {
  children?: React.ReactNode;
  reversed?: boolean;
  sorted?: boolean;
  onSort(): void;
}

interface tableProps {
  data: UsageLog[];
  enableSearchBar?: Boolean;
}

function Th({ children, reversed, sorted, onSort }: ThProps) {
  const Icon = sorted
    ? reversed
      ? IconChevronUp
      : IconChevronDown
    : IconSelector;
  return (
    <Table.Th className={classes.th}>
      <UnstyledButton onClick={onSort} className={classes.control}>
        <Group justify="space-between">
          <Text fw={500} fz="sm">
            {children}
          </Text>
          <Center className={classes.icon}>
            <Icon style={{ width: rem(16), height: rem(16) }} stroke={1.5} />
          </Center>
        </Group>
      </UnstyledButton>
    </Table.Th>
  );
}

function filterData(data: UsageLog[], search: string) {
  const query = search.toLowerCase().trim();
  return data.filter((item) =>
    Object.values(item).some((value) => {
      if (Array.isArray(value))
        return value.join(", ").toLowerCase().includes(query);
      return String(value).toLowerCase().includes(query);
    })
  );
}

function sortData(
  data: UsageLog[],
  payload: { sortBy: keyof UsageLog | null; reversed: boolean; search: string }
) {
  const { sortBy } = payload;

  if (!sortBy) {
    return filterData(data, payload.search);
  }

  return filterData(
    [...data].sort((a, b) => {
      if (payload.reversed) {
        return String(b[sortBy]).localeCompare(String(a[sortBy]));
      }
      return String(a[sortBy]).localeCompare(String(b[sortBy]));
    }),
    payload.search
  );
}

export default function UsageTableSort({
  data,
  enableSearchBar = false,
}: tableProps) {
  const [search, setSearch] = useState("");
  const [sortedData, setSortedData] = useState<UsageLog[]>(data);
  const [sortBy, setSortBy] = useState<keyof UsageLog | null>(null);
  const [reverseSortDirection, setReverseSortDirection] = useState(false);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const headers = [
      "User",
      "Item ID",
      "Serial Numbers",
      "Action",
      "Date",
      "Expected Return",
    ];

    const rows = sortedData.map((log) => [
      log.user,
      log.item,
      log.serialNumbers.join(", "),
      log.action,
      new Date(log.date).toLocaleDateString(),
      log.expectedReturnDate
        ? new Date(log.expectedReturnDate).toLocaleDateString()
        : "N/A",
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      theme: "grid",
      styles: { fontSize: 10 },
      headStyles: { fillColor: [41, 128, 185] },
    });

    doc.save("usage-logs.pdf");
  };

  const setSorting = (field: keyof UsageLog) => {
    const reversed = field === sortBy ? !reverseSortDirection : false;
    setReverseSortDirection(reversed);
    setSortBy(field);
    setSortedData(sortData(data, { sortBy: field, reversed, search }));
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.currentTarget;
    setSearch(value);
    setSortedData(
      sortData(data, { sortBy, reversed: reverseSortDirection, search: value })
    );
  };

  useEffect(() => {
    setSortedData(data);
  }, [data]);

  const rows = sortedData.map((log) => (
    <Table.Tr key={log._id}>
      <Table.Td>{log.user}</Table.Td>
      <Table.Td>{log.item}</Table.Td>
      <Table.Td>{log.serialNumbers.join(", ")}</Table.Td>
      <Table.Td>
        <Badge color={log.action === "borrowed" ? "blue" : "green"}>
          {log.action}
        </Badge>
      </Table.Td>
      <Table.Td>{new Date(log.date).toLocaleDateString()}</Table.Td>
      <Table.Td>
        {log.expectedReturnDate
          ? new Date(log.expectedReturnDate).toLocaleDateString()
          : "N/A"}
      </Table.Td>
    </Table.Tr>
  ));

  return (
    <ScrollArea type="auto" w="75vw" mx="-md" px="md">
      <Group justify="space-Around" mb="xl">
        {enableSearchBar && (
          <TextInput
            w="60vw"
            placeholder="Search by any field"
            leftSection={
              <IconSearch
                style={{ width: rem(16), height: rem(16) }}
                stroke={1.5}
              />
            }
            value={search}
            onChange={handleSearchChange}
          />
        )}
        <Button
          leftSection={<IconDownload size={18} />}
          onClick={handleDownloadPDF}
          variant="outline"
          w="10vw"
        >
          Export PDF
        </Button>
      </Group>
      <Table
        horizontalSpacing="md"
        verticalSpacing="xs"
        layout="auto"
        width="100%"
        style={{ tableLayout: "auto" }}
      >
        <Table.Tbody>
          <Table.Tr>
            <Th
              sorted={sortBy === "user"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("user")}
            >
              User
            </Th>
            <Th
              sorted={sortBy === "item"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("item")}
            >
              Item ID
            </Th>
            <Th
              sorted={sortBy === "serialNumbers"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("serialNumbers")}
            >
              Serial Numbers
            </Th>
            <Th
              sorted={sortBy === "action"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("action")}
            >
              Action
            </Th>
            <Th
              sorted={sortBy === "date"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("date")}
            >
              Date
            </Th>
            <Th
              sorted={sortBy === "expectedReturnDate"}
              reversed={reverseSortDirection}
              onSort={() => setSorting("expectedReturnDate")}
            >
              Expected Return
            </Th>
          </Table.Tr>
        </Table.Tbody>
        <Table.Tbody>
          {rows.length > 0 ? (
            rows
          ) : (
            <Table.Tr>
              <Table.Td colSpan={6}>
                <Text fw={500} ta="center">
                  No usage logs found
                </Text>
              </Table.Td>
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </ScrollArea>
  );
}
