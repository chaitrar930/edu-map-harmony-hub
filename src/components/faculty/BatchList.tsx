
import { useState, useEffect } from "react";
import { 
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink } from "lucide-react";

type Batch = {
  id: string;
  year: string;
  batchId: string;
  section: string;
  semester: string;
  createdAt: string;
};

type BatchListProps = {
  onSelectBatch: (batch: Batch) => void;
};

const BatchList = ({ onSelectBatch }: BatchListProps) => {
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    // Load batches from localStorage
    const storedBatches = JSON.parse(localStorage.getItem("batches") || "[]");
    setBatches(storedBatches);
  }, []);

  // Handle batch selection with direct mark entry view
  const handleSelectBatch = (batch: Batch) => {
    // Store the selected batch for the mark entry component
    localStorage.setItem("selectedSubject", "cs201"); // Default subject
    localStorage.setItem("selectedEvaluation", "CIE-1"); // Default evaluation
    
    // Call the parent handler to show mark entry directly
    onSelectBatch(batch);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manage Batches</CardTitle>
      </CardHeader>
      <CardContent>
        {batches.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-gray-500">No batches added yet</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch ID</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Section</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.batchId}</TableCell>
                  <TableCell>{batch.year}</TableCell>
                  <TableCell>{batch.semester}</TableCell>
                  <TableCell>{batch.section}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectBatch(batch)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Open
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default BatchList;
