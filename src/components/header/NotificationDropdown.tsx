"use client";

import React, { useState } from "react";

import { Dropdown } from "../ui/dropdown/Dropdown";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleDropdown = () => setIsOpen((prev) => !prev);
  const closeDropdown = () => setIsOpen(false);

  return (
    <div className="relative">
      <button
        onClick={toggleDropdown}
        className="dropdown-toggle flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        aria-label="Notifications"
      >
        <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex w-[320px] flex-col rounded-2xl border border-gray-200 bg-white p-4 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[340px] lg:right-0"
      >
        <div className="flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
          <h5 className="text-base font-semibold text-gray-900 dark:text-white">Notifications</h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            aria-label="Close notifications"
          >
            <svg className="fill-current" width="20" height="20" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M4.41077 4.41074C4.7362 4.08531 5.26384 4.08531 5.58927 4.41074L10.0006 8.82207L14.4119 4.41074C14.7373 4.08531 15.265 4.08531 15.5904 4.41074C15.9158 4.73617 15.9158 5.2638 15.5904 5.58924L11.1791 10.0006L15.5904 14.4119C15.9158 14.7373 15.9158 15.265 15.5904 15.5904C15.265 15.9158 14.7373 15.9158 14.4119 15.5904L10.0006 11.1791L5.58927 15.5904C5.26384 15.9158 4.7362 15.9158 4.41077 15.5904C4.08534 15.265 4.08534 14.7373 4.41077 14.4119L8.8221 10.0006L4.41077 5.58924C4.08534 5.26381 4.08534 4.73617 4.41077 4.41074Z"
              />
            </svg>
          </button>
        </div>

        <div className="py-8 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You don&apos;t have any notifications yet. They will appear here once your app starts sending real data.
          </p>
        </div>
      </Dropdown>
    </div>
  );
}
