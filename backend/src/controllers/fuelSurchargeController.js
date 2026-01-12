import FuelSurcharge from "../models/FuelSurcharge.js";

/* ---------------- ADMIN ---------------- */
const formatDateOnly = (date) => {
  if (!date) return null;

  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// GET ALL (ADMIN)
export const getAllFuelAdmin = async (req, res) => {
  try {
    const fuels = await FuelSurcharge.find().sort({ createdAt: -1 });
    res.json(fuels); // ALWAYS return array
  } catch (err) {
    console.error("ADMIN GET FUEL ERROR:", err);
    res.status(500).json({ message: "Failed to fetch fuel surcharges" });
  }
};

// CREATE
export const createFuel = async (req, res) => {
  try {
    const fuel = await FuelSurcharge.create(req.body);
    res.status(201).json(fuel);
  } catch (err) {
    console.error("CREATE FUEL ERROR:", err);
    res.status(400).json({ message: err.message });
  }
};

// UPDATE
export const updateFuel = async (req, res) => {
  try {
    const fuel = await FuelSurcharge.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!fuel) {
      return res.status(404).json({ message: "Fuel not found" });
    }

    res.json(fuel);
  } catch (err) {
    console.error("UPDATE FUEL ERROR:", err);
    res.status(400).json({ message: err.message });
  }
};

// DELETE
export const deleteFuel = async (req, res) => {
  try {
    await FuelSurcharge.findByIdAndDelete(req.params.id);
    res.json({ message: "Fuel deleted" });
  } catch (err) {
    console.error("DELETE FUEL ERROR:", err);
    res.status(400).json({ message: err.message });
  }
};

/* ---------------- USER ---------------- */

export const getFinalFuel = async (req, res) => {
  try {
    const fuels = await FuelSurcharge.find();

    const result = fuels.map((f) => ({
      vendor: f.vendor,
      status: "Updated",
      history: {
        previous: f.previous
          ? {
              fuelPercent: f.previous.fuelPercent,
              startDate: formatDateOnly(f.previous.startDate),
              endDate: formatDateOnly(f.previous.endDate),
            }
          : null,

        current: f.current
          ? {
              fuelPercent: f.current.fuelPercent,
              startDate: formatDateOnly(f.current.startDate),
              endDate: formatDateOnly(f.current.endDate),
            }
          : null,

        // IMPORTANT: send null if not fully available
        upcoming:
          f.upcoming &&
          f.upcoming.fuelPercent &&
          f.upcoming.startDate &&
          f.upcoming.endDate
            ? {
                fuelPercent: f.upcoming.fuelPercent,
                startDate: formatDateOnly(f.upcoming.startDate),
                endDate: formatDateOnly(f.upcoming.endDate),
              }
            : null,
      },
    }));

    res.json(result);
  } catch (err) {
    console.error("USER GET FUEL ERROR:", err);
    res.status(500).json({ message: "Failed to fetch fuel surcharge" });
  }
};
