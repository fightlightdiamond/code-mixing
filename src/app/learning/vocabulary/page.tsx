"use client";

import React from "react";
import { Require } from "@/core/auth/Require";
import { VocabularyProgressManager } from "../components/VocabularyProgressManager";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function VocabularyPage() {
  const router = useRouter();

  return (
    <Require action="read" subject="Story">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="container mx-auto px-4 py-8 space-y-6">
          <Button
            variant="ghost"
            onClick={() => router.push("/learning")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại trang học
          </Button>

          <h1 className="text-3xl font-bold text-gray-900">
            Ôn tập từ vựng
          </h1>
          <VocabularyProgressManager userId="current-user" />
        </div>
      </div>
    </Require>
  );
}

