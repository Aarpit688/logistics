import { useState } from "react";

const BookShipment = () => {
  const [step, setStep] = useState(1);

  const [origin, setOrigin] = useState({ pincode: "", city: "", state: "" });
  const [destination, setDestination] = useState({
    pincode: "",
    city: "",
    state: "",
  });

  const [shipmentType, setShipmentType] = useState("");
  const [shipment, setShipment] = useState({
    description: "",
    weight: "",
    value: "",
    quantity: "",
    length: "",
    breadth: "",
    height: "",
  });

  const [courier, setCourier] = useState(null);

  const [sender, setSender] = useState({
    name: "",
    phone: "",
    address: "",
  });

  const [receiver, setReceiver] = useState({
    name: "",
    phone: "",
    address: "",
  });

  // 🔍 Fetch pincode details
  const fetchPincode = async (pin, setFn) => {
    if (pin.length !== 6) return;

    const res = await fetch(`https://api.postalpincode.in/pincode/${pin}`);
    const data = await res.json();

    if (data[0]?.Status === "Success") {
      const postOffice = data[0].PostOffice[0];
      setFn((prev) => ({
        ...prev,
        city: postOffice.District,
        state: postOffice.State,
      }));
    }
  };

  return (
    <div className="bg-white p-6 rounded-md shadow-sm max-w-3xl">
      <h2 className="text-xl font-semibold mb-6">Book Shipment</h2>

      {/* STEP 1: PINCODES */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Origin</h3>
            <input
              placeholder="Origin Pincode"
              className="input"
              value={origin.pincode}
              onChange={(e) =>
                setOrigin({ ...origin, pincode: e.target.value })
              }
              onBlur={() => fetchPincode(origin.pincode, setOrigin)}
            />
            {origin.city && (
              <p className="text-sm text-gray-600 mt-1">
                {origin.city}, {origin.state}, India
              </p>
            )}
          </div>

          <div>
            <h3 className="font-medium mb-2">Destination</h3>
            <input
              placeholder="Destination Pincode"
              className="input"
              value={destination.pincode}
              onChange={(e) =>
                setDestination({
                  ...destination,
                  pincode: e.target.value,
                })
              }
              onBlur={() => fetchPincode(destination.pincode, setDestination)}
            />
            {destination.city && (
              <p className="text-sm text-gray-600 mt-1">
                {destination.city}, {destination.state}, India
              </p>
            )}
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!origin.city || !destination.city}
            className="btn-primary"
          >
            Next
          </button>
        </div>
      )}

      {/* STEP 2: SHIPMENT DETAILS */}
      {step === 2 && (
        <div className="space-y-4">
          <select
            className="input"
            value={shipmentType}
            onChange={(e) => setShipmentType(e.target.value)}
          >
            <option value="">Select Shipment Type</option>
            <option value="document">Document</option>
            <option value="parcel">Parcel</option>
          </select>

          <input
            placeholder="Description"
            className="input"
            value={shipment.description}
            onChange={(e) =>
              setShipment({ ...shipment, description: e.target.value })
            }
          />

          <input
            placeholder="Weight (kg)"
            className="input"
            value={shipment.weight}
            onChange={(e) =>
              setShipment({ ...shipment, weight: e.target.value })
            }
          />

          {shipmentType === "parcel" && (
            <>
              <input
                placeholder="Value (INR)"
                className="input"
                onChange={(e) =>
                  setShipment({ ...shipment, value: e.target.value })
                }
              />
              <input
                placeholder="Quantity"
                className="input"
                onChange={(e) =>
                  setShipment({ ...shipment, quantity: e.target.value })
                }
              />
              <div className="grid grid-cols-3 gap-2">
                <input
                  placeholder="Length (cm)"
                  className="input"
                  onChange={(e) =>
                    setShipment({ ...shipment, length: e.target.value })
                  }
                />
                <input
                  placeholder="Breadth (cm)"
                  className="input"
                  onChange={(e) =>
                    setShipment({ ...shipment, breadth: e.target.value })
                  }
                />
                <input
                  placeholder="Height (cm)"
                  className="input"
                  onChange={(e) =>
                    setShipment({ ...shipment, height: e.target.value })
                  }
                />
              </div>
            </>
          )}

          <button onClick={() => setStep(3)} className="btn-primary">
            See Courier Options
          </button>
        </div>
      )}

      {/* STEP 3: COURIER */}
      {step === 3 && (
        <div className="space-y-4">
          <div
            onClick={() =>
              setCourier({ name: "Ace Global Logistics", price: 100 })
            }
            className={`border p-4 rounded-md cursor-pointer ${
              courier ? "border-green-600" : ""
            }`}
          >
            <p className="font-medium">Ace Global Logistics</p>
            <p className="text-sm">₹100 (Flat)</p>
          </div>

          <button
            disabled={!courier}
            onClick={() => setStep(4)}
            className="btn-primary"
          >
            Continue
          </button>
        </div>
      )}

      {/* STEP 4: SENDER & RECEIVER */}
      {step === 4 && (
        <div className="space-y-6">
          <div>
            <h3 className="font-medium mb-2">Sender Details</h3>
            <input
              placeholder="Name"
              className="input"
              onChange={(e) => setSender({ ...sender, name: e.target.value })}
            />
            <input
              placeholder="Phone"
              className="input"
              onChange={(e) => setSender({ ...sender, phone: e.target.value })}
            />
            <textarea
              placeholder="Address"
              className="input"
              onChange={(e) =>
                setSender({ ...sender, address: e.target.value })
              }
            />
          </div>

          <div>
            <h3 className="font-medium mb-2">Receiver Details</h3>
            <input
              placeholder="Name"
              className="input"
              onChange={(e) =>
                setReceiver({ ...receiver, name: e.target.value })
              }
            />
            <input
              placeholder="Phone"
              className="input"
              onChange={(e) =>
                setReceiver({ ...receiver, phone: e.target.value })
              }
            />
            <textarea
              placeholder="Address"
              className="input"
              onChange={(e) =>
                setReceiver({ ...receiver, address: e.target.value })
              }
            />
          </div>

          <button className="btn-primary">Confirm Order</button>
        </div>
      )}
    </div>
  );
};

export default BookShipment;
