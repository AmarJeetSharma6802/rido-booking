"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Category {
  id: string;
  name: string;
}

export default function BecomeDriver() {
  const router = useRouter();
  const [step, setStep] = useState<number>(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  // 1. Form State with proper Types
  const [form, setForm] = useState<{
    categoryId: string;
    vehicleName: string;
    numberPlate: string;
    driverName: string;
    driverImage: File | null;
  }>({
    categoryId: "",
    vehicleName: "",
    numberPlate: "",
    driverName: "",
    driverImage: null,
  });

  // 2. Fetch Categories from API
  useEffect(() => {
    fetch("/api/controllers/category")
      .then((res) => res.json())
      .then((data) => {
        if (data.categories) {
          setCategories(data.categories);
        }
      })
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // 3. Handlers
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, driverImage: e.target.files[0] });
    }
  };

  const handleSubmit = async () => {
    if (!form.categoryId || !form.driverName || !form.driverImage) {
      alert("Please fill all required fields and upload an image.");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("categoryId", form.categoryId);
      formData.append("driverName", form.driverName);
      formData.append("vehicleName", form.vehicleName);
      formData.append("numberPlate", form.numberPlate);
      formData.append("isOnline", "true");
      formData.append("rating", "0");
      
      if (form.driverImage) {
        formData.append("driverImage", form.driverImage);
      }

      const res = await fetch("/api/controllers/driver", {
        method: "POST",
        body: formData,
      });

      const result = await res.json();

      if (res.ok) {
        alert("Driver profile created successfully!");
        router.push("/driver");
      } else {
        alert(result.message || "Something went wrong");
      }
    } catch (error) {
      console.error("Submit error:", error);
      alert("Failed to create driver profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-md mx-auto space-y-4 border rounded-xl shadow-md bg-white mt-10">
      <h2 className="text-2xl font-bold text-center text-gray-800">Become a Driver</h2>
      
      {/* Progress Indicator */}
      <div className="flex justify-between mb-4">
        <div className={`h-2 w-1/3 rounded ${step >= 1 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
        <div className={`h-2 w-1/3 mx-2 rounded ${step >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
        <div className={`h-2 w-1/3 rounded ${step >= 3 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
      </div>

      {/* STEP 1: Select Category */}
      {step === 1 && (
        <div className="space-y-4">
          <label className="block font-medium">Select Vehicle Category</label>
          <select
            name="categoryId"
            value={form.categoryId}
            onChange={handleChange}
            className="border p-3 w-full rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">-- Choose Category --</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button
            disabled={!form.categoryId}
            onClick={() => setStep(2)}
            className="bg-blue-600 disabled:bg-gray-400 text-white p-3 w-full rounded-md font-semibold transition"
          >
            Next: Vehicle Details →
          </button>
        </div>
      )}

      {/* STEP 2: Vehicle Details */}
      {step === 2 && (
        <div className="space-y-4">
          <input
            name="vehicleName"
            placeholder="Vehicle Name (e.g. Honda City)"
            value={form.vehicleName}
            onChange={handleChange}
            className="border p-3 w-full rounded-md"
          />
          <input
            name="numberPlate"
            placeholder="Number Plate (e.g. MH-01-AB-1234)"
            value={form.numberPlate}
            onChange={handleChange}
            className="border p-3 w-full rounded-md"
          />
          <div className="flex gap-2">
            <button onClick={() => setStep(1)} className="bg-gray-200 p-3 w-1/2 rounded-md">Back</button>
            <button onClick={() => setStep(3)} className="bg-blue-600 text-white p-3 w-1/2 rounded-md">Next</button>
          </div>
        </div>
      )}

      {/* STEP 3: Personal Details & Image */}
      {step === 3 && (
        <div className="space-y-4">
          <input
            name="driverName"
            placeholder="Your Full Name"
            value={form.driverName}
            onChange={handleChange}
            className="border p-3 w-full rounded-md"
          />
          
          <div className="space-y-2">
            <label className="block text-sm font-medium">Upload Driver Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={() => setStep(2)} className="bg-gray-200 p-3 w-1/2 rounded-md">Back</button>
            <button 
              onClick={handleSubmit} 
              disabled={loading}
              className="bg-green-600 text-white p-3 w-1/2 rounded-md font-bold"
            >
              {loading ? "Registering..." : "Finish & Submit"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}