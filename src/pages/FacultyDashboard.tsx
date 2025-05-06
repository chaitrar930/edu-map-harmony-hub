import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, 
  PlusCircle, 
  Upload, 
  BarChart2, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import AddBatchForm from "@/components/faculty/AddBatchForm";
import BatchList from "@/components/faculty/BatchList";
import BatchDetails from "@/components/faculty/BatchDetails";
import MarkEntry from "@/components/faculty/MarkEntry";
import CoPOMapping from "@/components/faculty/CoPOMapping";
import SubmitMarks from "@/components/faculty/SubmitMarks"; // Added import
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const FacultyDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [showMarkEntry, setShowMarkEntry] = useState(false);
  const [showCoPOMapping, setShowCoPOMapping] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "faculty") {
      navigate("/signin");
    }
  }, [user, navigate]);

  const handleLogout = () => {
    signOut();
    navigate("/signin");
  };

  const handleBatchSelect = (batch) => {
    setSelectedBatch(batch);
    setActiveTab("batchDetails");
  };

  const handleMarkEntryClick = () => {
    setShowMarkEntry(true);
    setShowCoPOMapping(false);
  };

  const handleCoPOMappingClick = () => {
    setShowCoPOMapping(true);
    setShowMarkEntry(false);
  };

  const handleBack = () => {
    if (showMarkEntry || showCoPOMapping) {
      setShowMarkEntry(false);
      setShowCoPOMapping(false);
    } else if (selectedBatch) {
      setSelectedBatch(null);
      setActiveTab("batches");
    }
  };

  const renderContent = () => {
    if (activeTab === "home") {
      return (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Welcome, {user?.name || "Faculty"}</h2>
            <p className="text-gray-600">
              This is your dashboard for managing course outcomes and program outcomes attainment.
              Use the sidebar navigation to access different features.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Manage Batches</h3>
              <p className="text-gray-600 mb-4">Add and manage student batches for your courses</p>
              <button 
                onClick={() => setActiveTab("batches")}
                className="text-blue-600 flex items-center"
              >
                View Batches <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Upload Marks</h3>
              <p className="text-gray-600 mb-4">Enter student marks for CIE and SEE evaluations</p>
              <button 
                onClick={() => setActiveTab("batches")}
                className="text-blue-600 flex items-center"
              >
                Select Batch <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">CO-PO Mapping</h3>
              <p className="text-gray-600 mb-4">View and analyze CO-PO attainment data</p>
              <button 
                onClick={() => setActiveTab("copo")}
                className="text-blue-600 flex items-center"
              >
                View Mappings <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            
            {/* Add Submit Marks option */}
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-medium mb-2">Submit Marks</h3>
              <p className="text-gray-600 mb-4">Submit the final marks for your students</p>
              <button 
                onClick={() => setActiveTab("submitMarks")}
                className="text-blue-600 flex items-center"
              >
                Submit Marks <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      );
    } else if (activeTab === "batches") {
      if (selectedBatch) {
        if (showMarkEntry) {
          return <MarkEntry batch={selectedBatch} onBack={handleBack} />;
        } else if (showCoPOMapping) {
          return <CoPOMapping batch={selectedBatch} onBack={handleBack} />;
        } else {
          return (
            <BatchDetails 
              batch={selectedBatch} 
              onBack={handleBack} 
              onMarkEntryClick={handleMarkEntryClick}
              onCoPOMappingClick={handleCoPOMappingClick}
            />
          );
        }
      } else {
        return (
          <div className="space-y-6">
            <AddBatchForm />
            <BatchList onSelectBatch={handleBatchSelect} />
          </div>
        );
      }
    } else if (activeTab === "copo") {
      return <CoPOMapping />;
    } else if (activeTab === "submitMarks") {
      return <SubmitMarks />;
    }
    
    return null;
  };

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar>
          <SidebarHeader className="border-b">
            <div className="px-2 py-3">
              <h2 className="text-xl font-bold">EDU MAP</h2>
              <p className="text-sm text-gray-500">Faculty Dashboard</p>
            </div>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab("home")}
                  isActive={activeTab === "home"}
                >
                  <Home className="h-5 w-5" />
                  <span>Home</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab("batches")}
                  isActive={activeTab === "batches"}
                >
                  <PlusCircle className="h-5 w-5" />
                  <span>Manage Batches</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab("copo")}
                  isActive={activeTab === "copo"}
                >
                  <BarChart2 className="h-5 w-5" />
                  <span>CO-PO Mapping</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {/* Add Submit Marks menu item */}
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={() => setActiveTab("submitMarks")}
                  isActive={activeTab === "submitMarks"}
                >
                  <Upload className="h-5 w-5" />
                  <span>Submit Marks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter>
            <SidebarMenuButton onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex-1 p-6 bg-gray-50">
          <div className="mb-6">
            <SidebarTrigger className="md:hidden" />
            <h1 className="text-2xl font-bold mb-2">Faculty Dashboard</h1>
            <div className="text-sm breadcrumbs">
              <ul className="flex items-center space-x-2">
                <li className="hover:underline cursor-pointer" onClick={() => setActiveTab("home")}>Home</li>
                {activeTab !== "home" && (
                  <>
                    <li>/</li>
                    <li>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</li>
                  </>
                )}
                {selectedBatch && (
                  <>
                    <li>/</li>
                    <li>{selectedBatch.batchId}</li>
                  </>
                )}
              </ul>
            </div>
          </div>
          
          {renderContent()}
        </div>
      </div>
    </SidebarProvider>
  );
};

export default FacultyDashboard;
