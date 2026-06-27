import { Form, ButtonGroup, Button } from "react-bootstrap";

export default function TextAreaToolbar({
  label,
  name,
  value,
  onChange,
  rows = 8,
  placeholder = "",
}) {
  const insertText = (text) => {
    const textarea = document.getElementById(name);

    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;

    const newValue = value.substring(0, start) + text + value.substring(end);

    onChange({
      target: {
        name,
        value: newValue,
      },
    });

    setTimeout(() => {
      textarea.focus();

      textarea.selectionStart = textarea.selectionEnd = start + text.length;
    }, 0);
  };

  return (
    <Form.Group className="mb-3">
      <Form.Label>{label}</Form.Label>

      <br />

      <ButtonGroup size="sm" className="mb-2">
        <Button variant="outline-secondary" onClick={() => insertText("• ")}>
          <i className="bi bi-list-ul me-1"></i>
          Bullet
        </Button>

        {/*<Button variant="outline-secondary" onClick={() => insertText("1. ")}>
          <i className="bi bi-list-ol me-1"></i>
          Number
        </Button>*/}

        <Button variant="outline-secondary" onClick={() => insertText("\t")}>
          <i className="bi bi-text-indent-left me-1"></i>
          Indent
        </Button>
      </ButtonGroup>

      <Form.Control
        id={name}
        as="textarea"
        rows={rows}
        name={name}
        value={value || ""}
        placeholder={placeholder}
        onChange={onChange}
      />
    </Form.Group>
  );
}
