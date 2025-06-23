// app/assinante/[id]/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { toast } from "sonner";
import { FaArrowLeft } from "react-icons/fa";

interface UserData {
  _id: string;
  email: string;
  seniorityLevel: string;
  stacks: string[];
  confirmed: boolean;
  createdAt: string;
}

export default function SubscriberPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [formData, setFormData] = useState({
    seniorityLevel: "",
    stacks: [""],
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/users/${params.id}`);
        
        if (!res.ok) {
          throw new Error("Failed to fetch user data");
        }
        
        const data = await res.json();
        setUserData(data);
        setFormData({
          seniorityLevel: data.seniorityLevel,
          stacks: data.stacks,
        });
      } catch (error) {
        console.error("Error fetching user data:", error);
        toast.error("Failed to load your information");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [params.id]);

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const res = await fetch(`/api/users/${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        throw new Error("Failed to update information");
      }

      toast.success("Information updated successfully!");
      // Update local state with new data
      setUserData({
        ...userData!,
        seniorityLevel: formData.seniorityLevel,
        stacks: formData.stacks,
      });
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update your information");
    } finally {
      setUpdating(false);
    }
  };

  const handleStackChange = (value: string) => {
    // Convert to array and remove duplicates
    const stacksArray = Array.from(
      new Set([...formData.stacks, value])
    );
    setFormData({ ...formData, stacks: stacksArray });
  };

  const removeStack = (stackToRemove: string) => {
    setFormData({
      ...formData,
      stacks: formData.stacks.filter(stack => stack !== stackToRemove)
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">User not found</h1>
          <Button onClick={() => router.push("/")}>
            Return to homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center p-4 sm:p-8">
      <Button 
        variant="outline" 
        className="self-start mb-6"
        onClick={() => router.push("/")}
      >
        <FaArrowLeft className="mr-2" /> Back to homepage
      </Button>
      
      <div className="w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold mb-2">Your Subscriber Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-300 mb-8">
          Manage your preferences and account information
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div>
            <h3 className="text-lg font-semibold mb-2">Account Information</h3>
            <div className="space-y-2">
              <p><span className="font-medium">Email:</span> {userData.email}</p>
              <p>
                <span className="font-medium">Status:</span>{" "}
                {userData.confirmed ? (
                  <span className="text-green-600">Confirmed</span>
                ) : (
                  <span className="text-yellow-600">Pending Confirmation</span>
                )}
              </p>
              <p>
                <span className="font-medium">Member since:</span>{" "}
                {new Date(userData.createdAt).toLocaleDateString("pt-BR")}
              </p>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Current Preferences</h3>
            <div className="space-y-2">
              <p>
                <span className="font-medium">Seniority Level:</span>{" "}
                {userData.seniorityLevel.charAt(0).toUpperCase() + userData.seniorityLevel.slice(1)}
              </p>
              <p>
                <span className="font-medium">Stacks:</span>{" "}
                {userData.stacks.length > 0 ? (
                  userData.stacks.map(stack => (
                    <span 
                      key={stack} 
                      className="inline-block bg-gray-100 dark:bg-gray-700 rounded-full px-3 py-1 text-sm font-semibold mr-2 mb-2"
                    >
                      {stack}
                    </span>
                  ))
                ) : (
                  <span className="text-gray-500">Not selected</span>
                )}
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-700 pt-8">
          <h2 className="text-xl font-bold mb-6">Update Preferences</h2>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Seniority Level
              </label>
              <Select
                value={formData.seniorityLevel}
                onValueChange={(value) => 
                  setFormData({ ...formData, seniorityLevel: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Júnior</SelectItem>
                  <SelectItem value="pleno">Pleno</SelectItem>
                  <SelectItem value="senior">Sênior</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Technology Stacks
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.stacks.map(stack => (
                  <div 
                    key={stack} 
                    className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full px-3 py-1 flex items-center"
                  >
                    <span>{stack}</span>
                    <button 
                      type="button"
                      onClick={() => removeStack(stack)}
                      className="ml-2 text-blue-500 hover:text-blue-700"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
              
              <Select onValueChange={handleStackChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Add a stack" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="backend">Backend</SelectItem>
                  <SelectItem value="fullstack">Fullstack</SelectItem>
                  <SelectItem value="devops">DevOps</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="data">Data Science</SelectItem>
                  <SelectItem value="ai">AI/ML</SelectItem>
                  <SelectItem value="cloud">Cloud</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="qa">QA/Testing</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-2">
                Select to add more stacks
              </p>
            </div>
            
            <Button
              onClick={handleUpdate}
              disabled={updating}
              className="w-full sm:w-auto"
            >
              {updating ? "Updating..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}