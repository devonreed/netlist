import React from "react";

type FileUploadButtonProps = {
  email: string;
  onUploadComplete?: (filename: string, content: string) => void;
  onErrors?: (result: Array<string>) => void;
};

export default function FileUploadButton({ email, onUploadComplete, onErrors }: FileUploadButtonProps) {
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
      
        const formData = new FormData();
        formData.append("file", file);
      
        try {
          const response = await fetch(`http://localhost:8000/upload?email=${encodeURIComponent(email)}`, {
            method: "POST",
            body: formData,
          });
      
          const result = await response.json();
      
          if (!response.ok) {
            onErrors?.(result.errors ?? ["Upload failed"]);
            return;
          }
      
          console.log("Server response:", result);
      
          if (result.errors.length > 0) {
            onErrors?.(result.errors);
          } else {
            onUploadComplete?.(result.filename, result.content);
          }
      
        } catch (error) {
          console.error("Error uploading file:", error);
          onErrors?.(["An unexpected error occurred while uploading."]);
        }
      };

  return (
    <label className="inline-block cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
      Upload New Netlist
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
      />
    </label>
  );
}