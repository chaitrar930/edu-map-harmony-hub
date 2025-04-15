
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

interface StudentMarks {
  cie: "CIE-1" | "CIE-2" | "CIE-3" | "SEE";
  questions: {
    number: number;
    subQuestions: { marks: number }[];
  }[];
}

const StudentDashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [marks, setMarks] = useState<StudentMarks[]>([]);

  useEffect(() => {
    // Simulate fetching marks from localStorage
    const dummyMarks: StudentMarks[] = [
      {
        cie: "CIE-1",
        questions: [
          { number: 1, subQuestions: [{ marks: 4 }, { marks: 5 }] },
          { number: 2, subQuestions: [{ marks: 3 }, { marks: 4 }] },
          { number: 3, subQuestions: [{ marks: 5 }, { marks: 4 }] },
        ],
      },
      // Add more dummy data for other CIEs and SEE
    ];
    setMarks(dummyMarks);
  }, []);

  const handleLogout = () => {
    signOut();
    navigate("/signin");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Welcome, {user?.name}</h1>
          <p className="text-muted-foreground">USN: {user?.usn}</p>
        </div>
        <Button variant="outline" onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

      <Tabs defaultValue="marks" className="space-y-4">
        <TabsList>
          <TabsTrigger value="marks">View Marks</TabsTrigger>
          <TabsTrigger value="copo">CO-PO Mapping</TabsTrigger>
        </TabsList>

        <TabsContent value="marks">
          <Card>
            <CardHeader>
              <CardTitle>Academic Performance</CardTitle>
              <CardDescription>
                View your question-wise marks for all assessments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="CIE-1">
                <TabsList>
                  <TabsTrigger value="CIE-1">CIE-1</TabsTrigger>
                  <TabsTrigger value="CIE-2">CIE-2</TabsTrigger>
                  <TabsTrigger value="CIE-3">CIE-3</TabsTrigger>
                  <TabsTrigger value="SEE">SEE</TabsTrigger>
                </TabsList>

                {["CIE-1", "CIE-2", "CIE-3", "SEE"].map((exam) => (
                  <TabsContent key={exam} value={exam}>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Question No.</TableHead>
                          <TableHead>Part A</TableHead>
                          <TableHead>Part B</TableHead>
                          <TableHead>Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {marks
                          .find((m) => m.cie === exam)
                          ?.questions.map((q) => (
                            <TableRow key={q.number}>
                              <TableCell>Question {q.number}</TableCell>
                              <TableCell>{q.subQuestions[0].marks}</TableCell>
                              <TableCell>{q.subQuestions[1].marks}</TableCell>
                              <TableCell>
                                {q.subQuestions.reduce(
                                  (sum, sq) => sum + sq.marks,
                                  0
                                )}
                              </TableCell>
                            </TableRow>
                          )) ?? (
                          <TableRow>
                            <TableCell colSpan={4} className="text-center">
                              No marks available
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="copo">
          <Card>
            <CardHeader>
              <CardTitle>CO-PO Mapping Results</CardTitle>
              <CardDescription>
                View your Course Outcome and Program Outcome mapping results
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Course Outcome</TableHead>
                    <TableHead>Program Outcome</TableHead>
                    <TableHead>Attainment Level</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Dummy CO-PO mapping data */}
                  <TableRow>
                    <TableCell>CO1</TableCell>
                    <TableCell>PO1, PO2</TableCell>
                    <TableCell>3</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>CO2</TableCell>
                    <TableCell>PO2, PO3</TableCell>
                    <TableCell>2</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default StudentDashboard;
