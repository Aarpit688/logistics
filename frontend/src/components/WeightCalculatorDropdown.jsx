import React, { useState, useEffect, useRef } from "react";

const WeightCalculatorDropdown = ({
  options,
  name,
  setSelected,
  selected: initialSelected,
}) => {
  const [selected, setSelectedState] = useState(initialSelected || "");
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelectedState(initialSelected || "");
  }, [initialSelected]);

  const handleSelect = (option) => {
    setSelectedState(option);
    setSelected(option);
    setIsOpen(false);
  };

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div ref={dropdownRef} className="w-54">
      <label className="block text-lg font-medium mb-2 text-[#393185]">
        {name}
      </label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full border border-gray-300 bg-white px-4 py-2 rounded-md shadow-sm text-left focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {selected || "Select an option"}
          <svg
            className="w-5 h-5 absolute right-2 top-1/2 + -translate-y-1/2"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && options && options.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white shadow-lg rounded-md border border-gray-300">
            {options.map((option) => (
              <div
                key={option}
                onClick={() => handleSelect(option)}
                className="cursor-pointer px-4 py-2 text-gray-700 hover:bg-indigo-100"
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default WeightCalculatorDropdown;
