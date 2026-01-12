import Counter from "../models/Counter.js";

export const generateAccountCode = async (type) => {
  const counter = await Counter.findOneAndUpdate(
    { key: type },
    { $inc: { value: 1 } },
    { new: true, upsert: true }
  );

  const number = String(counter.value).padStart(6, "0");
  return `${type}${number}`;
};
