import { useState } from "react";

interface Props {
  options: Option[];
  selected: Option[];
  onChange: (selected: Option[]) => void;
}

interface Option {
  label: string;
  value: string;
}

const Dropdown: React.FC<Props> = ({ options, selected, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => setIsOpen(!isOpen);

  const handleCheckboxChange = (option: Option) => {
    const alreadySelected = selected.find(
      (item) => item.value === option.value
    );

    if (alreadySelected) {
      const filteredSelection = selected.filter(
        (item) => item.value !== option.value
      );
      onChange(filteredSelection);
    } else {
      const updatedSelection = [...selected, option];
      onChange(updatedSelection);
    }
  };

  const renderOptions = () => {
    return options.map((option) => {
      const isChecked = selected.find((item) => item.value === option.value);
      return (
        <label key={option.value} className="dropdown__option">
          <input
            type="checkbox"
            value={option.value}
            checked={isChecked ? true : false}
            onChange={() => handleCheckboxChange(option)}
          />
          {option.label}
        </label>
      );
    });
  };

  return (
    <div className="dropdown">
      <div className="dropdown__header" onClick={toggleOpen}>
        <div className="dropdown__selected">
          {selected.length === 0
            ? "Select"
            : selected.map((item) => item.label).join(", ")}
        </div>
        <div className={`dropdown__icon ${isOpen ? "open" : ""}`}>▾</div>
      </div>
      {isOpen && (
        <div
          className="dropdown__options"
          onMouseLeave={() => setIsOpen(false)}
        >
          {renderOptions()}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
