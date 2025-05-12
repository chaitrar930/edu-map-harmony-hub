
import { useState, useEffect } from "react";
import { ChevronLeft, FileSpreadsheet, Upload, ChartBar, Percent, Info } from "lucide-react";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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

// Mock data for demonstration
const mockResultsData = {
  status: "success",
  message: "File processed successfully",
  submission_id: 123,
  question_metrics: {
    "Q1A": { max_mark: 5, threshold: 3, num_attempted: 62, num_above_threshold: 48, co_attainment: 77.42 },
    "Q1B": { max_mark: 5, threshold: 3, num_attempted: 60, num_above_threshold: 42, co_attainment: 70.00 },
    "Q2A": { max_mark: 5, threshold: 3, num_attempted: 59, num_above_threshold: 40, co_attainment: 67.80 },
    "Q2B": { max_mark: 5, threshold: 3, num_attempted: 57, num_above_threshold: 38, co_attainment: 66.67 },
    "Q3A": { max_mark: 5, threshold: 3, num_attempted: 50, num_above_threshold: 36, co_attainment: 72.00 },
    "Q3B": { max_mark: 5, threshold: 3, num_attempted: 48, num_above_threshold: 32, co_attainment: 66.67 },
    "Q4A": { max_mark: 5, threshold: 3, num_attempted: 45, num_above_threshold: 35, co_attainment: 77.78 },
    "Q4B": { max_mark: 5, threshold: 3, num_attempted: 42, num_above_threshold: 30, co_attainment: 71.43 },
    "Q5A": { max_mark: 10, threshold: 6, num_attempted: 40, num_above_threshold: 32, co_attainment: 80.00 },
    "Q5B": { max_mark: 10, threshold: 6, num_attempted: 38, num_above_threshold: 30, co_attainment: 78.95 },
    "Q6A": { max_mark: 10, threshold: 6, num_attempted: 36, num_above_threshold: 28, co_attainment: 77.78 },
    "Q6B": { max_mark: 10, threshold: 6, num_attempted: 35, num_above_threshold: 26, co_attainment: 74.29 },
    "LAB_1_Q1": { max_mark: 6, threshold: 3.6, num_attempted: 62, num_above_threshold: 50, co_attainment: 80.65 },
    "LAB_1_Q2": { max_mark: 4, threshold: 2.4, num_attempted: 60, num_above_threshold: 48, co_attainment: 80.00 },
    "LAB_1_Q3": { max_mark: 10, threshold: 6, num_attempted: 58, num_above_threshold: 45, co_attainment: 77.59 },
    "LAB_1_Q4": { max_mark: 10, threshold: 6, num_attempted: 56, num_above_threshold: 42, co_attainment: 75.00 }
  },
  co_data: {
    co_attainment: {
      "0": 72.50,
      "1": 68.75,
      "2": 76.25,
      "3": 74.45,
      "4": 78.90,
      "5": 79.50
    },
    co_attainment_theory: {
      "0": 70.20,
      "1": 67.23,
      "2": 74.88,
      "3": 72.11,
      "4": 77.78,
      "5": 78.21
    },
    co_attainment_lab: {
      "0": 78.32,
      "1": 77.50,
      "2": 79.40,
      "3": 78.56,
      "4": 80.15,
      "5": 81.25
    },
    summary: {
      average_attainment: 75.06,
      average_theory: 73.40,
      average_lab: 79.20
    }
  },
  po_data: {
    po_attainment: {
      "PO1": 73.50,
      "PO2": 71.25,
      "PO3": 70.50,
      "PO4": 68.75,
      "PO5": 77.80,
      "PO8": 79.40,
      "PO9": 75.60,
      "PO10": 74.30,
      "PO11": 70.80,
      "PO12": 76.90
    },
    po_attainment_theory: {
      "PO1": 71.20,
      "PO2": 69.40,
      "PO3": 68.50,
      "PO4": 65.70,
      "PO5": 75.40,
      "PO8": 77.50,
      "PO9": 73.30,
      "PO10": 72.10,
      "PO11": 68.90,
      "PO12": 74.40
    },
    po_attainment_lab: {
      "PO1": 78.40,
      "PO2": 76.50,
      "PO3": 76.30,
      "PO4": 74.20,
      "PO5": 80.70,
      "PO8": 82.60,
      "PO9": 79.20,
      "PO10": 78.60,
      "PO11": 75.40,
      "PO12": 80.50
    },
    summary: {
      average_attainment: 73.88,
      average_theory: 71.64,
      average_lab: 78.24
    }
  },
  summary: {
    total_students: 65,
    total_questions: 16,
    subject: "Machine Learning",
    evaluation: "CIE-1"
  }
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
  const [showMockData, setShowMockData] = useState(false);

  useEffect(() => {
    // Load saved subject and evaluation type
    const subject = localStorage.getItem("selectedSubject") || "ai301";
    const evaluation = localStorage.getItem("selectedEvaluation") || "CIE-1";
    const subjectName = getSubjectNameById(subject);

    setSelectedSubject(subject);
    setSelectedSubjectName(subjectName);
    setEvaluationType(evaluation);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFile(file);
      toast.success(`File selected: ${file.name}`);
    }
  };

  const handleProcessFile = async () => {
    if (!uploadedFile && !showMockData) {
      toast.error("Please upload a file first");
      return;
    }

    setIsUploading(true);
    setProcessingResults(true);

    try {
      // For demo purpose, we'll use mock data instead of actual API call
      setTimeout(() => {
        setResultsData(mockResultsData);
        toast.success("File processed successfully!");
        setIsUploading(false);
      }, 2000);
    } catch (error) {
      console.error("Error processing file:", error);
      toast.error("Failed to process file");
      setIsUploading(false);
    }
  };

  const renderQuestionMetrics = () => {
    if (!resultsData?.question_metrics) return null;

    const questionMetrics = resultsData.question_metrics;
    const questionIds = Object.keys(questionMetrics);

    // Split into theory and lab questions
    const theoryQuestions = questionIds.filter(id => !id.startsWith('LAB_'));
    const labQuestions = questionIds.filter(id => id.startsWith('LAB_'));

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Question-level Metrics
          </CardTitle>
          <CardDescription>Analysis of student performance by question</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Theory Questions */}
            <div>
              <h3 className="text-lg font-medium mb-3">Theory Components</h3>
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
                    {theoryQuestions.map((questionId) => {
                      const data = questionMetrics[questionId];
                      return (
                        <TableRow key={questionId}>
                          <TableCell className="font-medium">{questionId}</TableCell>
                          <TableCell>{data.max_mark}</TableCell>
                          <TableCell>{data.threshold}</TableCell>
                          <TableCell>{data.num_attempted}</TableCell>
                          <TableCell>{data.num_above_threshold}</TableCell>
                          <TableCell className={`${data.co_attainment >= 70 ? 'text-green-600 font-medium' : data.co_attainment >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                            {data.co_attainment.toFixed(2)}%
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Lab Questions */}
            {labQuestions.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-3">Lab Components</h3>
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
                      {labQuestions.map((questionId) => {
                        const data = questionMetrics[questionId];
                        return (
                          <TableRow key={questionId}>
                            <TableCell className="font-medium">{questionId}</TableCell>
                            <TableCell>{data.max_mark}</TableCell>
                            <TableCell>{data.threshold}</TableCell>
                            <TableCell>{data.num_attempted}</TableCell>
                            <TableCell>{data.num_above_threshold}</TableCell>
                            <TableCell className={`${data.co_attainment >= 70 ? 'text-green-600 font-medium' : data.co_attainment >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                              {data.co_attainment.toFixed(2)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}
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
          <CardTitle className="flex items-center gap-2">
            <ChartBar className="h-5 w-5" />
            Course Outcome (CO) Attainment
          </CardTitle>
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
                      <TableCell className={`${coAttainment[co] >= 70 ? 'text-green-600 font-medium' : coAttainment[co] >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {coAttainment[co].toFixed(2)}%
                      </TableCell>
                      <TableCell className={`${coAttainmentTheory[co] >= 70 ? 'text-green-600 font-medium' : coAttainmentTheory[co] >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {(coAttainmentTheory[co] || 0).toFixed(2)}%
                      </TableCell>
                      <TableCell className={`${coAttainmentLab[co] >= 70 ? 'text-green-600 font-medium' : coAttainmentLab[co] >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {(coAttainmentLab[co] || 0).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Average</TableCell>
                    <TableCell className={`${resultsData.co_data.summary.average_attainment >= 70 ? 'text-green-600' : resultsData.co_data.summary.average_attainment >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {resultsData.co_data.summary.average_attainment.toFixed(2)}%
                    </TableCell>
                    <TableCell className={`${resultsData.co_data.summary.average_theory >= 70 ? 'text-green-600' : resultsData.co_data.summary.average_theory >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {resultsData.co_data.summary.average_theory.toFixed(2)}%
                    </TableCell>
                    <TableCell className={`${resultsData.co_data.summary.average_lab >= 70 ? 'text-green-600' : resultsData.co_data.summary.average_lab >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {resultsData.co_data.summary.average_lab.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Alert className="mt-4 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  Course Outcome attainment target: 70% (High), 60-70% (Medium), Below 60% (Low)
                </AlertDescription>
              </Alert>
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
          <CardTitle className="flex items-center gap-2">
            <ChartBar className="h-5 w-5" />
            Program Outcome (PO) Attainment
          </CardTitle>
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
                      <TableCell className={`${poAttainment[po] >= 70 ? 'text-green-600 font-medium' : poAttainment[po] >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {poAttainment[po].toFixed(2)}%
                      </TableCell>
                      <TableCell className={`${poAttainmentTheory[po] >= 70 ? 'text-green-600 font-medium' : poAttainmentTheory[po] >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {(poAttainmentTheory[po] || 0).toFixed(2)}%
                      </TableCell>
                      <TableCell className={`${poAttainmentLab[po] >= 70 ? 'text-green-600 font-medium' : poAttainmentLab[po] >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                        {(poAttainmentLab[po] || 0).toFixed(2)}%
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-bold">
                    <TableCell>Average</TableCell>
                    <TableCell className={`${resultsData.po_data.summary.average_attainment >= 70 ? 'text-green-600' : resultsData.po_data.summary.average_attainment >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {resultsData.po_data.summary.average_attainment.toFixed(2)}%
                    </TableCell>
                    <TableCell className={`${resultsData.po_data.summary.average_theory >= 70 ? 'text-green-600' : resultsData.po_data.summary.average_theory >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {resultsData.po_data.summary.average_theory.toFixed(2)}%
                    </TableCell>
                    <TableCell className={`${resultsData.po_data.summary.average_lab >= 70 ? 'text-green-600' : resultsData.po_data.summary.average_lab >= 60 ? 'text-yellow-600' : 'text-orange-600'}`}>
                      {resultsData.po_data.summary.average_lab.toFixed(2)}%
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <Alert className="mt-4 bg-blue-50">
                <Info className="h-4 w-4" />
                <AlertTitle>Information</AlertTitle>
                <AlertDescription>
                  Program Outcome attainment target: 70% (High), 60-70% (Medium), Below 60% (Low)
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderSummary = () => {
    if (!resultsData?.summary) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Processing Summary</CardTitle>
          <CardDescription>Overview of analyzed data</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="border rounded-lg p-4 bg-blue-50">
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-2xl font-bold">{resultsData.summary.total_students}</p>
            </div>
            <div className="border rounded-lg p-4 bg-purple-50">
              <p className="text-sm text-gray-500">Total Questions</p>
              <p className="text-2xl font-bold">{resultsData.summary.total_questions}</p>
            </div>
            <div className="border rounded-lg p-4 bg-green-50">
              <p className="text-sm text-gray-500">Subject</p>
              <p className="text-2xl font-bold">{resultsData.summary.subject}</p>
            </div>
            <div className="border rounded-lg p-4 bg-amber-50">
              <p className="text-sm text-gray-500">Evaluation</p>
              <p className="text-2xl font-bold">{resultsData.summary.evaluation}</p>
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
        
        {renderSummary()}
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
                  
                  <div className="flex gap-4">
                    <Button 
                      onClick={handleProcessFile} 
                      disabled={isUploading}
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
                    <Button 
                      onClick={() => {
                        setResultsData(mockResultsData);
                        toast.success("Demo data loaded successfully!");
                        setShowMockData(true);
                      }} 
                      variant="secondary"
                      className="w-full"
                    >
                      <Info className="mr-2 h-4 w-4" />
                      Load Demo Data
                    </Button>
                  </div>
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
