const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

export const customStyles = {
  control: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      width: "100%",
      maxWidth: "8rem",
      minWidth: "6rem",
      borderRadius: "12px",
      color: dark ? "#e5e7eb" : "#000",
      fontSize: "0.8rem",
      lineHeight: "1.75rem",
      backgroundColor: dark ? "#1f2937" : "#EBEBEB",
      cursor: "pointer",
      border: dark ? "2px solid #374151" : "2px solid #D9D9D9",
      ":hover": {
        backgroundColor: dark ? "#374151" : "#D9D9D9",
      },
    };
  },
  option: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      color: dark ? "#e5e7eb" : "#000",
      fontSize: "0.8rem",
      lineHeight: "1.75rem",
      width: "100%",
      background: dark ? "#1f2937" : "#EEEEEE",
      ":hover": {
        background: dark ? "#374151" : "#D9D9D9",
        cursor: "pointer",
      },
    };
  },
  menu: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      backgroundColor: dark ? "#111827" : "#F1F1F1",
      maxWidth: "14rem",
      border: dark ? "2px solid #374151" : "2px solid #D9D9D9",
      borderRadius: "5px",
    };
  },

  placeholder: (defaultStyles) => {
    const dark = isDark();
    return {
      ...defaultStyles,
      color: dark ? "#9ca3af" : "#141414",
      fontSize: "0.8rem",
      lineHeight: "1.75rem",
    };
  },

  singleValue: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      color: dark ? "#e5e7eb" : "#000",
    };
  },

  input: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      color: dark ? "#e5e7eb" : "#000",
    };
  },

  indicatorSeparator: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      backgroundColor: dark ? "#374151" : "#ccc",
    };
  },

  dropdownIndicator: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      color: dark ? "#9ca3af" : "#555",
      ":hover": {
        color: dark ? "#e5e7eb" : "#000",
      },
    };
  },
};
