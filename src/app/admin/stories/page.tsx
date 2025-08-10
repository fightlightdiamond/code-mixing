"use client";

import { Require } from "@/core/auth/Require";
import AdminStoriesManagementSimple from "./AdminStoriesManagementSimple";

export default function AdminStoriesPage() {
  return (
    <Require action="read" subject="Story">
      <div className="container mx-auto py-8 px-4">
        <AdminStoriesManagementSimple />
      </div>
    </Require>
  );
}
