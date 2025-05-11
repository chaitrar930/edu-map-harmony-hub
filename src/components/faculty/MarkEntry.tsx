
import { useState } from "react";
import { ChevronLeft, FileSpreadsheet, Upload, ChartBar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { toast } from "sonner";

type Batch = {
  id: string;
  year: string;
  batchId: string;
  section: string;
  semester: string;
};

type MarkEntryProps = {
  batch: Batch;
  onBack: () => void;
};

const MarkEntry = ({ batch, onBack }: MarkEntryProps) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [evaluationType, setEvaluationType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingResults, setProcessingResults] = useState(false);
  const [resultsData, setResultsData] = useState<any | null>(null);

  useState(() => {
    // Load saved subject and evaluation type
    const subject = localStorage.getItem("selectedSubject") || "";
    const evaluation = localStorage.getItem("selectedEvaluation") || "";
    const subjectName = getSubjectNameById(subject);

    setSelectedSubject(subject);
    setSelectedSubjectName(subjectName);
    setEvaluationType(evaluation);
  });

  const getSubjectNameById = (id: string): string => {
    const subjects = [
      { id: "mat101", name: "Advanced Mathematics" },
      { id: "cs201", name: "Data Structures and Algorithms" },
      { id: "ai301", name: "Machine Learning" },
      { id: "ds401", name: "Deep Learning" },
      { id: "cs501", name: "Natural Language Processing" },
    ];

    const subject = subjects.find(s => s.id === id);
    return subject ? subject.name : "";
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleProcessFile = async () => {
    if (!uploadedFile) {
      toast.error("Please upload a file first");
      return;
    }

    setIsUploading(true);
    setProcessingResults(true);

    try {
      // Create FormData object to send the file to the backend
      const formData = new FormData();
      formData.append("file", uploadedFile);
      formData.append("subject", selectedSubject);
      formData.append("subjectName", selectedSubjectName);
      formData.append("evaluationType", evaluationType);
      formData.append("batchId", batch.batchId);
      formData.append("section", batch.section);
      formData.append("semester", batch.semester);
      formData.append("academicYear", batch.year);

      // Send the file to the backend
      const response = await fetch("http://localhost:5000/process-marks-file", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }

      const data = await response.json();
      
      setResultsData(data);
      toast.success("File processed successfully!");
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error(error instanceof Error ? error.message : "Failed to process file");
    } finally {
      setIsUploading(false);
    }
  };

  const renderResults = () => {
    if (!resultsData) return null;

    return (
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-medium">CO-PO Mapping Results</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Outcomes Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Visualization will appear here once implemented
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Student Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">
                Visualization will appear here once implemented
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold">Mark Entry</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload Marks File</CardTitle>
          <CardDescription>
            Subject: {selectedSubjectName} ({selectedSubject}) | Type: {evaluationType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <div className="flex flex-col items-center">
                <FileSpreadsheet className="h-10 w-10 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">Upload Excel or CSV file</h3>
                <p className="text-sm text-gray-500 mb-4">
                  The file should contain student marks and CO mapping information
                </p>
                
                <div className="flex flex-col items-center w-full max-w-sm">
                  <Input 
                    id="file-upload" 
                    type="file" 
                    accept=".xlsx,.csv" 
                    onChange={handleFileUpload}
                    className="mb-4"
                  />
                  
                  <Button 
                    onClick={handleProcessFile} 
                    disabled={!uploadedFile || isUploading}
                    className="w-full"
                  >
                    {isUploading ? (
                      "Processing..."
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Process File
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {resultsData && renderResults()}
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onBack}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  toast.success("Data saved successfully!");
                  onBack();
                }}
                disabled={!resultsData}
              >
                <ChartBar className="mr-2 h-4 w-4" />
                View CO-PO Dashboard
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkEntry;
