# 🚖 Rido Booking App

🔗 **Live Demo:** https://rido-booking.vercel.app/

---

## 📌 Overview

This is a simple Uber-like ride booking application built using **Next.js App Router** with a custom API backend. The goal of this project was to keep everything **clean, simple, and easy to understand**, while still implementing real-world features like role-based access and live map interaction.

---

## ⚙️ Tech Stack

* **Frontend:** Next.js (App Router)
* **Backend:** Next.js API Routes
* **Map Integration:** Leaflet + OpenStreetMap
* **Image Hosting:** Cloudinary

---

## 🚀 Features

### 🔐 Role-Based Authentication

* When a user logs in, they are initially assigned the **User role**.
* After login, they can choose between:

  * **User**
  * **Driver**

---

### 👤 User Flow

1. User logs in
2. Selects pickup location using the map
3. Books a ride

---

### 🚗 Driver Flow

1. Driver selects the **Driver role**
2. Fills out required form details
3. Receives ride request
4. Confirms pickup
5. Enters OTP to start the ride

---

### 🗺️ Map Integration

* Implemented using **Leaflet + OpenStreetMap**
* Users can select pickup locations via an interactive map
* Keeps the experience simple and realistic

---

## 🧪 Testing Tip

To properly test the app:

* Open **two browser tabs**

  * One as **User**
  * One as **Driver**
* Simulate real-time ride booking:

  * User books → Driver accepts → OTP verification → Ride starts

---

## 🎯 Project Goal

This project focuses on:

* Simplicity over complexity
* Clear understanding of full-stack flow
* Practical implementation of:

  * Role-based systems
  * Map integration
  * Real-time-like interaction

---

## 🖼️ Preview

![App Preview](https://res.cloudinary.com/futurecoder/image/upload/v1775979146/mxiyl8k0nckb11dwe6wc.png)

---

## 📌 Conclusion

This is a beginner-to-intermediate level full-stack project designed to demonstrate how a real-world ride-booking system works in a simplified way using modern tools like Next.js and map APIs.

---
