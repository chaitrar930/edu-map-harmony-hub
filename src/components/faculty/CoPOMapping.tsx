
import { useState, useEffect } from "react";
import { ChevronLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Define the prop types
type CoPOMappingProps = {
  batch?: {
    id: string;
    batchId: string;
    section: string;
    year: string;
    semester: string;
  };
  onBack?: () => void;
};

// Sample CO-PO mapping data
const sampleCoPoData = {
  courseOutcomes: [
    "CO1: Apply mathematical foundations for machine learning applications",
    "CO2: Implement various algorithms and evaluate their performance",
    "CO3: Develop solutions for real-world problems using appropriate ML techniques",
    "CO4: Analyze and interpret results of machine learning models",
    "CO5: Design and create innovative AI/ML solutions"
  ],
  programOutcomes: [
    "PO1: Engineering Knowledge",
    "PO2: Problem Analysis",
    "PO3: Design/Development of Solutions",
    "PO4: Conduct Investigations",
    "PO5: Modern Tool Usage",
    "PO6: Engineer and Society",
    "PO7: Environment and Sustainability",
    "PO8: Ethics",
    "PO9: Individual and Team Work",
    "PO10: Communication",
    "PO11: Project Management",
    "PO12: Life-long Learning"
  ],
  mapping: [
    [3, 3, 2, 1, 2, 0, 0, 1, 1, 1, 0, 1],
    [2, 3, 3, 2, 3, 0, 0, 1, 2, 1, 1, 2],
    [3, 3, 3, 2, 3, 1, 1, 1, 2, 2, 2, 2],
    [2, 3, 2, 3, 2, 0, 0, 1, 2, 2, 1, 2],
    [3, 3, 3, 2, 3, 2, 1, 1, 2, 2, 2, 3]
  ],
  attainment: {
    cie1: [68, 72, 65, 70, 62],
    cie2: [72, 75, 70, 68, 70],
    cie3: [75, 78, 74, 72, 75],
    see: [65, 70, 68, 66, 72]
  }
};

const CoPOMapping = ({ batch, onBack }: CoPOMappingProps) => {
  const [selectedSubject, setSelectedSubject] = useState("ai301");
  const [copoData, setCopoData] = useState(sampleCoPoData);
  const [overallAttainment, setOverallAttainment] = useState<number[]>([]);

  useEffect(() => {
    // Calculate overall attainment (weighted average of CIEs and SEE)
    // Typically 50% SEE and 50% CIE (with CIEs averaged)
    const cieWeight = 0.5;
    const seeWeight = 0.5;
    
    const cieAvg = copoData.courseOutcomes.map((_, i) => {
      return (copoData.attainment.cie1[i] + copoData.attainment.cie2[i] + copoData.attainment.cie3[i]) / 3;
    });
    
    const overall = copoData.courseOutcomes.map((_, i) => {
      return (cieAvg[i] * cieWeight) + (copoData.attainment.see[i] * seeWeight);
    });
    
    setOverallAttainment(overall);
  }, [copoData]);

  const handleExport = () => {
    toast.success("Report exported successfully!");
  };

  const handlePrint = () => {
    window.print();
  };

  // Render color based on mapping strength
  const getMappingColor = (value: number) => {
    switch (value) {
      case 3: return "bg-green-100";
      case 2: return "bg-yellow-100";
      case 1: return "bg-orange-100";
      default: return "";
    }
  };

  // Render color based on attainment percentage
  const getAttainmentColor = (value: number) => {
    if (value >= 70) return "bg-green-100";
    if (value >= 60) return "bg-yellow-100";
    return "bg-orange-100";
  };

  return (
    <div className="space-y-4">
      {onBack && (
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ChevronLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          <h2 className="text-xl font-bold">CO-PO Mapping Analysis</h2>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Course Outcome - Program Outcome Mapping</CardTitle>
          <CardDescription>
            View and analyze the mapping between course outcomes and program outcomes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {batch && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                <p className="text-sm text-gray-500">Semester</p>
                <p className="font-medium">{batch.semester}</p>
              </div>
            </div>
          )}
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-1">
              Select Subject
            </label>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="max-w-md">
                <SelectValue placeholder="Select a subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mat101">Advanced Mathematics</SelectItem>
                <SelectItem value="cs201">Data Structures and Algorithms</SelectItem>
                <SelectItem value="ai301">Machine Learning</SelectItem>
                <SelectItem value="ds401">Deep Learning</SelectItem>
                <SelectItem value="cs501">Natural Language Processing</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="flex items-center"
            >
              <Download className="mr-2 h-4 w-4" />
              Export Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center"
            >
              <Printer className="mr-2 h-4 w-4" />
              Print Report
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CO-PO Mapping Matrix</CardTitle>
          <CardDescription>
            Correlation levels: 3 - Strong, 2 - Medium, 1 - Low, 0 - No correlation
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[200px]">Course Outcomes</TableHead>
                {copoData.programOutcomes.map((po, i) => (
                  <TableHead key={i} className="text-center">
                    PO{i + 1}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {copoData.courseOutcomes.map((co, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">CO{i + 1}</TableCell>
                  {copoData.mapping[i].map((value, j) => (
                    <TableCell 
                      key={j} 
                      className={`text-center ${getMappingColor(value)}`}
                    >
                      {value > 0 ? value : "-"}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CO Attainment Analysis</CardTitle>
          <CardDescription>
            Attainment levels for each assessment component (%)
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">CO</TableHead>
                <TableHead className="text-center">CIE-1</TableHead>
                <TableHead className="text-center">CIE-2</TableHead>
                <TableHead className="text-center">CIE-3</TableHead>
                <TableHead className="text-center">SEE</TableHead>
                <TableHead className="text-center">Overall</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {copoData.courseOutcomes.map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="font-medium">CO{i + 1}</TableCell>
                  <TableCell className={`text-center ${getAttainmentColor(copoData.attainment.cie1[i])}`}>
                    {copoData.attainment.cie1[i]}%
                  </TableCell>
                  <TableCell className={`text-center ${getAttainmentColor(copoData.attainment.cie2[i])}`}>
                    {copoData.attainment.cie2[i]}%
                  </TableCell>
                  <TableCell className={`text-center ${getAttainmentColor(copoData.attainment.cie3[i])}`}>
                    {copoData.attainment.cie3[i]}%
                  </TableCell>
                  <TableCell className={`text-center ${getAttainmentColor(copoData.attainment.see[i])}`}>
                    {copoData.attainment.see[i]}%
                  </TableCell>
                  <TableCell className={`text-center font-medium ${getAttainmentColor(overallAttainment[i])}`}>
                    {overallAttainment[i]?.toFixed(1)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Course Outcomes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-5 space-y-2">
            {copoData.courseOutcomes.map((co, i) => (
              <li key={i}>{co}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoPOMapping;
