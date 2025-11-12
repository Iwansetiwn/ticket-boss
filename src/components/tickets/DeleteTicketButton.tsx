"use client"

import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"

import { Modal } from "@/components/ui/modal"
import type { TicketRecord } from "@/types/tickets"

type ToastState = {
  ticket: TicketRecord | null
  label: string
  error?: string
}

export default function DeleteTicketButton({ id, subject }: { id: string; subject?: string }) {
  const router = useRouter()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [toastState, setToastState] = useState<ToastState | null>(null)
  const [isUndoing, setIsUndoing] = useState(false)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current)
      }
    }
  }, [])

  function openDialog() {
    setIsDialogOpen(true)
    setDeleteError(null)
  }

  function closeDialog() {
    if (isDeleting) return
    setIsDialogOpen(false)
  }

  async function fetchTicketSnapshot(): Promise<TicketRecord | null> {
    try {
      const response = await fetch(`/api/tickets/${id}`)
      if (!response.ok) return null
      const data = (await response.json()) as { ticket: TicketRecord }
      return data.ticket
    } catch (error) {
      console.error("Failed to fetch ticket details", error)
      return null
    }
  }

  function scheduleRedirect(label: string, snapshot: TicketRecord | null, error?: string) {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
    }
    setToastState({ ticket: snapshot, label, error })
    timerRef.current = window.setTimeout(() => {
      setToastState(null)
      timerRef.current = null
      router.push("/dashboard/tickets")
      router.refresh()
    }, 3000)
  }

  async function confirmDelete() {
    setDeleteError(null)
    setIsDeleting(true)
    const snapshot = await fetchTicketSnapshot()
    try {
      const res = await fetch(`/api/tickets/${id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || "Failed to delete ticket")
      }
      setIsDialogOpen(false)
      const label = subject ? `"${subject}"` : `Ticket ${id}`
      scheduleRedirect(label, snapshot)
    } catch (error) {
      console.error("delete failed", error)
      setDeleteError(error instanceof Error ? error.message : "Failed to delete ticket")
    } finally {
      setIsDeleting(false)
    }
  }

  async function handleUndo() {
    if (!toastState?.ticket) return
    if (timerRef.current) {
      window.clearTimeout(timerRef.current)
      timerRef.current = null
    }
    setIsUndoing(true)
    try {
      const res = await fetch("/api/tickets/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticket: toastState.ticket }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json?.error || "Failed to restore ticket")
      }
      setToastState(null)
      router.refresh()
    } catch (error) {
      console.error("restore failed", error)
      const message = error instanceof Error ? error.message : "Failed to undo delete"
      scheduleRedirect(subject ? `"${subject}"` : `Ticket ${id}`, toastState?.ticket ?? null, message)
    } finally {
      setIsUndoing(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={openDialog}
        disabled={isDeleting}
        className="rounded-lg border border-red-200 px-3 py-1 text-sm font-medium text-red-600 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-200 dark:hover:bg-red-500/20"
      >
        Delete
      </button>

      <Modal
        isOpen={isDialogOpen}
        onClose={closeDialog}
        showCloseButton={!isDeleting}
        className="max-w-md p-6"
      >
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Delete this ticket?</h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            This permanently removes the ticket but you&apos;ll have three seconds to undo once confirmed.
          </p>
          {deleteError && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-200">
              {deleteError}
            </div>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={closeDialog}
              disabled={isDeleting}
              className="rounded-full px-4 py-2 text-sm font-semibold text-gray-600 transition hover:text-gray-900 disabled:opacity-50 dark:text-gray-300"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="rounded-full bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
            >
              {isDeleting ? "Deleting…" : "Delete"}
            </button>
          </div>
        </div>
      </Modal>

      {toastState && (
        <div className="fixed bottom-6 right-6 z-[1100] w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-4 shadow-2xl dark:border-gray-700 dark:bg-gray-900">
          <div className="flex items-start gap-3">
            <div>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">Ticket deleted</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {toastState.label} removed. Undo is available for 3 seconds.
              </p>
              {toastState.error && (
                <p className="mt-2 text-xs text-red-500 dark:text-red-400">{toastState.error}</p>
              )}
            </div>
          </div>
          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              onClick={handleUndo}
              disabled={!toastState.ticket || isUndoing || Boolean(toastState.error)}
              className="rounded-full bg-brand-500 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:opacity-60"
            >
              {isUndoing ? "Restoring…" : "Undo"}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
