const isDark = () =>
  typeof document !== "undefined" &&
  document.documentElement.classList.contains("dark");

export const customStyles = {
  control: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      width: "100%",
      maxWidth: "8.5rem",
      minWidth: "6rem",
      minHeight: "32px",
      maxHeight: "32px",
      display: "flex",
      flexDirection: "row-reverse",
      alignItems: "center",
      borderRadius: "8px",
      color: dark ? "#EBEBEB" : "#141414",
      fontSize: "0.75rem",
      lineHeight: "1rem",
      backgroundColor: dark ? "#2A2A2A" : "#F7F7F8",
      cursor: "pointer",
      border: dark ? "1px solid #363636" : "1px solid #D9D9D9",
      boxShadow: "none",
      ":hover": {
        backgroundColor: dark ? "#363636" : "#EBEBEB",
        border: dark ? "1px solid #5C5C5C" : "1px solid #999999",
      },
    };
  },
  valueContainer: (styles) => ({
    ...styles,
    padding: "0 8px 0 10px",
    height: "30px",
  }),
  indicatorsContainer: (styles) => ({
    ...styles,
    height: "30px",
  }),
  option: (styles, { isFocused, isSelected }) => {
    const dark = isDark();
    return {
      ...styles,
      color: dark ? "#EBEBEB" : "#141414",
      fontSize: "0.75rem",
      padding: "6px 10px",
      width: "100%",
      background: isSelected 
        ? (dark ? "#DC2626" : "#EF4444") 
        : (isFocused 
            ? (dark ? "#363636" : "#EBEBEB") 
            : (dark ? "#2A2A2A" : "#FFFFFF")),
      ":active": {
        background: dark ? "#DC2626" : "#EF4444",
      },
      cursor: "pointer",
    };
  },
  menu: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      backgroundColor: dark ? "#2A2A2A" : "#FFFFFF",
      maxWidth: "12rem",
      border: dark ? "1px solid #363636" : "1px solid #D9D9D9",
      borderRadius: "8px",
      zIndex: 9999,
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    };
  },

  placeholder: (defaultStyles) => {
    const dark = isDark();
    return {
      ...defaultStyles,
      color: dark ? "#999999" : "#5C5C5C",
      fontSize: "0.75rem",
    };
  },

  singleValue: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      color: dark ? "#EBEBEB" : "#141414",
    };
  },

  input: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      margin: "0px",
      padding: "0px",
      color: dark ? "#EBEBEB" : "#141414",
    };
  },

  indicatorSeparator: () => ({
    display: "none",
  }),

  dropdownIndicator: (styles) => {
    const dark = isDark();
    return {
      ...styles,
      color: dark ? "#999999" : "#5C5C5C",
      padding: "0 6px",
      svg: {
        width: "14px",
        height: "14px",
      },
      ":hover": {
        color: dark ? "#EBEBEB" : "#141414",
      },
    };
  },
};
