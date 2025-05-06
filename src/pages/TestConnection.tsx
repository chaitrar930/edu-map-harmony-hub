// src/pages/TestConnection.tsx
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function TestConnection() {
  const endpoints = [
    { url: '/submissions', method: 'GET' },
    { url: '/submit-marks', method: 'POST' }
  ];

  const testEndpoint = async (url: string, method: string) => {
    try {
      const response = await fetch(`http://localhost:5000${url}`, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : undefined,
        body: method === 'POST' ? JSON.stringify({
          subjectCode: "test",
          subjectName: "Test Subject",
          evaluationType: "CIE-1",
          batch: {
            id: "test123",
            batchId: "TEST01",
            year: "2024",
            section: "A",
            semester: "1"
          },
          students: [{
            usn: "TEST001",
            marks: { q1a: 5, q1b: 3 }
          }]
        }) : undefined
      });
      
      const data = await response.json();
      toast.success(`${url} working!`);
      console.log(`${method} ${url} response:`, data);
    } catch (error) {
      toast.error(`${url} failed`);
      console.error(`${method} ${url} error:`, error);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h1 className="text-xl font-bold">Backend Connection Tests</h1>
      <div className="space-y-2">
        {endpoints.map((endpoint, i) => (
          <Button
            key={i}
            variant="outline"
            onClick={() => testEndpoint(endpoint.url, endpoint.method)}
          >
            Test {endpoint.method} {endpoint.url}
          </Button>
        ))}
      </div>
    </div>
  );
}