import React from "react";
import Select from "react-select";
import { languagesData } from "@/constants";
import { customStyles } from "@/utils/customStyles";

const LanguagesDropdown = ({ onSelectChange, value = null }) => {
  const portalTarget = typeof document !== "undefined" ? document.body : null;

  if (value) {
    return (
      <Select
        options={languagesData}
        value={value}
        styles={customStyles}
        defaultValue={languagesData[3]}
        onChange={onSelectChange}
        menuPortalTarget={portalTarget}
        menuPosition="fixed"
      />
    );
  }
  return (
    <Select
      options={languagesData}
      styles={customStyles}
      defaultValue={languagesData[3]}
      onChange={onSelectChange}
      menuPortalTarget={portalTarget}
      menuPosition="fixed"
    />
  );
};

export default LanguagesDropdown;
