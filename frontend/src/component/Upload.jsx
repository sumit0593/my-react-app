import React, { useState } from "react";


export default function Upload({ setRows, setError, setLoading, setPage, uploadUrl = "http://localhost:4000/upload" }) {
  const [file, setFile] = useState(null);

  const handleFile = (e) => setFile(e.target.files[0]);

  const upload = async () => {
    if (!file) return setError("Choose a file first");
    setLoading(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);

    try {
      const res = await fetch(uploadUrl, {
        method: "POST",
        body: form,
      });
      if (!res.ok) throw new Error("Upload failed");
      const json = await res.json();
      setRows(json.data || []);
      setPage(1);
    } catch (err) {
      setError(err.message || "Upload error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex gap-3 items-center mb-4">
      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={handleFile}
        className="block"
      />
      <button
        onClick={upload}
        disabled={false}
        className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-60"
      >
        Upload & Show
      </button>
    </div>
  );
}
