import Msme from "../models/Msme.js";

/* ===============================
   REGISTER MSME (USER)
================================ */
export const registerMsme = async (req, res) => {
  try {
    const msme = await Msme.create({
      user: req.user.id,

      ...req.body,

      documents: {
        gst: req.files?.gst?.[0]?.path,
        iec: req.files?.iec?.[0]?.path,
        pan: req.files?.pan?.[0]?.path,
        aadhar: req.files?.aadhar?.[0]?.path,
        lut: req.files?.lut?.[0]?.path,
        stamp: req.files?.stamp?.[0]?.path,
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
