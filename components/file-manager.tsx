"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  Upload,
  Filter,
  MoreHorizontal,
  FileText,
  ImageIcon,
  Video,
  Headphones,
  Archive,
  Clock,
  Folder,
  BarChart3,
  Menu,
  LucideIcon,
  AudioLines,
  LucideMessageCircleWarning
} from "lucide-react";
import {
  Select,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent
} from "@/components/ui/select"

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import toast from "react-hot-toast";
import { ModeToggle } from "./darkmode-icon";
import { useRouter } from "next/navigation";


const sidebarItems = [
  { icon: BarChart3, label: "Dashboard", active: true },
  { icon: Clock, label: "Recent files" },
  { icon: FileText, label: "Documents" },
  { icon: ImageIcon, label: "Image" },
  { icon: Video, label: "Videos" },
  { icon: Headphones, label: "Audios" },
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

type StorageMode = "r2" | "s3" | "";

const initialStorageMode = (): StorageMode => {
  if (typeof window !== 'undefined') {
    const storeValue = localStorage.getItem("storageMode");

    if (storeValue === 'r2' || storeValue === 's3' || storeValue === '') {
      return storeValue;
    }
  }
  return "r2";
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
  const router = useRouter();
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [storageMode, setStorageMode] = useState<StorageMode>(initialStorageMode);
  const [currentPrefix, setCurrentPrefix] = useState<string>("");
  const [isStoragePanelOpen, setIsStoragePanelOpen] = useState(false);
  const [allFiles, setAllFiles] = useState<FileData[]>([]);
  const [addFolders, setAddFolders] = useState<string[]>([]);
  const [storageData, setStorageData] = useState<StorageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [upLoading, setUploading] = useState(false);

  const label = storageMode === "r2" ? "R2" : storageMode === 's3' ? "S3" : "-";
  const ensureTrailingSlash = (s: string) => s && !s.endsWith("/") ? s + "/" : s;

  const breadcrumbSegments = useMemo(() => {
    if (!currentPrefix) return;
    const trimmed = currentPrefix.endsWith("/") ? currentPrefix.slice(0, -1) : currentPrefix;
    if (!trimmed) return [];
    const parts = trimmed.split("/");
    const segments: { label: string, prefix: string }[] = [];
    let acc = '';
    for (let i = 0; i < parts.length; ++i) {
      acc = ensureTrailingSlash(acc + parts[i]);
      segments.push({ label: parts[i], prefix: acc })
    }
    return segments;
  }, [currentPrefix])

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem("storageMode", storageMode)
    router.refresh()
  }, [storageMode, router]);

  const fetchFiles = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/files?mode=${storageMode}&prefix=${encodeURIComponent(currentPrefix)}`);
      const finalRespnse = await response.json();
      const data: FileApiResponse[] = finalRespnse.files || [];
      const fileDataWithIcon: FileData[] = data.map(item => ({
        ...item,
        icon: getIconForType(item.type)
      }))
      setAllFiles(fileDataWithIcon)
      setAddFolders((finalRespnse.folders as string[] | undefined) || [])
    } catch (error) {
      console.error('Error fetching files:', error);
      setLoading(false)
      toast.error("failed to get the files")
    } finally {
      setLoading(false)
    }
  }

  const fetchStorageStats = async () => {
    try {
      const response = await fetch(`/api/files/storage/stats?mode=${storageMode}&prefix=${encodeURIComponent(currentPrefix)}`);
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
  }, [storageMode, currentPrefix]);

  const handleUpload = async (file: File, relativeKey?: string) => {
    try {
      setUploading(true)
      const formData = new FormData();
      const path = ensureTrailingSlash(currentPrefix);
      const key = relativeKey ? ensureTrailingSlash(currentPrefix) + relativeKey : path + relativeKey
      formData.append('file', file);
      formData.append('path', key);

      const response = await fetch(`/api/files/upload?mode=${storageMode}`, {
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
  const handleFolderUpload = async (fileList: FileList) => {
    if (fileList?.length === 0) return;
    setUploading(true)
    try {
      for (const file of Array.from(fileList)) {
        const rel = (file as any).webkitRelativePath as string;
        let relativeKey = file.name;
        if (rel) {
          const idx = rel.indexOf('/');
          relativeKey = idx >= 0 ? rel.slice(0, +1) : rel;
        }
        await handleUpload(file, relativeKey);

      }
    } catch (error) {
      setUploading(false)
      console.error('Error uploading Folder files:', error);
      toast.error(`Error uploading Folder files: ${error}`)
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (key: string) => {
    if (!confirm('Are you sure you want to delete this file?')) return;

    try {
      const response = await fetch(`/api/files/${encodeURIComponent(key)}?mode=${storageMode}`, {
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
      const response = await fetch(`/api/files/${encodeURIComponent(key)}?mode=${storageMode}`);
      const data = await response.json();

      // Open signed URL in new tab
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Error downloading file');
    }
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const displayFolderName = (p: string) => {
    const trimmed = p.endsWith("/") ? p.slice(0, -1) : p;
    const parts = trimmed.split("/");
    return parts[parts.length - 1]
  }

  const onEnterFolder = (folderPrefix: string) => {
    setCurrentPrefix(folderPrefix)
  }

  const searchFunction = useMemo(() => {
    const query = debouncedQuery.toLowerCase().trim();

    if (!query) return allFiles;

    return allFiles.filter((file) => {
      const fileName = file.name.toLowerCase();
      const fileSize = file.size.toLowerCase();
      const fileType = file.type.toLowerCase();

      return (
        fileName.includes(query) || fileSize.includes(query) || fileType.includes(query)
      )
    })
  }, [allFiles, debouncedQuery]);

  const searchFolderFunction = useMemo(() => {
    const query = debouncedQuery.toLowerCase().trim();
    if (!query) return addFolders;
    return addFolders.filter((p) => {
      displayFolderName(p).toLowerCase().includes(query)
    })
  }, [addFolders, debouncedQuery])



  const SidebarContent = () => (
    <>
      {/* Logo */}
      <div className="border-border border-b p-6">
        <div className="flex items-center gap-2">
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg">
            <Folder className="size-4 text-white dark:text-black" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-lg font-semibold">File Manager</span>
            <span className="text-sm font-semibold text-left text-muted-foreground">Currently using <strong className="text-black dark:text-white">{label}</strong></span>
          </div>
        </div>
      </div>

      <div className="space-y-3 mt-3">
        <div className="flex items-center gap-2">
          <span className="text-sm pl-3 text-muted-foreground">Select the storage mode </span>
          <div title="please note that you have to set the environment variable manually for security" className="">
            <LucideMessageCircleWarning size={14} className="hover:text-black dark:hover:text-zinc-300" />
          </div>
        </div>
        <div>
          <Select value={storageMode} onValueChange={v => setStorageMode(v as StorageMode)}>
            <SelectTrigger>
              <SelectValue placeholder="Select the storage mode" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectItem value="r2">R2</SelectItem>
                <SelectItem value="s3">S3</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Menu */}
      <div className="flex-1 p-4">
        <div className="text-muted-foreground mb-4 text-xs font-medium">Menu</div>
        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.label}
              className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${item.active
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

            <input
              type="file"
              id="folder-upload"
              className="hidden"
              multiple
              webkitdirectory="true"
              onChange={(e) => {
                handleFolderUpload(e.target.files!);
                e.currentTarget.value = "";
              }}
            />
            <Button className="bg-primary hover:bg-purple-700" size="sm" onClick={() => document.getElementById('folder-upload')?.click()} disabled={upLoading}>
              <Upload className="h-4 w-4 lg:mr-2" />
              <span className="hidden sm:inline">{upLoading ? "Uploading..." : "Upload Folder"}</span>
            </Button>
            <ModeToggle />
          </div>

        </header>

        <div className="mb-3 text-sm flex items-center gap-2">
          <button className={`text-muted-foreground hover:underline ${!currentPrefix ? "font-semibold text-foreground" : ""}`} onClick={() => setCurrentPrefix("")} >
            Root
          </button>
          {breadcrumbSegments?.map((seg, idx) => (
            <span
              key={seg.prefix}
              className="flex items-center gap-2"
            >
              <span className="text-muted-foreground">
                /
              </span>
              <button
                className={`hover:underline ${idx === breadcrumbSegments?.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground"}`}
                onClick={() => setCurrentPrefix(seg.prefix)}
              >
                {seg.label}
              </button>
            </span>
          ))}
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Main Content Area */}
          <div className="flex-1 overflow-auto p-4 lg:p-6">
            {/* All files header */}
            <div className="mb-6 flex justify-between">
              <div>
                <h1 className="mb-1 text-xl font-semibold lg:text-2xl capitalize">All files <span>({label})</span></h1>
                <p className="text-muted-foreground text-sm lg:text-base">
                  All of your files of <span>{label}</span> bucket are displayed here
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Filter</span>
                </Button>
              </div>
            </div>




            {/* All files section */}
            <div>
              <div className="space-y-3 lg:hidden">
                {searchFolderFunction.length > 0 && searchFolderFunction.map((p) => (

                  <div key={p} onClick={() => onEnterFolder(p)} className="border-border items-center cursor-pointer hover:bg-muted/50 grid grid-cols-20 gap-4 border-b p-4 transition-colors" >
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
                        <Folder className="text-muted-foreground h-4 w-4" />
                      </div>
                      <span className="truncate text-sm font-medium">{displayFolderName(p)}</span>
                    </div>
                    <div className="text-muted-foreground col-span-5 text-sm">
                      —
                    </div>
                    <div className="text-muted-foreground col-span-5 text-sm">
                      Folder
                    </div>
                    <div className="text-muted-foreground col-span-3 text-sm">
                      —
                    </div>
                    <div className="col-span-2 flex justify-end"> {/* optional folder actions */} </div> </div>))}
                {searchFunction.length > 0 ? (
                  searchFunction.map((file) => (
                    <Card key={file.key} className="p-4">
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
                      </div>
                    </Card>
                  ))) : (
                  <div className="text-muted-foreground py-8 text-center text-sm">
                    No files found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>

              <div className="border-border hidden overflow-hidden rounded-lg border lg:block">
                <div className="bg-muted/50 border-border text-muted-foreground grid grid-cols-12 gap-4 border-b p-4 text-sm font-medium">
                  <div className="col-span-3">Name</div>
                  <div className="col-span-3">Type</div>
                  <div className="col-span-3">File Size</div>
                  <div className="col-span-3">Date modified</div>
                </div>

                {/* Render folders first */}
                {searchFolderFunction.length > 0 && searchFolderFunction.map((p) => (
                  <div
                    key={p}
                    onClick={() => onEnterFolder(p)}
                    className="border-border items-center cursor-pointer hover:bg-muted/50 grid grid-cols-20 gap-4 border-b p-4 transition-colors">
                    <div className="col-span-5 flex items-center gap-3">
                      <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
                        <Folder className="text-muted-foreground h-4 w-4" />
                      </div>
                      <span className="truncate text-sm font-medium">{displayFolderName(p)}</span>
                    </div>
                    <div className="text-muted-foreground col-span-5 text-sm">Folder</div>
                    <div className="text-muted-foreground col-span-5 text-sm">—</div>
                    <div className="text-muted-foreground col-span-3 text-sm">—</div>
                    <div className="col-span-2 flex justify-end">
                      {/* Optional: Add folder actions menu here */}
                    </div>
                  </div>
                ))}

                {searchFunction.length > 0 ? (
                  searchFunction.map((file) => (
                    <div
                      key={file.key}
                      className="border-border items-center cursor-pointer hover:bg-muted/50 grid grid-cols-20 gap-4 border-b p-4 transition-colors last:border-b-0">
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="bg-muted flex h-8 w-8 items-center justify-center rounded-lg">
                          <file.icon className="text-muted-foreground h-4 w-4" />
                        </div>
                        <span className="truncate text-sm font-medium">{file.name}</span>
                      </div>
                      <div className="text-muted-foreground col-span-5 text-sm">{file.size}</div>
                      <div className="text-muted-foreground col-span-5 text-sm">{file.type}</div>
                      <div className="text-muted-foreground col-span-3 text-sm">{new Date(file.lastModified).toLocaleDateString()}</div>
                      <div className="col-span-2 flex justify-end ">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="flex items-center gap-2 cursor-pointer">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleDownload(file.key)}>Download Link</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(file.key)}>Delete</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))) : (
                  <div className="text-muted-foreground py-8 text-center text-sm">
                    No files found matching &quot;{searchQuery}&quot;
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-border bg-card hidden w-80 border-l p-6 xl:block">
            <StoragePanelContent />
          </div>
        </div>
      </div>
    </div >
  );
}