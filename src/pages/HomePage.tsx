
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center z-0"
        style={{
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.6), rgba(0, 0, 0, 0.6)), url('https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?auto=format&fit=crop&w=2000&q=80')`,
        }}
      />

      {/* Header with Logos */}
      <header className="relative z-10 p-4 flex justify-between items-center">
        <img 
          src="/lovable-uploads/2385caa3-4f64-473c-b531-25074b6bdbde.png" 
          alt="College Logo" 
          className="h-16 object-contain"
        />
        <img 
          src="/lovable-uploads/2385caa3-4f64-473c-b531-25074b6bdbde.png" 
          alt="Department Logo" 
          className="h-16 object-contain"
        />
      </header>

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-4">
        <div className="max-w-4xl mx-auto">
          <h3 className="text-white text-xl mb-2">
            Dayananda Sagar College of Engineering
          </h3>
          <h4 className="text-white/90 text-lg mb-8">
            Department of Artificial Intelligence and Machine Learning
          </h4>
          
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-4">
            EDU MAP
          </h1>
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-8">
            CO-PO MAPPING TOOL
          </h2>
          
          <p className="text-white/90 text-lg mb-12 max-w-2xl mx-auto">
            Reach thousands of students with our powerful tool to create 
            and manage your outcome-based education.
          </p>

          <Button 
            size="lg"
            onClick={() => navigate("/signin")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg"
          >
            Get Started
          </Button>
        </div>
      </main>
    </div>
  );
};

export default HomePage;
