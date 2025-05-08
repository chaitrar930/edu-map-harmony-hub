
import { useState, useEffect } from "react";
import { ChevronLeft, FileText, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Student = {
  id: string;
  name: string;
  usn: string;
};

type Batch = {
  id: string;
  year: string;
  batchId: string;
  section: string;
  semester: string;
  createdAt: string;
};

type BatchDetailsProps = {
  batch: Batch;
  onBack: () => void;
  onMarkEntryClick: () => void;
  onCoPOMappingClick: () => void;
};

const subjects = [
  { id: "mat101", name: "Advanced Mathematics" },
  { id: "cs201", name: "Data Structures and Algorithms" },
  { id: "ai301", name: "Machine Learning" },
  { id: "ds401", name: "Deep Learning" },
  { id: "cs501", name: "Natural Language Processing" },
];

// Sample student data
const sampleStudents: Student[] = Array(15)
  .fill(null)
  .map((_, i) => ({
    id: (i + 1).toString(),
    name: `Student ${i + 1}`,
    usn: `1DS23AI${(i + 1).toString().padStart(3, "0")}`,
  }));

const BatchDetails = ({
  batch,
  onBack,
  onMarkEntryClick,
  onCoPOMappingClick,
}: BatchDetailsProps) => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedEvaluation, setSelectedEvaluation] = useState("");

  useEffect(() => {
    // In a real app, you would fetch students for this batch from a backend
    // Here we'll just use sample data
    setStudents(sampleStudents);
  }, [batch.id]);

  const handleMarkEntryClick = () => {
    if (!selectedSubject) {
      alert("Please select a subject");
      return;
    }
    if (!selectedEvaluation) {
      alert("Please select an evaluation type");
      return;
    }
    
    // Store the selected subject and evaluation for use in mark entry
    localStorage.setItem("selectedSubject", selectedSubject);
    localStorage.setItem("selectedEvaluation", selectedEvaluation);
    
    onMarkEntryClick();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" onClick={onBack}>
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-bold">
          {batch.batchId} - Section {batch.section}
        </h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Batch Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-gray-500">Academic Year</p>
              <p className="font-medium">{batch.year}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Semester</p>
              <p className="font-medium">{batch.semester}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Section</p>
              <p className="font-medium">{batch.section}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mark Entry</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">
                Select Subject
              </label>
              <Select
                value={selectedSubject}
                onValueChange={setSelectedSubject}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Select Evaluation
              </label>
              <Select
                value={selectedEvaluation}
                onValueChange={setSelectedEvaluation}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select evaluation type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CIE-1">CIE-1</SelectItem>
                  <SelectItem value="CIE-2">CIE-2</SelectItem>
                  <SelectItem value="CIE-3">CIE-3</SelectItem>
                  <SelectItem value="SEE">SEE</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <Button
              onClick={handleMarkEntryClick}
              disabled={!selectedSubject || !selectedEvaluation}
              className="flex items-center"
            >
              <FileText className="mr-2 h-4 w-4" />
              Enter Marks
            </Button>
            
            <Button
              variant="outline"
              onClick={onCoPOMappingClick}
              className="flex items-center"
            >
              <BarChart2 className="mr-2 h-4 w-4" />
              View CO-PO Mapping
            </Button>
          </div>
        </CardContent>
      </Card>

      {selectedSubject && (
        <Card>
          <CardHeader>
            <CardTitle>Students</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>USN</TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.usn}</TableCell>
                    <TableCell>{student.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BatchDetails;
