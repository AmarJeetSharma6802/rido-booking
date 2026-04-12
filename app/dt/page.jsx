"use client"

import { useState, useEffect } from "react"

export default function SchedulePage() {
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const submitPickupRequestAPI = async (payload) => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000/schedule"

    console.log("API Request:", `${baseUrl}/schedule`, payload)

    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true })
      }, 1500)
    })
  }

  const handlePickupRequestSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const formData = {
      name: e.target.name.value,
      phone: e.target.phone.value,
    }

    const response = await submitPickupRequestAPI(formData)

    setIsLoading(false)

    if (response.success) {
      window.history.pushState({}, "", "/schedule/thank-you")

      setIsSubmitted(true)

      window.gtag?.("event", "conversion", {
        send_to: "AW-XXXXXXX/abc123DEF456", //  replace this your key
        value: 1.0,
        currency: "INR"
      })

      console.log("🔥 Google Ads Conversion Fired")
    }
  }

  useEffect(() => {
    const handlePopState = () => {
      setIsSubmitted(window.location.pathname === "/schedule/thank-you")
    }

    window.addEventListener("popstate", handlePopState)

    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">

      {!isSubmitted ? (
        <form
          onSubmit={handlePickupRequestSubmit}
          className="bg-white shadow-xl rounded-2xl p-6 w-full max-w-md"
        >
          <h2 className="text-2xl font-bold text-center mb-4">
            Schedule Pickup
          </h2>

          <input
            name="name"
            type="text"
            placeholder="Your Name"
            required
            className="w-full p-3 mb-3 border rounded-lg"
          />

          <input
            name="phone"
            type="tel"
            placeholder="Phone Number"
            required
            className="w-full p-3 mb-4 border rounded-lg"
          />

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-black text-white p-3 rounded-lg"
          >
            {isLoading ? "Submitting..." : "Submit Pickup Request"}
          </button>

          <p className="text-xs text-gray-400 mt-3 text-center">
            API: {process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/schedule
          </p>
        </form>
      ) : (
        <div className="bg-white shadow-xl rounded-2xl p-8 text-center max-w-md">
          <h1 className="text-3xl font-bold text-green-600 mb-3">
            🎉 Lead Submitted!
          </h1>

          <p className="text-gray-600 mb-4">
            Your pickup request has been received   
            Our team will contact you soon.
          </p>

          <p className="text-sm text-gray-400 mb-4">
            URL: <b>/schedule/thank-you</b>
          </p>

          <button
            onClick={() => {
              window.history.pushState({}, "", "/schedule")
              setIsSubmitted(false)
            }}
            className="bg-black text-white px-6 py-2 rounded-lg"
          >
            Submit Another Request
          </button>
        </div>
      )}

    </div>
  )
}