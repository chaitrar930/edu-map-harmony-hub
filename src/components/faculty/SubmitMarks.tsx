// src/components/faculty/SubmitMarks.tsx
import React, { useState } from "react";
import axios from "axios";

const SubmitMarks = () => {
  const [formData, setFormData] = useState({
    studentUSN: "",
    subjectCode: "",
    marks: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://localhost:5000/submit-marks", formData);
      alert("Marks submitted successfully!");
      console.log(response.data);
    } catch (error) {
      alert("Error submitting marks.");
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded shadow">
      <div>
        <label>Student USN:</label>
        <input type="text" name="studentUSN" value={formData.studentUSN} onChange={handleChange} className="border p-1 w-full" />
      </div>
      <div>
        <label>Subject Code:</label>
        <input type="text" name="subjectCode" value={formData.subjectCode} onChange={handleChange} className="border p-1 w-full" />
      </div>
      <div>
        <label>Marks:</label>
        <input type="number" name="marks" value={formData.marks} onChange={handleChange} className="border p-1 w-full" />
      </div>
      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
    </form>
  );
};

export default SubmitMarks;
