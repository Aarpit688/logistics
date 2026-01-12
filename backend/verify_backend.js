import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";

const API_URL = "http://localhost:5000/api/auth/signup";
const FILE_PATH = "C:/Users/aarpi/OneDrive/Desktop/logistics/dummy.pdf";

async function testSignup() {
  try {
    const form = new FormData();
    form.append("name", "Test User");
    form.append("companyName", "Test Corp");
    form.append("mailingAddress", "123 Test St");
    form.append("mobile", "9876543210");
    form.append("email", "test@example.com");
    form.append("password", "password123");

    // Append dummy file for all required docs
    const fileStream = fs.createReadStream(FILE_PATH);
    const docs = ["gst", "iec", "pan", "aadhar", "lut", "stamp", "signature", "photo"];
    
    docs.forEach(doc => {
      form.append(doc, fs.createReadStream(FILE_PATH));
    });

    console.log("Sending signup request...");
    const response = await axios.post(API_URL, form, {
      headers: {
        ...form.getHeaders(),
      },
    });

    console.log("Response:", response.data);
    
    if (response.data.message.includes("Signup successful")) {
        console.log("VERIFICATION SUCCESS: Signup API works!");
    } else {
        console.log("VERIFICATION FAILED: Unexpected message.");
    }

  } catch (error) {
    console.error("VERIFICATION FAILED:", error.response ? error.response.data : error.message);
  }
}

testSignup();
