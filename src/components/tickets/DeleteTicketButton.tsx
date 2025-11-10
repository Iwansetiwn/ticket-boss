"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"

export default function DeleteTicketButton({ id }: { id: string }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handle() {
    if (!confirm("Delete this ticket? This cannot be undone.")) return
    setLoading(true)
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" })
      console.log("DELETE /api/tickets/", id, "status", res.status)
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        alert(json?.error || "Failed to delete ticket")
        setLoading(false)
        return
      }
      router.push("/dashboard/tickets")
      router.refresh()
    } catch (e) {
      console.error("delete failed", e)
      alert("Failed to delete ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handle} disabled={loading} className="...">
      {loading ? "Deleting…" : "Delete"}
    </button>
  )
}
