"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useMemo, useState } from "react";

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
  facebook: string;
  twitter: string;
  linkedin: string;
  instagram: string;
  avatarUrl: string;
};

const socialIcons: Array<{
  key: keyof Pick<MetaForm, "facebook" | "twitter" | "linkedin" | "instagram">;
  label: string;
  icon: React.ReactNode;
}> = [
  {
    key: "facebook",
    label: "Facebook",
    icon: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M11.6666 11.2503H13.7499L14.5833 7.91699H11.6666V6.25033C11.6666 5.39251 11.6666 4.58366 13.3333 4.58366H14.5833V1.78374C14.3118 1.7477 13.2858 1.66699 12.2023 1.66699C9.94025 1.66699 8.33325 3.04771 8.33325 5.58342V7.91699H5.83325V11.2503H8.33325V18.3337H11.6666V11.2503Z" />
      </svg>
    ),
  },
  {
    key: "twitter",
    label: "X",
    icon: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M15.1708 1.875H17.9274L11.9049 8.75833L18.9899 18.125H13.4424L9.09742 12.4442L4.12578 18.125H1.36745L7.80912 10.7625L1.01245 1.875H6.70078L10.6283 7.0675L15.1708 1.875ZM14.2033 16.475H15.7308L5.87078 3.43833H4.23162L14.2033 16.475Z" />
      </svg>
    ),
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M5.78381 4.16645C5.78351 4.84504 5.37181 5.45569 4.74286 5.71045C4.11391 5.96521 3.39331 5.81321 2.92083 5.32613C2.44836 4.83904 2.31837 4.11413 2.59022 3.50564C2.86207 2.89715 3.48369 2.50695 4.16648 2.50041C5.11432 2.49181 5.78871 3.18731 5.78381 4.16645ZM5.83381 6.87507H2.49931V17.5001H5.83381V6.87507ZM11.6666 6.87507H8.34164V17.5001H11.6252V11.8117C11.6252 8.58819 15.8089 8.29444 15.8089 11.8117V17.5001H19.1666V10.3944C19.1666 4.88819 12.9089 5.09194 11.6252 7.80382L11.6666 6.87507Z" />
      </svg>
    ),
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: (
      <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M13.3333 1.66699H6.66659C3.90516 1.66699 1.66659 3.90557 1.66659 6.66699V13.3337C1.66659 16.0951 3.90516 18.3337 6.66659 18.3337H13.3333C16.0947 18.3337 18.3333 16.0951 18.3333 13.3337V6.66699C18.3333 3.90557 16.0947 1.66699 13.3333 1.66699ZM16.6666 13.3337C16.6666 15.1706 15.1702 16.667 13.3333 16.667H6.66659C4.82964 16.667 3.33325 15.1706 3.33325 13.3337V6.66699C3.33325 4.83004 4.82964 3.33366 6.66659 3.33366H13.3333C15.1702 3.33366 16.6666 4.83004 16.6666 6.66699V13.3337Z" />
        <path d="M10.0001 5.83301C7.69986 5.83301 5.8335 7.69937 5.8335 9.99967C5.8335 12.2999 7.69986 14.1663 10.0001 14.1663C12.3004 14.1663 14.1668 12.2999 14.1668 9.99967C14.1668 7.69937 12.3004 5.83301 10.0001 5.83301ZM10.0001 12.4997C8.62242 12.4997 7.50016 11.3774 7.50016 9.99967C7.50016 8.62193 8.62242 7.49967 10.0001 7.49967C11.3779 7.49967 12.5002 8.62193 12.5002 9.99967C12.5002 11.3774 11.3779 12.4997 10.0001 12.4997Z" />
        <path d="M14.5833 5.83318C14.9595 5.83318 15.2666 5.52608 15.2666 5.14985C15.2666 4.77361 14.9595 4.46651 14.5833 4.46651C14.2071 4.46651 13.8999 4.77361 13.8999 5.14985C13.8999 5.52608 14.2071 5.83318 14.5833 5.83318Z" />
      </svg>
    ),
  },
];

const getInitialForm = (user: AuthUser): MetaForm => ({
  firstName: user.firstName ?? user.email.split("@")[0],
  lastName: user.lastName ?? "",
  location: user.location ?? "",
  facebook: user.facebook ?? "",
  twitter: user.twitter ?? "",
  linkedin: user.linkedin ?? "",
  instagram: user.instagram ?? "",
  avatarUrl: user.avatarUrl ?? "",
});

export default function UserMetaCard({ user }: Props) {
  const { isOpen, openModal, closeModal } = useModal();
  const router = useRouter();
  const [form, setForm] = useState<MetaForm>(() => getInitialForm(user));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(getInitialForm(user));
  }, [user]);

  const displayName = useMemo(() => {
    if (user.firstName || user.lastName) {
      return [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    }
    return user.name ?? user.email.split("@")[0];
  }, [user]);

  const locationText = user.location || "Add your location from the edit modal";
  const avatarPreview = form.avatarUrl || "";

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
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data?.error || "Failed to update profile.");
        setSaving(false);
        return;
      }

      closeModal();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const renderSocialButton = (key: typeof socialIcons[number]["key"]) => {
    const href = user[key] || "#";
    const disabled = !user[key];
    return {
      href,
      disabled,
    };
  };

  function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError("Please choose an image under 2MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setForm((prev) => ({ ...prev, avatarUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
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
            <div className="flex items-center order-2 gap-2 grow xl:order-3 xl:justify-end">
              {socialIcons.map((icon) => {
                const { href, disabled } = renderSocialButton(icon.key);
                return (
                  <a
                    key={icon.key}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-disabled={disabled}
                    className={`flex h-11 w-11 items-center justify-center rounded-full border border-gray-300 bg-white text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 ${
                      disabled ? "pointer-events-none opacity-40" : ""
                    }`}
                  >
                    {icon.icon}
                  </a>
                );
              })}
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

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="block w-full text-sm text-gray-600 dark:text-gray-300 file:mr-4 file:rounded-full file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700 hover:file:bg-gray-200 dark:file:bg-white/10 dark:file:text-gray-200"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PNG or JPG up to 2MB.</p>
              </div>

              <div>
                <h5 className="mb-4 text-lg font-medium text-gray-800 dark:text-white/90">Social Links</h5>
                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div>
                    <Label>Facebook</Label>
                    <Input type="url" value={form.facebook} onChange={handleChange("facebook")} />
                  </div>
                  <div>
                    <Label>X (Twitter)</Label>
                    <Input type="url" value={form.twitter} onChange={handleChange("twitter")} />
                  </div>
                  <div>
                    <Label>LinkedIn</Label>
                    <Input type="url" value={form.linkedin} onChange={handleChange("linkedin")} />
                  </div>
                  <div>
                    <Label>Instagram</Label>
                    <Input type="url" value={form.instagram} onChange={handleChange("instagram")} />
                  </div>
                </div>
              </div>
            </div>

            {error && (
              <p className="px-2 text-sm text-error-500" role="alert">
                {error}
              </p>
            )}

            <div className="flex items-center gap-3 px-2 lg:justify-end">
              <Button size="sm" variant="outline" type="button" onClick={closeModal}>
                Cancel
              </Button>
              <Button size="sm" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>
    </>
  );
}
