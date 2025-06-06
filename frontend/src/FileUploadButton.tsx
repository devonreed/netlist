type FileUploadButtonProps = {
    onUploadComplete?: (result: any) => void; // Optional callback
  };

export default function FileUploadButton({ onUploadComplete }: FileUploadButtonProps) {
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
        onUploadComplete?.(result.content);
      } catch (error) {
        console.error("Error uploading file:", error);
      }
    };
  
    return <input type="file" onChange={handleFileChange} />;
  }