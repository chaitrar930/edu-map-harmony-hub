
import { useState, useEffect } from "react";
import { ChevronLeft, Upload, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

type Student = {
  id: string;
  name: string;
  usn: string;
  marks: {
    [questionId: string]: number;
  };
};

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
  const [questionPaper, setQuestionPaper] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [isCIE, setIsCIE] = useState(true);

  useEffect(() => {
    // Get saved subject and evaluation type
    const subject = localStorage.getItem("selectedSubject") || "";
    const evaluation = localStorage.getItem("selectedEvaluation") || "";
    
    setSelectedSubject(subject);
    setEvaluationType(evaluation);
    setIsCIE(evaluation.startsWith("CIE"));
    
    // Find subject name
    const subjects = [
      { id: "mat101", name: "Advanced Mathematics" },
      { id: "cs201", name: "Data Structures and Algorithms" },
      { id: "ai301", name: "Machine Learning" },
      { id: "ds401", name: "Deep Learning" },
      { id: "cs501", name: "Natural Language Processing" },
    ];
    
    const subjectInfo = subjects.find(s => s.id === subject);
    if (subjectInfo) {
      setSelectedSubjectName(subjectInfo.name);
    }
    
    // Sample student data with empty marks
    const sampleStudents = Array(15)
      .fill(null)
      .map((_, i) => ({
        id: (i + 1).toString(),
        name: `Student ${i + 1}`,
        usn: `1DS21AI${(i + 1).toString().padStart(3, "0")}`,
        marks: {},
      }));
    
    setStudents(sampleStudents);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setQuestionPaper(e.target.files[0].name);
      toast.success(`Uploaded: ${e.target.files[0].name}`);
    }
  };

  const handleMarkChange = (studentId: string, questionId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setStudents(
      students.map((student) => {
        if (student.id === studentId) {
          return {
            ...student,
            marks: {
              ...student.marks,
              [questionId]: numValue,
            },
          };
        }
        return student;
      })
    );
  };

  const handleSubmit = () => {
    // In a real app, you would send this data to a backend
    // Here we'll just save to localStorage
    const marksData = {
      batchId: batch.id,
      subject: selectedSubject,
      evaluationType,
      questionPaper,
      students: students.map(({ id, usn, marks }) => ({ id, usn, marks })),
      timestamp: new Date().toISOString(),
    };
    
    // Save to localStorage
    const allMarksData = JSON.parse(localStorage.getItem("marksData") || "[]");
    allMarksData.push(marksData);
    localStorage.setItem("marksData", JSON.stringify(allMarksData));
    
    toast.success("Marks submitted successfully");
    onBack();
  };

  const renderCIETable = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">USN</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Q1.a (5)</TableHead>
            <TableHead>Q1.b (5)</TableHead>
            <TableHead>Q2.a (5)</TableHead>
            <TableHead>Q2.b (5)</TableHead>
            <TableHead>Q3.a (5)</TableHead>
            <TableHead>Q3.b (5)</TableHead>
            <TableHead>Q4.a (5)</TableHead>
            <TableHead>Q4.b (5)</TableHead>
            <TableHead>Q5.a (5)</TableHead>
            <TableHead>Q5.b (5)</TableHead>
            <TableHead>Total (50)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.usn}</TableCell>
              <TableCell>{student.name}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q1a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q1a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q1b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q1b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q2a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q2a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q2b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q2b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q3a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q3a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q3b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q3b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q4a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q4a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q4b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q4b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q5a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q5a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="5"
                  value={student.marks["q5b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q5b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell className="font-medium">
                {Object.values(student.marks).reduce((sum, mark) => sum + (mark || 0), 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  const renderSEETable = () => {
    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">USN</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Q1.a (10)</TableHead>
            <TableHead>Q1.b (10)</TableHead>
            <TableHead>Q2.a (10)</TableHead>
            <TableHead>Q2.b (10)</TableHead>
            <TableHead>Q3.a (10)</TableHead>
            <TableHead>Q3.b (10)</TableHead>
            <TableHead>Q4.a (10)</TableHead>
            <TableHead>Q4.b (10)</TableHead>
            <TableHead>Q5.a (10)</TableHead>
            <TableHead>Q5.b (10)</TableHead>
            <TableHead>Total (100)</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.usn}</TableCell>
              <TableCell>{student.name}</TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q1a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q1a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q1b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q1b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q2a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q2a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q2b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q2b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q3a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q3a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q3b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q3b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q4a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q4a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q4b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q4b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q5a"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q5a", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={student.marks["q5b"] || ""}
                  onChange={(e) => handleMarkChange(student.id, "q5b", e.target.value)}
                  className="w-12 h-8"
                />
              </TableCell>
              <TableCell className="font-medium">
                {Object.values(student.marks).reduce((sum, mark) => sum + (mark || 0), 0)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
          <CardTitle>Mark Entry Details</CardTitle>
          <CardDescription>
            Enter marks for {selectedSubjectName} - {evaluationType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-sm text-gray-500">Batch</p>
              <p className="font-medium">
                {batch.batchId} - Section {batch.section}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Academic Year</p>
              <p className="font-medium">{batch.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Subject</p>
              <p className="font-medium">{selectedSubjectName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Evaluation</p>
              <p className="font-medium">{evaluationType}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">
              Upload Question Paper
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="max-w-md"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex items-center"
              >
                <Upload className="mr-1 h-4 w-4" />
                Upload
              </Button>
            </div>
            {questionPaper && (
              <p className="text-sm text-green-600 mt-1">
                Uploaded: {questionPaper}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Enter Marks</CardTitle>
          <CardDescription>
            {isCIE
              ? "Enter marks for CIE (50 marks total)"
              : "Enter marks for SEE (100 marks total)"}
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isCIE ? renderCIETable() : renderSEETable()}
          
          <div className="mt-6 flex justify-end">
            <Button onClick={handleSubmit} className="flex items-center">
              <Save className="mr-2 h-4 w-4" />
              Submit Marks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkEntry;
