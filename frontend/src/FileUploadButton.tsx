type FileUploadButtonProps = {
    onUploadComplete?: (result: string) => void;
    onErrors?: (result: Array<string>) => void;
  };

export default function FileUploadButton({ onUploadComplete, onErrors }: FileUploadButtonProps) {
    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;
  
      const formData = new FormData();
      formData.append("file", file);
  
      try {
        const response = await fetch("http://localhost:8000/upload", {
          method: "POST",
          body: formData,
        });
  
        if (!response.ok) {
          throw new Error("Upload failed");
        }
  
        const result = await response.json();
        console.log("Server response:", result);

        // Notify the parent component
        if (result.errors.length > 0) {
            onErrors?.(result.errors);
        } else {
            onUploadComplete?.(result.content);
        }
        
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    };
  
    return <label className="inline-block cursor-pointer rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
        Choose File
        <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        />
    </label>;
  }