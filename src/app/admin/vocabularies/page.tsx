import { Suspense } from "react";
import AdminVocabulariesList from "./AdminVocabulariesList";

export default function AdminVocabulariesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý Vocabularies
        </h1>
        <p className="text-gray-600">Quản lý từ vựng IT tiếng Anh</p>
      </div>

      <Suspense fallback={<div>Loading vocabularies...</div>}>
        <AdminVocabulariesList />
      </Suspense>
    </div>
  );
}
