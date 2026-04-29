"use client";

import { useRef } from "react";

type AutoSubmitFormProps = React.ComponentProps<"form"> & {
  textDebounceMs?: number;
};

export function AutoSubmitForm({
  children,
  textDebounceMs = 350,
  ...props
}: AutoSubmitFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const debounceRef = useRef<number | null>(null);

  const requestSubmit = () => {
    formRef.current?.requestSubmit();
  };

  const handleInputCapture = (event: React.FormEvent<HTMLFormElement>) => {
    const target = event.target;

    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    if (
      target instanceof HTMLInputElement &&
      ["hidden", "checkbox", "radio", "file", "submit", "button"].includes(target.type)
    ) {
      return;
    }

    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }

    debounceRef.current = window.setTimeout(() => {
      requestSubmit();
    }, textDebounceMs);
  };

  const handleChangeCapture = (event: React.FormEvent<HTMLFormElement>) => {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      requestSubmit();
    }
  };

  return (
    <form
      ref={formRef}
      onInputCapture={handleInputCapture}
      onChangeCapture={handleChangeCapture}
      {...props}
    >
      {children}
    </form>
  );
}
