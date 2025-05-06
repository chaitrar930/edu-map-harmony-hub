import { useState, useEffect } from "react";
import { ChevronLeft, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    const subject = localStorage.getItem("selectedSubject") || "";
    const evaluation = localStorage.getItem("selectedEvaluation") || "";

    setSelectedSubject(subject);
    setEvaluationType(evaluation);
    setIsCIE(evaluation.startsWith("CIE"));

    const subjects = [
      { id: "mat101", name: "Advanced Mathematics" },
      { id: "cs201", name: "Data Structures and Algorithms" },
      { id: "ai301", name: "Machine Learning" },
      { id: "ds401", name: "Deep Learning" },
      { id: "cs501", name: "Natural Language Processing" },
    ];

    const subjectInfo = subjects.find((s) => s.id === subject);
    if (subjectInfo) {
      setSelectedSubjectName(subjectInfo.name);
    }

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
    setStudents((prevStudents) =>
      prevStudents.map((student) =>
        student.id === studentId
          ? { ...student, marks: { ...student.marks, [questionId]: numValue } }
          : student
      )
    );
  };

  const testBackendConnection = async () => {
    setIsTesting(true);
    try {
      // Test basic connection
      const ping = await fetch('http://localhost:5000');
      if (!ping.ok) throw new Error('Backend not responding');
      
      // Test submissions endpoint
      const subs = await fetch('http://localhost:5000/submissions');
      const data = await subs.json();
      
      toast.success(`Backend connected! Found ${data.length} submissions`);
      console.log('Backend test successful:', data);
    } catch (error) {
      toast.error('Backend connection failed');
      console.error('Connection test failed:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const validateSubmission = () => {
    if (!selectedSubject) {
      toast.error('Please select a subject');
      return false;
    }
    
    // Check if at least one student has marks
    const hasMarks = students.some(student => 
      Object.values(student.marks).some(mark => mark > 0)
    );
    
    if (!hasMarks) {
      toast.error('Please enter marks for at least one student');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateSubmission()) return;

    const formData = {
      subjectCode: selectedSubject,
      subjectName: selectedSubjectName,
      evaluationType,
      questionPaper,
      batch: {
        ...batch,
        id: batch.id || Date.now().toString(), // Ensure batch has an ID
      },
      students: students.map(student => ({
        usn: student.usn,
        marks: student.marks
      }))
    };

    try {
      const response = await fetch("http://localhost:5000/submit-marks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || "Marks submitted successfully");
        // Reset marks after successful submission
        setStudents(prev => prev.map(student => ({
          ...student,
          marks: {}
        })));
      } else {
        throw new Error(data.message || "Submission failed");
      }
    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to submit marks");
    }
  };

  const renderTable = () => {
    const maxMarks = isCIE ? 5 : 10;
    const total = isCIE ? 50 : 100;

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">USN</TableHead>
            <TableHead>Name</TableHead>
            {["1", "2", "3", "4", "5"].map((q) => (
              <>
                <TableHead key={`q${q}a`}>{`Q${q}.a (${maxMarks})`}</TableHead>
                <TableHead key={`q${q}b`}>{`Q${q}.b (${maxMarks})`}</TableHead>
              </>
            ))}
            <TableHead>Total ({total})</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((student) => (
            <TableRow key={student.id}>
              <TableCell className="font-medium">{student.usn}</TableCell>
              <TableCell>{student.name}</TableCell>
              {["1", "2", "3", "4", "5"].map((q) => (
                <>
                  <TableCell key={`q${q}a`}>
                    <Input
                      type="number"
                      min="0"
                      max={maxMarks}
                      value={student.marks[`q${q}a`] || ""}
                      onChange={(e) =>
                        handleMarkChange(student.id, `q${q}a`, e.target.value)
                      }
                      className="w-12 h-8"
                    />
                  </TableCell>
                  <TableCell key={`q${q}b`}>
                    <Input
                      type="number"
                      min="0"
                      max={maxMarks}
                      value={student.marks[`q${q}b`] || ""}
                      onChange={(e) =>
                        handleMarkChange(student.id, `q${q}b`, e.target.value)
                      }
                      className="w-12 h-8"
                    />
                  </TableCell>
                </>
              ))}
              <TableCell className="font-medium">
                {Object.values(student.marks).reduce(
                  (sum, mark) => sum + (mark || 0),
                  0
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="space-y-4 relative">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold">Mark Entry</h2>
        
        {/* Test Connection Button */}
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto"
          onClick={testBackendConnection}
          disabled={isTesting}
        >
          <Wrench className="mr-1 h-4 w-4" />
          {isTesting ? "Testing..." : "Test Connection"}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mark Entry Details</CardTitle>
          <CardDescription>
            Subject: {selectedSubjectName} ({selectedSubject}) | Type: {evaluationType}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input 
              type="file" 
              accept=".pdf,.doc,.docx" 
              onChange={handleFileUpload} 
            />
          </div>
          {renderTable()}
          <div className="flex justify-end mt-4 space-x-2">
            <Button variant="outline" onClick={onBack}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Submit Marks
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarkEntry;