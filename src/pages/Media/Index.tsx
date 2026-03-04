import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FolderIcon, FileImageIcon, UploadIcon, PlusIcon, ChevronRightIcon, TrashIcon, MoreVerticalIcon, CopyIcon, DownloadIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from 'sonner';
import { LoadingState } from '@/components/ui/loader';

interface MediaFolder {
  id: number;
  name: string;
  parentId: number | null;
  createdAt: string;
}

interface MediaFile {
  id: number;
  filename: string;
  secureUrl: string;
  format: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
  createdAt: string;
}

interface BreadcrumbItem {
  id: number | null;
  name: string;
}

export default function MediaIndex({ user }: { user: any }) {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  
  // Keep track of navigation history for breadcrumbs
  const [pathHistory, setPathHistory] = useState<BreadcrumbItem[]>([{ id: null, name: 'Media Library' }]);

  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const fetchMedia = async (folderId: number | null) => {
    setLoading(true);
    try {
      const qs = folderId ? `?folderId=${folderId}` : '?folderId=null';
      const res = await fetch(`/api/media${qs}`);
      if (!res.ok) throw new Error('Failed to fetch media');
      const data = await res.json();
      setFolders(data.folders || []);
      setFiles(data.files || []);
    } catch (err) {
      toast.error('Failed to load media.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia(currentFolderId);
  }, [currentFolderId]);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    try {
      const res = await fetch('/api/media/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newFolderName, parentId: currentFolderId })
      });
      if (!res.ok) throw new Error('Failed to create folder');
      
      const data = await res.json();
      setFolders([data.folder, ...folders]);
      setIsNewFolderOpen(false);
      setNewFolderName('');
      toast.success('Folder created.');
    } catch (err) {
      toast.error('Could not create folder.');
    }
  };

  const handleDeleteFolder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this folder? All contents will be lost.')) return;
    try {
      const res = await fetch(`/api/media/folders/${id}`, { method: 'DELETE' });
      const responseBody = await res.json();
      
      if (!res.ok) {
        throw new Error(responseBody.error || 'Failed to delete folder');
      }

      setFolders(folders.filter(f => f.id !== id));
      toast.success('Folder deleted.');
    } catch (err: any) {
      toast.error(err.message || 'Could not delete folder.');
    }
  };

  const navigateToFolder = (folder: MediaFolder) => {
    setCurrentFolderId(folder.id);
    setPathHistory([...pathHistory, { id: folder.id, name: folder.name }]);
  };

  const navigateToBreadcrumb = (index: number) => {
    const item = pathHistory[index];
    setCurrentFolderId(item.id);
    setPathHistory(pathHistory.slice(0, index + 1));
  };

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (currentFolderId) {
      formData.append('folderId', currentFolderId.toString());
    }

    setLoading(true);
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Upload failed');
      
      const data = await res.json();
      setFiles([data.media, ...files]);
      toast.success('File uploaded successfully.');
    } catch (err) {
      toast.error('Failed to upload file.');
      console.error(err);
    } finally {
      setLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMedia = async (id: number) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    try {
      const res = await fetch(`/api/media/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete media');
      
      setFiles(files.filter(f => f.id !== id));
      toast.success('Media deleted.');
    } catch (err) {
      toast.error('Could not delete media.');
      console.error(err);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success('URL copied to clipboard');
    }).catch(err => {
      toast.error('Failed to copy URL');
      console.error('Could not copy text: ', err);
    });
  };

  const handleDownload = async (file: MediaFile) => {
    try {
      const response = await fetch(file.secureUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      toast.error('Failed to download file');
      console.error('Download error:', err);
    }
  };

  const formatBytes = (bytes: number | null, decimals = 2) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  return (
    <Layout user={user}>
      <Head title="Media Library | Morphic" />
      
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Media Library</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage your images and assets.</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => setIsNewFolderOpen(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              New Folder
            </Button>
            <Button onClick={handleUploadClick}>
              <UploadIcon className="w-4 h-4 mr-2" />
              Upload
            </Button>
          </div>
        </div>

        {/* Breadcrumbs */}
        <div className="flex items-center space-x-2 text-sm text-muted-foreground bg-card p-3 rounded-md border">
          {pathHistory.map((item, index) => (
            <React.Fragment key={index}>
              {index > 0 && <ChevronRightIcon className="w-4 h-4 mx-1" />}
              <span 
                className={`cursor-pointer hover:text-primary transition-colors ${index === pathHistory.length - 1 ? 'font-semibold text-foreground' : ''}`}
                onClick={() => navigateToBreadcrumb(index)}
              >
                {item.name}
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Grid Area */}
        {loading ? (
          <LoadingState text="Fetching your assets..." className="h-64" />
        ) : folders.length === 0 && files.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-muted-foreground bg-card border rounded-md">
            <FolderIcon className="w-12 h-12 mb-4 opacity-50" />
            <p>This folder is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            
            {/* Folders */}
            <TooltipProvider>
              {folders.map(folder => (
                <Tooltip key={folder.id}>
                  <TooltipTrigger asChild>
                    <div 
                      className="group relative flex flex-col items-center justify-center p-4 bg-card border rounded-lg hover:border-primary hover:bg-accent/50 cursor-pointer transition-all h-32"
                      onDoubleClick={() => navigateToFolder(folder)}
                    >
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVerticalIcon className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder.id); }}>
                              <TrashIcon className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      <FolderIcon className="w-12 h-12 text-primary/80 mb-2" />
                      <span className="text-sm font-medium text-center truncate w-full">{folder.name}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Double click to enter {folder.name}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </TooltipProvider>

            {/* Files */}
            {files.map(file => (
              <div 
                key={file.id} 
                className="group relative flex flex-col items-center justify-center p-2 bg-card border rounded-lg hover:border-primary cursor-pointer transition-all h-32 overflow-hidden"
                onClick={() => setSelectedFile(file)}
              >
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-background/80 rounded border">
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                        <MoreVerticalIcon className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={(e) => { e.stopPropagation(); copyToClipboard(file.secureUrl); }}
                      >
                        <CopyIcon className="h-4 w-4 mr-2" />
                        Copy URL
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive focus:text-destructive" 
                        onClick={(e) => { e.stopPropagation(); handleDeleteMedia(file.id); }}
                      >
                        <TrashIcon className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                
                {file.secureUrl ? (
                  <img src={file.secureUrl} alt={file.filename} className="w-full h-full object-cover rounded-md" />
                ) : (
                  <FileImageIcon className="w-12 h-12 text-muted-foreground mb-2" />
                )}
                
                <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-2 text-xs truncate translate-y-full group-hover:translate-y-0 transition-transform">
                  {file.filename}
                </div>
              </div>
            ))}

          </div>
        )}
      </div>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedFile} onOpenChange={(open) => !open && setSelectedFile(null)}>
        <DialogContent className="max-w-5xl h-[85vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2 border-b">
            <DialogTitle className="text-xl truncate pr-8">{selectedFile?.filename}</DialogTitle>
            <DialogDescription>
              {selectedFile && (
                <span className="flex items-center space-x-2 text-sm text-muted-foreground mt-1">
                  <span>{formatBytes(selectedFile.size)}</span>
                  {selectedFile.width && selectedFile.height && (
                    <>
                      <span>•</span>
                      <span>{selectedFile.width} × {selectedFile.height} px</span>
                    </>
                  )}
                  {selectedFile.format && (
                    <>
                      <span>•</span>
                      <span className="uppercase">{selectedFile.format}</span>
                    </>
                  )}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 min-h-0 p-4 flex items-center justify-center bg-accent/5">
            {selectedFile?.secureUrl && (
              <img 
                src={selectedFile.secureUrl} 
                alt={selectedFile.filename} 
                className="max-w-full max-h-full object-contain rounded-sm"
              />
            )}
          </div>

          <DialogFooter className="p-4 bg-muted/50 border-t flex sm:justify-between items-center">
            <div className="text-xs text-muted-foreground hidden sm:block">
              Uploaded on {selectedFile && new Date(selectedFile.createdAt).toLocaleDateString()}
            </div>
            <div className="flex space-x-2 w-full sm:w-auto">
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none"
                onClick={() => selectedFile && handleDownload(selectedFile)}
              >
                <DownloadIcon className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                className="flex-1 sm:flex-none"
                onClick={() => selectedFile && copyToClipboard(selectedFile.secureUrl)}
              >
                <CopyIcon className="w-4 h-4 mr-2" />
                Copy URL
              </Button>
              {/* <Button 
                variant="secondary" 
                className="flex-1 sm:flex-none"
                onClick={() => setSelectedFile(null)}
              >
                Close
              </Button> */}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isNewFolderOpen} onOpenChange={setIsNewFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
            <DialogDescription>
              Organize your media efficiently.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateFolder}>
            <div className="py-4">
              <Label htmlFor="folderName">Folder Name</Label>
              <Input 
                id="folderName" 
                value={newFolderName} 
                onChange={e => setNewFolderName(e.target.value)} 
                placeholder="e.g. Banners" 
                className="mt-2"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsNewFolderOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!newFolderName.trim()}>Create</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*"
      />
    </Layout>
  );
}
