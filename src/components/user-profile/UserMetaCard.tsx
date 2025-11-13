"use client";

import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useMemo, useState } from "react";

import type { AuthUser } from "@/lib/auth";
import { useModal } from "@/hooks/useModal";
import Input from "@/components/form/input/InputField";
import Label from "@/components/form/Label";
import Button from "@/components/ui/button/Button";
import { Modal } from "@/components/ui/modal";

type Props = {
  user: AuthUser;
};

type MetaForm = {
  firstName: string;
  lastName: string;
  location: string;
  avatarUrl: string;
};

const getInitialForm = (user: AuthUser): MetaForm => ({
  firstName: user.firstName ?? user.email.split("@")[0],
  lastName: user.lastName ?? "",
  location: user.location ?? "",
  avatarUrl: user.avatarUrl ?? "",
});

export default function UserMetaCard({ user }: Props) {
  const { isOpen, openModal, closeModal } = useModal();
  const router = useRouter();
  const [form, setForm] = useState<MetaForm>(() => getInitialForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>(() => user.avatarUrl ?? "");
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [pendingRemoval, setPendingRemoval] = useState(false);
  const [avatarStatus, setAvatarStatus] = useState<string>(() =>
    user.avatarUrl ? "Photo uploaded" : "No file chosen"
  );

  const updateAvatarPreview = useCallback((nextPreview: string) => {
    setAvatarPreview((prev) => {
      releasePreview(prev);
      return nextPreview;
    });
  }, []);

  const resetLocalState = useCallback(() => {
    setForm(getInitialForm(user));
    const nextAvatar = user.avatarUrl ?? "";
    updateAvatarPreview(nextAvatar);
    setAvatarStatus(nextAvatar ? "Photo uploaded" : "No file chosen");
    setPendingAvatar(null);
    setPendingRemoval(false);
    setError(null);
  }, [updateAvatarPreview, user]);

  useEffect(() => {
    resetLocalState();
  }, [resetLocalState]);

  const displayName = useMemo(() => {
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    }
    return user.name ?? user.email.split("@")[0];
  }, [user]);

  const locationText = user.location || "Add your location from the edit modal";

  const handleChange =
    (key: keyof MetaForm) => (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setForm((prev) => ({ ...prev, [key]: value }));
    };

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      let avatarUrl = form.avatarUrl;

      if (pendingAvatar) {
        const formData = new FormData();
        formData.append("avatar", pendingAvatar);
        const uploadResponse = await fetch("/api/profile/avatar", {
          method: "POST",
          body: formData,
        });
        const uploadPayload = (await uploadResponse.json().catch(() => ({}))) as {
          avatarUrl?: string;
          error?: string;
        };
        if (!uploadResponse.ok || !uploadPayload.avatarUrl) {
          throw new Error(uploadPayload?.error || "Failed to upload avatar.");
        }
        avatarUrl = uploadPayload.avatarUrl;
      } else if (pendingRemoval) {
        const deleteResponse = await fetch("/api/profile/avatar", { method: "DELETE" });
        const deletePayload = (await deleteResponse.json().catch(() => ({}))) as { error?: string };
        if (!deleteResponse.ok) {
          throw new Error(deletePayload?.error || "Failed to remove avatar.");
        }
        avatarUrl = "";
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, avatarUrl }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update profile.");
      }

      resetLocalState();
      closeModal();
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Please choose an image under 2MB.");
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Only image files are supported.");
      return;
    }

    setError(null);
    setPendingRemoval(false);

    const tempUrl = URL.createObjectURL(file);
    updateAvatarPreview(tempUrl);
    setAvatarStatus(file.name);
    setPendingAvatar(file);
  }

  function handleAvatarRemove() {
    if (!avatarPreview) return;
    setPendingAvatar(null);
    setPendingRemoval(true);
    updateAvatarPreview("");
    setAvatarStatus("Photo will be removed");
    setForm((prev) => ({ ...prev, avatarUrl: "" }));
  }

  function handleModalClose() {
    resetLocalState();
    closeModal();
  }

  function releasePreview(url?: string) {
    if (url && url.startsWith("blob:")) {
      URL.revokeObjectURL(url);
    }
  }

  return (
    <>
      <div className="p-5 border border-gray-200 rounded-2xl dark:border-gray-800 lg:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-col items-center w-full gap-6 xl:flex-row">
            <div className="w-20 h-20 overflow-hidden border border-gray-200 rounded-full dark:border-gray-800 bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              {avatarPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarPreview} alt="User avatar" className="h-full w-full object-cover" />
              ) : (
                <span className="text-lg font-semibold text-gray-600 dark:text-gray-200">
                  {displayName.charAt(0)}
                </span>
              )}
            </div>
            <div className="order-3 xl:order-2">
              <h4 className="mb-2 text-lg font-semibold text-center text-gray-800 dark:text-white/90 xl:text-left">
                {displayName}
              </h4>
              <div className="flex flex-col items-center gap-1 text-center xl:flex-row xl:gap-3 xl:text-left">
                <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                <div className="hidden h-3.5 w-px bg-gray-300 dark:bg-gray-700 xl:block" />
                <p className="text-sm text-gray-500 dark:text-gray-400">{locationText}</p>
              </div>
            </div>
          </div>

          <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <svg className="fill-current" width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M15.0911 2.78206C14.2125 1.90338 12.7878 1.90338 11.9092 2.78206L4.57524 10.116C4.26682 10.4244 4.0547 10.8158 3.96468 11.2426L3.31231 14.3352C3.25997 14.5833 3.33653 14.841 3.51583 15.0203C3.69512 15.1996 3.95286 15.2761 4.20096 15.2238L7.29355 14.5714C7.72031 14.4814 8.11172 14.2693 8.42013 13.9609L15.7541 6.62695C16.6327 5.74827 16.6327 4.32365 15.7541 3.44497L15.0911 2.78206ZM12.9698 3.84272C13.2627 3.54982 13.7376 3.54982 14.0305 3.84272L14.6934 4.50563C14.9863 4.79852 14.9863 5.2734 14.6934 5.56629L14.044 6.21573L12.3204 4.49215L12.9698 3.84272ZM11.2597 5.55281L5.6359 11.1766C5.53309 11.2794 5.46238 11.4099 5.43238 11.5522L5.01758 13.5185L6.98394 13.1037C7.1262 13.0737 7.25666 13.003 7.35947 12.9002L12.9833 7.27639L11.2597 5.55281Z"
              />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <Modal isOpen={isOpen} onClose={handleModalClose} className="max-w-[700px] m-4">
        <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">Edit Profile Headline</h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
              Update how your profile appears across the dashboard.
            </p>
          </div>
          <form className="flex flex-col gap-6" onSubmit={handleSave}>
            <div className="custom-scrollbar max-h-[450px] space-y-7 overflow-y-auto px-2">
              <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                <div>
                  <Label>First Name</Label>
                  <Input type="text" value={form.firstName} onChange={handleChange("firstName")} />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input type="text" value={form.lastName} onChange={handleChange("lastName")} />
                </div>
                <div className="lg:col-span-2">
                  <Label>Location</Label>
                  <Input
                    type="text"
                    placeholder="City, Country"
                    value={form.location}
                    onChange={handleChange("location")}
                  />
                </div>
              </div>

              <div className="mb-7">
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">
                  Profile Photo
                </h5>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
                  <div className="flex flex-col gap-1">
                    <input
                      id="avatar-upload"
                      type="file"
                      accept="image/png,image/jpeg,image/jpg,image/webp"
                      onChange={handleAvatarChange}
                      disabled={saving}
                      className="sr-only"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className={`inline-flex h-10 min-w-[140px] items-center justify-center rounded-full border border-gray-300 px-4 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.06] ${
                        saving ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                      }`}
                    >
                      Choose file
                    </label>
                  </div>

                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    disabled={!avatarPreview || saving}
                    className={`inline-flex h-10 min-w-[140px] items-center justify-center rounded-full border px-4 text-sm font-medium transition ${
                      !avatarPreview || saving
                        ? "cursor-not-allowed border-gray-300 text-gray-400 opacity-60 dark:border-gray-700 dark:text-gray-500"
                        : "cursor-pointer border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    Remove photo
                  </button>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{avatarStatus}</span>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PNG, JPG, or WebP up to 2MB.</p>
              </div>

            </div>

            {error && (
              <p className="px-2 text-sm text-error-500" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 px-2 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={handleModalClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                type="submit"
                disabled={saving}
                className={saving ? "bg-brand-500 text-white hover:bg-brand-500" : undefined}
              >
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
