"use client";

import { useEffect, useState } from "react";
import {
  Search,
  Upload,
  Plus,
  Filter,
  List,
  MoreHorizontal,
  Bell,
  ChevronDown,
  FileText,
  ImageIcon,
  Video,
  Headphones,
  Archive,
  Clock,
  Folder,
  Settings,
  MessageCircle,
  HelpCircle,
  BarChart3,
  Menu,
  LucideIcon,
  AudioLines
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import toast from "react-hot-toast";

const fileTypeColors = {
  Documents: "bg-blue-500",
  Image: "bg-purple-500",
  Video: "bg-purple-300",
  Audio: "bg-yellow-500",
  ZIP: "bg-red-500"
};

const sidebarItems = [
  { icon: BarChart3, label: "Dashboard", active: true },
  { icon: Clock, label: "Recent files" },
  { icon: FileText, label: "Documents" },
  { icon: ImageIcon, label: "Image" },
  { icon: Video, label: "Videos" },
  { icon: Headphones, label: "Audios" },
  { icon: Archive, label: "Deleted files" }
];

interface FileData {
  name: string;
  type: string;
  key: string;
  size: string;
  lastModified: string;
  icon: LucideIcon;
}
interface FileApiResponse {
  name: string;
  type: string;
  key: string;
  size: string;
  lastModified: string;
}

interface StorageData {
  type: string;
  files: number;
  size: string;
  icon: LucideIcon
}

interface StorageApiResponse {
  type: string;
  files: number;
  size: string;
}

const getIconForType = (type: string): LucideIcon => {
  const iconMap: Record<string, LucideIcon> = {
    Document: FileText,
    ZIP: Archive,
    Video: Video,
    Image: ImageIcon,
    Audio: AudioLines
  }

  return iconMap[type] || FileText
}

export default function FileManagerDashboard() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isStoragePanelOpen, setIsStoragePanelOpen] = useState(false);
  const [allFiles, setAllFiles] = useState<FileData[]>([]);
  const [storageData, setStorageData] = useState<StorageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [upLoading, setUploading] = useState(false);

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/files');
      const finalRespnse = await response.json()
      const data: FileApiResponse[] = finalRespnse.files;
      const fileDataWithIcon: FileData[] = data.map(item => ({
        ...item,
        icon: getIconForType(item.type)
      }))
      setAllFiles(fileDataWithIcon)
    } catch (error) {
      console.error('Error fetching files:', error);
      setLoading(false)
      // toast.error("failed to get the files")
    } finally {
      setLoading(false)
    }
  }

  const fetchStorageStats = async () => {
    try {
      const response = await fetch('/api/files/storage/stats');
      const data: StorageApiResponse[] = await response.json();
      const dataWithIcons: StorageData[] = data.map(item => ({
        ...item,
        icon: getIconForType(item.type)
      }))
      setStorageData(dataWithIcons);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
      toast.error("Failed to fetch the files")
    }
  }
  useEffect(() => {
    fetchFiles()
    fetchStorageStats()
  }, []);

  const handleUpload = async (file: File) => {
    try {
      setUploading(true)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', '');

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData
      });
      if (response.ok) {
        toast.success("File uploaded successfully")
        await fetchFiles();
        await fetchStorageStats();
      } else {
        toast.error("Failed to upload the file")
      }
    } catch (error) {
      setUploading(false)
      console.error('Error uploading file:', error);
      toast.error(`Error uploading file: ${error}`)
    } finally {
      setUploading(false)

    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/files/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      console.log("Delete response is: ", response)
      if (response.ok) {
        await fetchFiles();
        await fetchStorageStats();
        toast.success("File deleted successfully!")
      } else {
        toast.error("Failed to delete file")
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Error deleting file');
    }
  };

  const handleDownload = async (key: string) => {
    try {
      const response = await fetch(`/api/files/${encodeURIComponent(key)}`);
      const data = await response.json();

      // Open signed URL in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="border-border border-b p-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Folder className="size-4 text-white" />
          </div>
          <span className="text-lg font-semibold">File Manager</span>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 p-4">
        <div className="text-muted-foreground mb-4 text-xs font-medium">Menu</div>
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${item.active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
                }`}
              onClick={() => setIsMobileSidebarOpen(false)}>
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Other section */}
      <div className="border-border border-t p-4">
        <div className="text-muted-foreground mb-4 text-xs font-medium">Other</div>
        <nav className="space-y-1">
          <button className="text-muted-foreground hover:text-foreground hover:bg-accent flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors">
            <Settings className="h-4 w-4" />
            Settings
          </button>
          <button className="text-muted-foreground hover:text-foreground hover:bg-accent flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors">
            <MessageCircle className="h-4 w-4" />
            Chat & Support
          </button>
          <button className="text-muted-foreground hover:text-foreground hover:bg-accent flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors">
            <HelpCircle className="h-4 w-4" />
            Help Center
          </button>
        </nav>
      </div>
    </>
  );

  const StoragePanelContent = () => (
    <>
      {/* Storage usage */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Storage usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-col items-center">
            <div className="relative mb-4 h-32 w-32">
              <svg className="h-32 w-32 -rotate-90 transform" viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="text-muted"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="65, 100"
                  className="text-purple-600"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <Folder className="text-muted-foreground mb-1 h-6 w-6" />
                <div className="text-2xl font-bold">104.6 GB</div>
                <div className="text-muted-foreground text-xs">of 256 GB</div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {storageData.map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
                  <item.icon className="text-muted-foreground h-4 w-4" />
                </div>
                <div className="flex-1">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-medium">{item.type}</span>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {item.files} Files | {item.size}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Upgrade section */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="bg-muted mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full">
            <div className="border-muted-foreground flex h-6 w-6 items-center justify-center rounded-full border-2">
              <span className="text-xs font-bold">$</span>
            </div>
          </div>
          <h3 className="mb-2 font-semibold">Get more space for your files</h3>
          <p className="text-muted-foreground mb-4 text-sm">
            Upgrade your account to pro to get more storage
          </p>
          <Button className="w-full bg-gray-900 text-white hover:bg-gray-800">
            Upgrade to pro
          </Button>
        </CardContent>
      </Card>
    </>
  );

  return (
    <div className="bg-background flex h-screen">
      <div className="bg-card border-border hidden w-64 flex-col border-r lg:flex">
        <SidebarContent />
      </div>

      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="bg-card flex h-full flex-col">
            <SidebarContent />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="border-border flex h-16 items-center justify-between border-b px-4 lg:px-6">
          <div className="flex flex-1 items-center gap-4">
            <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
            </Sheet>

            <div className="relative max-w-md flex-1">
              <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                placeholder="Search files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 lg:gap-4">
            <Sheet open={isStoragePanelOpen} onOpenChange={setIsStoragePanelOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="xl:hidden">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 p-6">
                <StoragePanelContent />
              </SheetContent>
            </Sheet>

            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <Button className="bg-primary hover:bg-purple-700" size="sm" onClick={() => document.getElementById('file-upload')?.click()} disabled={upLoading}>
              <Upload className="h-4 w-4 lg:mr-2" />
              <span className="hidden sm:inline">{upLoading ? "Uploading..." : "Upload File"}</span>
            </Button>
            <Button variant="outline" size="sm" className="hidden bg-transparent sm:flex">
              <Plus className="mr-2 h-4 w-4" />
              Create
            </Button>
            <Button variant="ghost" size="icon">
              <Bell className="h-4 w-4" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/robert-fox-profile.png" />
                    <AvatarFallback>RF</AvatarFallback>
                  </Avatar>
                  <span className="hidden md:inline">Robert Fox</span>
                  <ChevronDown className="hidden h-4 w-4 md:inline" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Settings</DropdownMenuItem>
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {/* All files header */}
            <div className="mb-6 flex justify-between">
              <div>
                <h1 className="mb-1 text-xl font-semibold lg:text-2xl">All files</h1>
                <p className="text-muted-foreground text-sm lg:text-base">
                  All of your files are displayed here
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
                <Button variant="outline" size="sm">
                  <List className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">List</span>
                  <ChevronDown className="ml-1 hidden h-4 w-4 sm:inline" />
                </Button>
              </div>
            </div>




            {/* All files section */}
            <div>
              <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <div className="h-4 w-4 rounded-sm bg-blue-500"></div>
                  <span className="text-muted-foreground text-sm">Documents</span>
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <div className="h-4 w-4 rounded-sm bg-purple-500"></div>
                  <span className="text-muted-foreground text-sm">Image</span>
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <div className="h-4 w-4 rounded-sm bg-purple-300"></div>
                  <span className="text-muted-foreground text-sm">Video</span>
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <div className="h-4 w-4 rounded-sm bg-yellow-500"></div>
                  <span className="text-muted-foreground text-sm">Audio</span>
                </div>
                <div className="flex items-center gap-1 whitespace-nowrap">
                  <div className="h-4 w-4 rounded-sm bg-red-500"></div>
                  <span className="text-muted-foreground text-sm">ZIP</span>
                </div>
              </div>

              <div className="space-y-3 lg:hidden">
                {allFiles.map((file, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-muted flex h-10 w-10 items-center justify-center rounded-lg">
                        <file.icon className="text-muted-foreground h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 truncate text-sm font-medium">{file.name}</p>
                        <div className="text-muted-foreground flex items-center gap-2 text-xs">
                          <span>{file.size}</span>
                          <span>•</span>
                          <span>{file.lastModified}</span>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="border-border hidden overflow-hidden rounded-lg border lg:block">
                <div className="bg-muted/50 border-border text-muted-foreground grid grid-cols-10 gap-4 border-b p-4 text-sm font-medium">
                  <div className="col-span-5">Name</div>
                  <div className="col-span-2">File Size</div>
                  <div className="col-span-2">Date modified</div>
                </div>
                {allFiles.map((file, index) => (
                  <div
                    key={index}
                    className="border-border items-center hover:bg-muted/50 grid grid-cols-10 gap-4 border-b p-4 transition-colors last:border-b-0">
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
                        <file.icon className="text-muted-foreground h-4 w-4" />
                      </div>
                      <span className="truncate text-sm font-medium">{file.name}</span>
                    </div>
                    <div className="text-muted-foreground col-span-2 text-sm">{file.size}</div>
                    <div className="text-muted-foreground col-span-2 text-sm">{new Date(file.lastModified).toLocaleDateString()}</div>
                    <div className="col-span-1 flex justify-end">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="flex items-center gap-2">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleDownload(file.key)}>Download Link</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(file.key)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <Button variant="ghost" size="icon">
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-border bg-card hidden w-80 border-l p-6 xl:block">
            <StoragePanelContent />
          </div>
        </div>
      </div>
    </div>
  );
}