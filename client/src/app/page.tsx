"use client";

import { useState, ChangeEvent, MouseEvent, useEffect } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import logo from "../../public/logo2.png";
import { showToast } from "@/components/ToastProvider";
interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
}

interface Form {
  formData: FormData;
  _id: string;
}

interface ApiResponse {
  statusCode: number;
  data: {
    form: Form;
  };
  message: string;
  success: boolean;
}

const HomePage = () => {
  const [formData, setFormData] = useState<FormData | null>(null);
  const [uniqueId, setUniqueId] = useState<string | null | undefined>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const router = useRouter();

  // Helper function to get Authorization headers
  const getAuthHeaders = () => {
    const token = JSON.parse(localStorage.getItem("user")).accessToken;
    if (!token) {
      showToast("User not logged in. Token missing.", "error");
      router.push("/login");
      return;
    }
    return { Authorization: `Bearer ${token}` };
  };

  // Generate form for the logged-in user
  const generateForm = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.post<ApiResponse>(
        "http://localhost:5000/api/form/generate-form",
        {},
        { headers: getAuthHeaders() }
      );

      const formData = response.data.data.form.formData;
      console.log(formData); // Check the response here

      // Store form data in state
      setFormData(formData);

      // alert(`Form generated with ID: ${response.data.data.form._id}`);
      showToast(
        `form generated successfully: ${response.data.data.form._id}`,
        "success"
      );
      // router.push("/form");
    } catch (err: any) {
      console.error("Error generating form:", err);

      setError(err.response?.data?.message || "User not logged in.");
      if (
        err.response.status === 401 &&
        err.response?.data?.message == "jwt expired"
      ) {
        localStorage.removeItem("user");
        setFormData(null);
        router.push("/login");
      }
      if (axios.isAxiosError(error) && error.response) {
        console.log(err.response.status);
        // Check for 401 Unauthorized error indicating user not found or incorrect password
        if (error.response.status === 401) {
          console.log("Login failed: Unauthorized - Invalid credentials");
          showToast(error.response.data.message, "error");
        } else {
          // Handle other types of errors
          console.error("Error in", error);
          // alert("An unexpected error occurred. Please try again later.");
        }
      } else {
        // Handle network or other issues
        console.error("Network error or server is down", error);
        showToast("Network error. Please try again later", "error");
      }
    } finally {
      setLoading(false);
    }
  };
  const [logo, setLogo] = useState<string>("");

  // Fetch the image from the public folder and convert it to Base64
  const loadLogo = async () => {
    const response = await fetch("/logo2.png"); // Path to your image
    console.log(response);
    const blob = await response.blob();
    const reader = new FileReader();
    reader.onloadend = () => setLogo(reader.result as string);
    reader.readAsDataURL(blob);
  };

  // Handle the PDF download
  const handleDownloadPDF = async () => {
    await loadLogo();
    if (formData) {
      const doc = new jsPDF();
      doc.text("User Form", 10, 10);
      doc.text(`Name: ${formData.name}`, 10, 20);
      doc.text(`Email: ${formData.email}`, 10, 30);
      doc.text(`Phone: ${formData.phone}`, 10, 40);
      doc.text(`Address: ${formData.address}`, 10, 50);
      // Add image if loaded
      if (logo) {
        doc.addImage(logo, "PNG", 10, 60, 0, 0);
      }
      doc.save("user-form.pdf");
    }
  };
  // In the `viewForm` function:
  const viewForm = async (formId: string) => {
    setLoading(true);
    setError("");

    try {
      const response = await axios.get<ApiResponse>(
        `http://localhost:5000/api/form/form/${formId}`,
        { headers: getAuthHeaders() }
      );
      const formData = response?.data?.data?.formData;
      console.log(formData); // Check the response here

      // Store form data in state

      if (formData) {
        console.log("Fetched form data:", formData);
        setFormData(formData);
      } else {
        setError("Form data not found.");
      }
      showToast("Viewed form successfully", "success");
    } catch (err: any) {
      console.error("Error fetching form data:", err);
      setError(err.response?.data?.message || "Failed to fetch form.");

      if (axios.isAxiosError(error) && error.response) {
        // Check for 401 Unauthorized error indicating user not found or incorrect password
        if (error.response.status === 401) {
          console.error("Login failed: Unauthorized - Invalid credentials");
          showToast(error.response.data.message, "error");
        } else {
          // Handle other types of errors
          console.error("Error in", error);
          // alert("An unexpected error occurred. Please try again later.");
        }
      } else {
        // Handle network or other issues
        console.error("Network error or server is down", error);
        alert("Network error. Please try again later.");
        showToast("Network error. Please try again later.", "error");
      }
    } finally {
      setUniqueId("");
      setLoading(false);
    }
  };

  const handleUniqueIdChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUniqueId(e.target.value);
  };

  const handleViewFormClick = (e: MouseEvent<HTMLButtonElement>) => {
    if (uniqueId) {
      viewForm(uniqueId);
    }
  };
  useEffect(() => {
    // Check if we are on the client-side to access localStorage
    if (typeof window !== "undefined") {
      const user = localStorage.getItem("user");
      // const token = localStorage.getItem("token");
      console.log("Checking user:", user);

      if (user) {
        // Redirect to the home page if token exists
        router.push("/");
      } else {
        router.push("/login");
      }
    }
  }, [router]);
  return (
    <div className="flex justify-center items-center h-screen bg-gray-100 gap-20">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full space-y-4">
        {formData ? (
          // Render the form details and download button
          <div>
            <h1 className="text-2xl font-bold mb-4 text-center">User Form</h1>
            <div className="space-y-4">
              <div>
                <strong>Name:</strong> {formData.name}
              </div>
              <div>
                <strong>Email:</strong> {formData.email}
              </div>
              <div>
                <strong>Phone:</strong> {formData.phone}
              </div>
              <div>
                <strong>Address:</strong> {formData.address}
              </div>
            </div>
            <button
              onClick={handleDownloadPDF}
              className="mt-6 p-3 bg-green-500 text-white rounded-lg w-full"
            >
              Download PDF
            </button>

            {/* <button
              onClick={() => router.back()} // Goes back to the previous page
              className="mt-4 p-3 bg-blue-500 text-white rounded-lg w-full"
            >
              Back
            </button> */}
          </div>
        ) : (
          // Show the Generate Form button if form data is not available
          <button
            onClick={generateForm}
            className="w-full p-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            disabled={loading}
          >
            {loading ? "Generating..." : "Generate Form"}
          </button>
        )}

        {/* Separate box for Unique ID input and View Form button */}

        {error && <div className="text-red-500 mt-4">{error}</div>}
      </div>
      <div className="mt-6 p-6 bg-gray-200 rounded-lg border">
        <input
          type="text"
          placeholder="Enter Unique ID"
          value={uniqueId || ""} // Fallback to empty string
          onChange={handleUniqueIdChange}
          className="w-full p-3 border rounded-lg mb-4"
        />
        <button
          onClick={handleViewFormClick}
          className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600"
          disabled={loading || !uniqueId}
        >
          {loading && uniqueId ? "Loading..." : "View Form"}
        </button>
      </div>
    </div>
  );
};

export default HomePage;
