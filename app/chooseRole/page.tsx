"use client"
import { useRouter } from 'next/navigation'
import React from 'react'

function Page() {
  const router = useRouter()

  return (
    <div>
      <button onClick={() => router.push("/user")}>USER</button>
      <p>and</p>
      <button onClick={() => router.push("/driver")}>Driver</button>
    </div>
  )
}

export default Page