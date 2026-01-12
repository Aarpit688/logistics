import XLSX from "xlsx";
import CountryZone from "../models/CountryZone.js";
import { normalizeKey, normalizeValue } from "../utils/normalizeExcel.js";

/**
 * POST /api/admin/country-zones/upload
 * Upload excel, parse rows, bulk upsert into MongoDB
 */
export const uploadCountryZones = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Excel file is required." });
    }

    // 1) Read workbook from memory buffer
    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });

    // 2) Choose first sheet (or specific sheet name)
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];

    // 3) Convert to JSON rows
    const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

    if (!rawRows.length) {
      return res.status(400).json({ message: "Excel sheet is empty." });
    }

    // 4) Map rows to DB format
    const mapped = rawRows
      .map((row) => {
        // normalize row keys
        const normalizedRow = {};
        Object.keys(row).forEach((k) => {
          normalizedRow[normalizeKey(k)] = row[k];
        });

        const country = normalizeValue(
          normalizedRow["country"] || normalizedRow["country name"]
        );

        if (!country) return null;

        return {
          country,
          zones: {
            fedex: normalizeValue(normalizedRow["fedex"]),
            tnt: normalizeValue(normalizedRow["tnt"]),
            aramexUps: normalizeValue(normalizedRow["aramex ups"]),
            aramex: normalizeValue(normalizedRow["aramex"]),
            dhl: normalizeValue(normalizedRow["dhl"]),
            self: normalizeValue(normalizedRow["self"]),
          },
        };
      })
      .filter(Boolean);

    if (!mapped.length) {
      return res
        .status(400)
        .json({ message: "No valid country rows found in sheet." });
    }

    // 5) Bulk Upsert
    const ops = mapped.map((doc) => ({
      updateOne: {
        filter: { country: doc.country },
        update: { $set: doc },
        upsert: true,
      },
    }));

    const result = await CountryZone.bulkWrite(ops);

    return res.status(200).json({
      message: "Country zones uploaded successfully.",
      sheetName,
      totalRows: rawRows.length,
      validRows: mapped.length,
      inserted: result.upsertedCount,
      updated: result.modifiedCount,
    });
  } catch (err) {
    console.error("uploadCountryZones error:", err);
    return res.status(500).json({
      message: "Failed to upload country zones.",
      error: err.message,
    });
  }
};

/**
 * GET /api/admin/country-zones/:country
 */
export const getCountryZones = async (req, res) => {
  try {
    const { country } = req.params;

    const doc = await CountryZone.findOne({
      country: new RegExp(`^${country.trim()}$`, "i"),
    }).lean();

    if (!doc) {
      return res.status(404).json({ message: "Country not found." });
    }

    return res.status(200).json(doc);
  } catch (err) {
    return res.status(500).json({
      message: "Failed to fetch country zones.",
      error: err.message,
    });
  }
};

/**
 * GET /api/admin/country-zones?search=ind&page=1&limit=20
 */
export const listCountryZones = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 20 } = req.query;

    const q = search
      ? { country: { $regex: search.trim(), $options: "i" } }
      : {};

    const skip = (Number(page) - 1) * Number(limit);

    const [items, total] = await Promise.all([
      CountryZone.find(q).sort({ country: 1 }).skip(skip).limit(Number(limit)),
      CountryZone.countDocuments(q),
    ]);

    return res.status(200).json({
      total,
      page: Number(page),
      limit: Number(limit),
      items,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to list country zones.",
      error: err.message,
    });
  }
};

/**
 * DELETE /api/admin/country-zones
 */
export const deleteAllCountryZones = async (req, res) => {
  try {
    const result = await CountryZone.deleteMany({});
    return res.status(200).json({
      message: "All country zones deleted.",
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    return res.status(500).json({
      message: "Failed to delete country zones.",
      error: err.message,
    });
  }
};
