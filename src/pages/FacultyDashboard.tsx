
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Home, 
  LogOut,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import AddBatchForm from "@/components/faculty/AddBatchForm";
import BatchList from "@/components/faculty/BatchList";
import BatchDetails from "@/components/faculty/BatchDetails";
import MarkEntry from "@/components/faculty/MarkEntry";
import CoPOMapping from "@/components/faculty/CoPOMapping";
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
  const [activeTab, setActiveTab] = useState("batches");
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
    if (activeTab === "batches") {
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
                  onClick={() => {
                    setSelectedBatch(null);
                    setActiveTab("batches");
                  }}
                  isActive={activeTab === "batches" && !selectedBatch}
                >
                  <Home className="h-5 w-5" />
                  <span>Manage Batches</span>
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
                <li className="hover:underline cursor-pointer" onClick={() => {
                  setSelectedBatch(null);
                  setActiveTab("batches");
                }}>Home</li>
                {activeTab === "batches" && !selectedBatch && (
                  <>
                    <li>/</li>
                    <li>Batches</li>
                  </>
                )}
                {selectedBatch && (
                  <>
                    <li>/</li>
                    <li
                      className="hover:underline cursor-pointer"
                      onClick={() => {
                        setShowMarkEntry(false);
                        setShowCoPOMapping(false);
                      }}
                    >
                      {selectedBatch.batchId}
                    </li>
                  </>
                )}
                {selectedBatch && showMarkEntry && (
                  <>
                    <li>/</li>
                    <li>Mark Entry</li>
                  </>
                )}
                {selectedBatch && showCoPOMapping && (
                  <>
                    <li>/</li>
                    <li>CO-PO Mapping</li>
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
