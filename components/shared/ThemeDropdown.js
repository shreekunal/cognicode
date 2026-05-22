import React from "react";
import Select from "react-select";
import { customStyles } from "@/utils/customStyles";


const ThemeDropdown = ({ handleThemeChange }) => {
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  const themes = [
    { label: 'Dark', value: 'dark' },
    { label: 'Light', value: 'light' },
  ];

  return (
    <Select
      options={themes}
      styles={customStyles}
      defaultValue={themes[0]}
      onChange={handleThemeChange}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
    />
  );
};

export default ThemeDropdown;
