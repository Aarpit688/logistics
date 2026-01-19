import Msme from "../models/Msme.js";

/* ===============================
   REGISTER MSME (USER)
================================ */
export const registerMsme = async (req, res) => {
  try {
    // ✅ safety: avoid Array for iec/pan if duplicate keys come somehow
    const normalize = (v) => (Array.isArray(v) ? v[0] : v);

    const msme = await Msme.create({
      user: req.user.id,

      ...req.body,

      iec: normalize(req.body.iec),
      pan: normalize(req.body.pan),

      documents: {
        gst: req.files?.gstDoc?.[0]?.path,
        iec: req.files?.iecDoc?.[0]?.path,
        pan: req.files?.panDoc?.[0]?.path,
        stamp: req.files?.stampDoc?.[0]?.path,

        // optional documents
        aadhar: req.files?.aadhar?.[0]?.path,
        lut: req.files?.lut?.[0]?.path,
        signature: req.files?.signature?.[0]?.path,
        photo: req.files?.photo?.[0]?.path,
      },
    });

    res.status(201).json(msme);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "MSME registration failed" });
  }
};

/* ===============================
   GET MY MSMEs (USER)
================================ */
export const getMyMsmes = async (req, res) => {
  try {
    const msmes = await Msme.find({ user: req.user.id }).sort({
      createdAt: -1,
    });

    res.json(msmes);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch MSMEs" });
  }
};
