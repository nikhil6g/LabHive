// https://ui.mantine.dev/category/footers/#footer-simple
import { Container, Group, Anchor } from "@mantine/core";
import classes from "../styles/FooterSimple.module.css";

const links = [
  { link: "https://github.com/nikhil6g", label: "Made by ByteBliss" },
];

export default function FooterSimple() {
  const items = links.map((link) => (
    <Anchor<"a">
      c="dimmed"
      key={link.label}
      href={link.link}
      onClick={(event) => event.preventDefault()}
      size="sm"
    >
      {link.label}
    </Anchor>
  ));

  return (
    <div className={classes.footer}>
      <Container className={classes.inner}>
        <Group className={classes.links}>{items}</Group>
      </Container>
    </div>
  );
}
