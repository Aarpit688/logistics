import React, { useState, useEffect } from "react";
import WeightCalculatorDropdown from "./WeightCalculatorDropdown";

const WeightCalculator = () => {
  const [numberOfBoxes, setNumberOfBoxes] = useState(1);
  const [tempNumberOfBoxes, setTempNumberOfBoxes] = useState("1");
  const [shippingMode, setShippingMode] = useState("Domestic Air");
  const [weightUnit, setWeightUnit] = useState("Kgs");
  const [dimensionUnit, setDimensionUnit] = useState("Cms");
  const [boxes, setBoxes] = useState([
    {
      quantity: 1,
      weight: "",
      length: "",
      breadth: "",
      height: "",
      volumetricWeight: "",
      girth: "",
      chargeableWeight: "",
    },
  ]);

  const [totalActualWeight, setTotalActualWeight] = useState(0);
  const [totalChargeableWeight, setTotalChargeableWeight] = useState(0);
  const [totalVolumetricWeight, setTotalVolumetricWeight] = useState(0);
  const shippingModes = [
    "Domestic Air",
    "Domestic Surface",
    "Domestic Cargo",
    "International Courier",
    "International Air Freight",
    "International Sea Freight",
  ];
  const weightUnits = ["Kgs", "Gms"];
  const dimensionUnits = ["Cms", "Inches", "Feet", "Meter"];

  useEffect(() => {
    const updatedBoxes = boxes.map((box, index) => {
      calculateChargeableWeight(index);
      return box;
    });
    setBoxes(updatedBoxes);
    calculateTotals(updatedBoxes);
  }, [shippingMode, dimensionUnit, weightUnit]);

  const getTotalQuantity = (boxes) =>
    boxes.reduce((sum, b) => sum + (parseInt(b.quantity) || 0), 0);

  const handleBoxChange = (e) => {
    const value = e.target.value;
    setTempNumberOfBoxes(value);

    const parsedValue = parseInt(value, 10);
    if (!isNaN(parsedValue) && parsedValue > 0) {
      setNumberOfBoxes(parsedValue);
      setBoxes((prevBoxes) =>
        Array.from(
          { length: parsedValue },
          (_, i) =>
            prevBoxes[i] || {
              quantity: 1,
              weight: "",
              length: "",
              breadth: "",
              height: "",
              volumetricWeight: "",
              girth: "",
              chargeableWeight: "",
            }
        )
      );
    }
  };

  const handleBoxBlur = () => {
    if (!tempNumberOfBoxes.trim() || parseInt(tempNumberOfBoxes, 10) <= 0) {
      setTempNumberOfBoxes("1");
      setNumberOfBoxes(1);
      setBoxes([
        {
          quantity: 1,
          weight: "",
          length: "",
          breadth: "",
          height: "",
          volumetricWeight: "",
          girth: "",
          chargeableWeight: "",
        },
      ]);
    }
  };

  const handleInputValidation = (e) => {
    const { value } = e.target;
    const regex = /^(\d*\.?\d{0,3})$/;
    if (!regex.test(value)) {
      e.preventDefault();
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedBoxes = [...boxes];

    // Quantity logic
    if (field === "quantity") {
      let qty = parseInt(value, 10);
      if (isNaN(qty) || qty < 1) qty = 1;

      // Apply quantity to current row
      const updatedBoxes = [...boxes];
      updatedBoxes[index] = {
        ...updatedBoxes[index],
        quantity: qty,
      };

      let remaining = numberOfBoxes;
      const newBoxes = [];

      for (let i = 0; i < updatedBoxes.length && remaining > 0; i++) {
        const currentQty =
          i === index
            ? Math.min(updatedBoxes[i].quantity, remaining)
            : Math.min(updatedBoxes[i].quantity || 1, remaining);

        newBoxes.push({
          ...updatedBoxes[i],
          quantity: currentQty,
        });

        remaining -= currentQty;
      }

      // Fill remaining boxes with default rows
      while (remaining > 0) {
        newBoxes.push({
          quantity: 1,
          weight: "",
          length: "",
          breadth: "",
          height: "",
          volumetricWeight: "",
          girth: "",
          chargeableWeight: "",
        });
        remaining -= 1;
      }

      setBoxes(newBoxes);
      calculateTotals(newBoxes);
      return;
    }

    // Normal numeric inputs
    if (value === "" || /^(?!0\d)\d*\.?\d{0,3}$/.test(value)) {
      updatedBoxes[index][field] = value;
      setBoxes(updatedBoxes);
      calculateChargeableWeight(index);
      calculateTotals(updatedBoxes);
    }
  };

  const calculateChargeableWeight = (index) => {
    const updatedBoxes = [...boxes];
    const box = updatedBoxes[index];

    let weight = parseFloat(box.weight) || 0;
    const length = parseFloat(box.length) || 0;
    const breadth = parseFloat(box.breadth) || 0;
    const height = parseFloat(box.height) || 0;

    // Weight conversion
    if (weightUnit === "Gms") weight /= 1000;

    // Dimension → cm conversion factor
    const dimensionConversionFactor = {
      Cms: 1,
      Inches: 2.54,
      Feet: 30.48,
      Meter: 100,
    }[dimensionUnit];

    let lCm, bCm, hCm;

    // 🔴 SPECIAL COURIER RULE
    if (shippingMode === "International Courier") {
      // Convert → cm → ROUND UP
      lCm = Math.ceil(length * dimensionConversionFactor);
      bCm = Math.ceil(breadth * dimensionConversionFactor);
      hCm = Math.ceil(height * dimensionConversionFactor);
    } else {
      // Normal conversion (NO rounding)
      lCm = length * dimensionConversionFactor;
      bCm = breadth * dimensionConversionFactor;
      hCm = height * dimensionConversionFactor;
    }

    // -----------------------
    // Volumetric Weight
    // -----------------------
    const dimensionalFactor = {
      "Domestic Air": 5000,
      "Domestic Surface": 4750,
      "Domestic Cargo": 27000 / 7,
      "International Courier": 5000,
      "International Air Freight": 6000,
      "International Sea Freight": 1000000,
    }[shippingMode];

    const volumetricWeight = (lCm * bCm * hCm) / dimensionalFactor;

    box.volumetricWeight =
      volumetricWeight > 0 ? volumetricWeight.toFixed(3) : "";

    // -----------------------
    // Girth (Courier only)
    // -----------------------
    if (shippingMode === "International Courier") {
      const maxSide = Math.max(lCm, bCm, hCm);
      const girth = maxSide + 2 * (lCm + bCm + hCm - maxSide);
      box.girth = girth > 0 ? girth.toFixed(0) : "";
    } else {
      box.girth = "";
    }

    // -----------------------
    // Chargeable Weight
    // -----------------------
    let chargeableWeight = Math.max(weight, volumetricWeight);

    // Courier rounding to next 0.5 kg
    if (shippingMode === "International Courier") {
      chargeableWeight = Math.ceil(chargeableWeight * 2) / 2;
    }

    box.chargeableWeight =
      chargeableWeight > 0 ? chargeableWeight.toFixed(3) : "";

    setBoxes(updatedBoxes);
  };

  const calculateTotals = (updatedBoxes) => {
    let actualWeight = 0;
    let volumetricWeight = 0;
    let chargeableWeight = 0;

    updatedBoxes.forEach((box) => {
      const qty = parseInt(box.quantity) || 0;

      let weight = parseFloat(box.weight) || 0;
      if (weightUnit === "Gms") weight /= 1000;

      actualWeight += weight * qty;
      volumetricWeight += (parseFloat(box.volumetricWeight) || 0) * qty;
      chargeableWeight += (parseFloat(box.chargeableWeight) || 0) * qty;
    });

    setTotalActualWeight(actualWeight.toFixed(3));
    setTotalVolumetricWeight(volumetricWeight.toFixed(3));
    setTotalChargeableWeight(chargeableWeight.toFixed(3));
  };

  return (
    <div className="flex flex-col gap-6 mt-14 items-center">
      <div className="flex md:flex-row flex-col justify-center items-center gap-2 md:gap-5">
        <WeightCalculatorDropdown
          options={shippingModes}
          name="Shipping Mode"
          setSelected={setShippingMode}
          selected={shippingMode}
        />
        <WeightCalculatorDropdown
          options={weightUnits}
          name="Weight Unit"
          setSelected={setWeightUnit}
          selected={weightUnit}
        />
        <WeightCalculatorDropdown
          options={dimensionUnits}
          name="Dimension Unit"
          setSelected={setDimensionUnit}
          selected={dimensionUnit}
        />

        <div className="w-54">
          <label className="block text-lg font-medium mb-2 text-[#393185]">
            Number of Boxes
          </label>
          <input
            type="number"
            min="1"
            value={tempNumberOfBoxes}
            onChange={handleBoxChange}
            onBlur={handleBoxBlur}
            className="w-full border border-gray-300 bg-white text-gray-700 px-4 py-2 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          />
        </div>
      </div>

      <div className="mt-3 md:mt-8 overflow-x-auto">
        <table className="table-auto w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base text-[#393185]">
                Quantity
              </th>
              <th className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base text-[#393185] text-wrap">
                Weight ({weightUnit})
              </th>
              <th className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base text-[#393185]">
                Length ({dimensionUnit})
              </th>
              <th className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base text-[#393185]">
                Breadth ({dimensionUnit})
              </th>
              <th className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base text-[#393185]">
                Height ({dimensionUnit})
              </th>
              {shippingMode === "International Courier" && (
                <th className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base text-[#393185]">
                  Girth (cms)
                </th>
              )}
              {shippingMode !== "International Sea Freight" && (
                <th className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base text-[#393185]">
                  Volumetric Weight (Kgs)
                </th>
              )}
              <th className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base text-[#393185]">
                Chargeable Weight{" "}
                {shippingMode === "International Sea Freight"
                  ? "(CBM)"
                  : "(Kgs)"}
              </th>
            </tr>
          </thead>
          <tbody>
            {boxes.map((box, index) => (
              <tr key={`box-${index}`}>
                <td className="border border-gray-300 bg-white px-4 py-2">
                  <input
                    type="number"
                    min="1"
                    className="w-full bg-transparent text-center"
                    value={box.quantity ?? 1}
                    onChange={(e) =>
                      handleInputChange(index, "quantity", e.target.value)
                    }
                  />
                </td>
                <td className="border border-gray-300  px-0 md:px-4 py-2 text-xs md:text-base bg-white">
                  <input
                    type="text"
                    className="w-full bg-transparent rounded px-0 md:px-3 py-2 text-center"
                    placeholder="Weight"
                    value={box.weight}
                    onInput={handleInputValidation}
                    onChange={(e) =>
                      handleInputChange(index, "weight", e.target.value)
                    }
                  />
                </td>
                <td className="border border-gray-300  px-0 md:px-4 py-2 text-xs md:text-base bg-white">
                  <input
                    type="text"
                    className="w-full bg-transparent rounded px-0 md:px-3 py-2 text-center"
                    placeholder="Length"
                    value={box.length}
                    onInput={handleInputValidation}
                    onChange={(e) =>
                      handleInputChange(index, "length", e.target.value)
                    }
                  />
                </td>
                <td className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base bg-white">
                  <input
                    type="text"
                    className="w-full bg-transparent rounded px-0 md:px-3 py-2 text-center"
                    placeholder="Breadth"
                    value={box.breadth}
                    onInput={handleInputValidation}
                    onChange={(e) =>
                      handleInputChange(index, "breadth", e.target.value)
                    }
                  />
                </td>
                <td className="border border-gray-300 px-0 md:px-4 py-2 text-xs md:text-base bg-white">
                  <input
                    type="text"
                    className="w-full bg-transparent rounded px-0 md:px-3 py-2 text-center"
                    placeholder="Height"
                    value={box.height}
                    onInput={handleInputValidation}
                    onChange={(e) =>
                      handleInputChange(index, "height", e.target.value)
                    }
                  />
                </td>
                {shippingMode === "International Courier" && (
                  <td className="border border-gray-300 bg-white px-0 md:px-4 py-2 text-xs md:text-base text-center">
                    {box.girth}
                  </td>
                )}
                {shippingMode !== "International Sea Freight" && (
                  <td className="border border-gray-300 bg-white px-0 md:px-4 py-2 text-xs md:text-base text-center">
                    {box.volumetricWeight}
                  </td>
                )}
                <td className="border border-gray-300 bg-white px-0 md:px-4 py-2 text-xs md:text-base text-center">
                  {box.chargeableWeight}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-5 md:mt-10 flex flex-col md:flex-row justify-center items-center gap-5 md:gap-20">
          <p className="font-bold text-xl text-[#393185]">
            <span className="hidden md:inline">Total </span>Actual Weight:{" "}
            <span className="text-[#FF3301]">{totalActualWeight} Kgs</span>
          </p>
          {shippingMode !== "International Sea Freight" && (
            <p className="font-bold text-xl text-[#393185]">
              <span className="hidden md:inline">Total </span>Volumetric Weight:{" "}
              <span className="text-[#FF3301]">
                {totalVolumetricWeight} Kgs
              </span>
            </p>
          )}
          <p className="font-bold text-xl text-[#393185]">
            <span className="hidden md:inline">Total </span>Chargeable Weight:{" "}
            <span className="text-[#FF3301]">
              {totalChargeableWeight}{" "}
              {shippingMode === "International Sea Freight" ? "CBM" : "Kgs"}
            </span>
          </p>
        </div>
        <input
          type="text"
          className="w-1 h-1 opacity-0"
          aria-hidden="true"
          tabIndex={0}
        />
      </div>
    </div>
  );
};

export default WeightCalculator;
