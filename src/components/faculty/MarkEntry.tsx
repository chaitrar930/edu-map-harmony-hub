
import { useState, useEffect } from "react";
import { ChevronLeft, FileSpreadsheet, Upload, ChartBar, Percent } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

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

// Define the subject name getter function before it's used in the hook
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

const MarkEntry = ({ batch, onBack }: MarkEntryProps) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedSubjectName, setSelectedSubjectName] = useState("");
  const [evaluationType, setEvaluationType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingResults, setProcessingResults] = useState(false);
  const [resultsData, setResultsData] = useState<any | null>(null);

  useEffect(() => {
    // Load saved subject and evaluation type
    const subject = localStorage.getItem("selectedSubject") || "";
    const evaluation = localStorage.getItem("selectedEvaluation") || "";
    const subjectName = getSubjectNameById(subject);

    setSelectedSubject(subject);
    setSelectedSubjectName(subjectName);
    setEvaluationType(evaluation);
  }, []); // Added proper dependency array for useEffect

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

  const renderQuestionMetrics = () => {
    if (!resultsData?.question_metrics) return null;

    const questionMetrics = resultsData.question_metrics;
    const questionIds = Object.keys(questionMetrics);

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Question-level Metrics</CardTitle>
          <CardDescription>Analysis of student performance by question</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Question</TableHead>
                  <TableHead>Max Marks</TableHead>
                  <TableHead>60% Threshold</TableHead>
                  <TableHead>Students Attempted (A)</TableHead>
                  <TableHead>Students Above 60% (B)</TableHead>
                  <TableHead>CO Attainment (B/A %)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionIds.map((questionId) => {
                  const data = questionMetrics[questionId];
                  return (
                    <TableRow key={questionId}>
                      <TableCell className="font-medium">{questionId}</TableCell>
                      <TableCell>{data.max_mark}</TableCell>
                      <TableCell>{data.threshold}</TableCell>
                      <TableCell>{data.num_attempted}</TableCell>
                      <TableCell>{data.num_above_threshold}</TableCell>
                      <TableCell>{data.co_attainment}%</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderCOAttainment = () => {
    if (!resultsData?.co_data?.co_attainment) return null;

    const coAttainment = resultsData.co_data.co_attainment;
    const coAttainmentTheory = resultsData.co_data.co_attainment_theory || {};
    const coAttainmentLab = resultsData.co_data.co_attainment_lab || {};
    
    // Prepare data for chart
    const chartData = Object.keys(coAttainment).map(co => ({
      name: `CO${co}`,
      Overall: coAttainment[co],
      Theory: coAttainmentTheory[co] || 0,
      Lab: coAttainmentLab[co] || 0
    }));

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Course Outcome (CO) Attainment</CardTitle>
          <CardDescription>Analysis of CO attainment percentages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="Overall" fill="#8884d8" name="Overall" />
                  <Bar dataKey="Theory" fill="#82ca9d" name="Theory" />
                  <Bar dataKey="Lab" fill="#ffc658" name="Lab" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">CO Attainment Details</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Outcome</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Theory</TableHead>
                    <TableHead>Lab</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(coAttainment).map((co) => (
                    <TableRow key={co}>
                      <TableCell className="font-medium">CO{co}</TableCell>
                      <TableCell>{coAttainment[co]}%</TableCell>
                      <TableCell>{coAttainmentTheory[co] || 0}%</TableCell>
                      <TableCell>{coAttainmentLab[co] || 0}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">Average</TableCell>
                    <TableCell className="font-bold">{resultsData.co_data.summary.average_attainment}%</TableCell>
                    <TableCell className="font-bold">{resultsData.co_data.summary.average_theory || 0}%</TableCell>
                    <TableCell className="font-bold">{resultsData.co_data.summary.average_lab || 0}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPOAttainment = () => {
    if (!resultsData?.po_data?.po_attainment) return null;

    const poAttainment = resultsData.po_data.po_attainment;
    const poAttainmentTheory = resultsData.po_data.po_attainment_theory || {};
    const poAttainmentLab = resultsData.po_data.po_attainment_lab || {};
    
    // Prepare data for chart
    const chartData = Object.keys(poAttainment).map(po => ({
      name: po,
      Overall: poAttainment[po],
      Theory: poAttainmentTheory[po] || 0,
      Lab: poAttainmentLab[po] || 0
    }));

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Program Outcome (PO) Attainment</CardTitle>
          <CardDescription>Analysis of PO attainment percentages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                  <Bar dataKey="Overall" fill="#8884d8" name="Overall" />
                  <Bar dataKey="Theory" fill="#82ca9d" name="Theory" />
                  <Bar dataKey="Lab" fill="#ffc658" name="Lab" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div>
              <h4 className="text-sm font-medium mb-3">PO Attainment Details</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Program Outcome</TableHead>
                    <TableHead>Overall</TableHead>
                    <TableHead>Theory</TableHead>
                    <TableHead>Lab</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.keys(poAttainment).map((po) => (
                    <TableRow key={po}>
                      <TableCell className="font-medium">{po}</TableCell>
                      <TableCell>{poAttainment[po]}%</TableCell>
                      <TableCell>{poAttainmentTheory[po] || 0}%</TableCell>
                      <TableCell>{poAttainmentLab[po] || 0}%</TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50">
                    <TableCell className="font-bold">Average</TableCell>
                    <TableCell className="font-bold">{resultsData.po_data.summary.average_attainment}%</TableCell>
                    <TableCell className="font-bold">{resultsData.po_data.summary.average_theory || 0}%</TableCell>
                    <TableCell className="font-bold">{resultsData.po_data.summary.average_lab || 0}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderResults = () => {
    if (!resultsData) return null;

    return (
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-medium">CO-PO Mapping Results</h3>
        
        {renderQuestionMetrics()}
        {renderCOAttainment()}
        {renderPOAttainment()}
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

            {renderResults()}
            
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
