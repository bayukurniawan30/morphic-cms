import React, { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FolderIcon, 
  FileImageIcon, 
  UploadIcon, 
  ChevronRightIcon, 
  SearchIcon,
  CheckIcon,
  XIcon
} from 'lucide-react';
import { toast } from 'sonner';

interface MediaFolder {
  id: number;
  name: string;
  parentId: number | null;
}

interface MediaFile {
  id: number;
  filename: string;
  secureUrl: string;
  format: string | null;
  size: number | null;
  width: number | null;
  height: number | null;
}

interface MediaPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (url: string) => void;
}

export default function MediaPicker({ open, onOpenChange, onSelect }: MediaPickerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<number | null>(null);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [path, setPath] = useState<{ id: number | null, name: string }[]>([{ id: null, name: 'Library' }]);
  const [selectedFileUrl, setSelectedFileUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('library');
  const [isUploading, setIsUploading] = useState(false);

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchMedia(currentFolderId);
    } else {
      setSelectedFileUrl(null);
      setActiveTab('library');
    }
  }, [open, currentFolderId]);

  const navigateToFolder = (folder: MediaFolder) => {
    setCurrentFolderId(folder.id);
    setPath([...path, { id: folder.id, name: folder.name }]);
  };

  const navigateToPath = (index: number) => {
    const item = path[index];
    setCurrentFolderId(item.id);
    setPath(path.slice(0, index + 1));
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);
    if (currentFolderId) {
      formData.append('folderId', currentFolderId.toString());
    }

    setIsUploading(true);
    try {
      const res = await fetch('/api/media/upload', {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setFiles([data.media, ...files]);
      setSelectedFileUrl(data.media.secureUrl);
      toast.success('Uploaded successfully.');
      setActiveTab('library');
    } catch (err) {
      toast.error('Upload failed.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredFiles = files.filter(f => f.filename.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleConfirm = () => {
    if (selectedFileUrl) {
      onSelect(selectedFileUrl);
      setSelectedFileUrl(null);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>Insert Media</DialogTitle>
          <DialogDescription>Choose an image from your library or upload a new one.</DialogDescription>
        </DialogHeader>

        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab} 
          className="flex-1 flex flex-col min-h-0 h-full overflow-hidden"
        >
          <div className="px-6 border-b flex-shrink-0">
            <TabsList className="bg-transparent border-b-0 w-full justify-start space-x-6 h-12 p-0">
              <TabsTrigger value="library" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 !shadow-none">Library</TabsTrigger>
              <TabsTrigger value="upload" className="data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-full px-0 !shadow-none">Upload</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="library" className="flex-1 min-h-0 h-full p-0 m-0 overflow-hidden data-[state=active]:flex data-[state=active]:flex-col">
            <div className="py-4 px-6 border-b flex items-center justify-between gap-4 bg-muted/20 flex-shrink-0">
              <div className="flex items-center text-sm text-muted-foreground overflow-hidden">
                {path.map((item, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && <ChevronRightIcon className="w-4 h-4 mx-1 flex-shrink-0" />}
                    <span 
                      className={`cursor-pointer hover:text-primary transition-colors truncate ${idx === path.length - 1 ? 'font-semibold text-foreground' : ''}`}
                      onClick={() => navigateToPath(idx)}
                    >
                      {item.name}
                    </span>
                  </React.Fragment>
                ))}
              </div>
              <div className="relative w-48 flex-shrink-0">
                <SearchIcon className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            <ScrollArea className="flex-1 min-h-0 h-full p-6">
              {loading ? (
                <div className="flex items-center justify-center h-48 text-muted-foreground italic">Loading media...</div>
              ) : folders.length === 0 && filteredFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground italic">
                  <FolderIcon className="w-12 h-12 mb-2 opacity-20" />
                  <p>Empty folder</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 py-1">
                  {folders.map(folder => (
                    <div 
                      key={folder.id}
                      onDoubleClick={() => navigateToFolder(folder)}
                      className="group flex flex-col items-center justify-center p-3 border rounded-lg hover:border-primary hover:bg-accent/50 cursor-pointer transition-all aspect-square text-center"
                    >
                      <FolderIcon className="w-10 h-10 text-primary/80 mb-2" />
                      <span className="text-xs font-medium truncate w-full">{folder.name}</span>
                    </div>
                  ))}
                  {filteredFiles.map(file => (
                    <div 
                      key={file.id}
                      onClick={() => setSelectedFileUrl(prev => prev === file.secureUrl ? null : file.secureUrl)}
                      className={`group relative flex flex-col items-center justify-center border rounded-lg cursor-pointer transition-all aspect-square overflow-hidden ${selectedFileUrl === file.secureUrl ? 'ring-2 ring-primary border-primary' : 'hover:border-primary'}`}
                    >
                      {file.secureUrl ? (
                         <img src={file.secureUrl} alt={file.filename} className="w-full h-full object-cover" />
                      ) : (
                        <FileImageIcon className="w-8 h-8 text-muted-foreground" />
                      )}
                      {selectedFileUrl === file.secureUrl && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-lg">
                            <CheckIcon className="w-4 h-4" />
                          </div>
                        </div>
                      )}
                      <div className="absolute bottom-0 left-0 right-0 bg-background/90 p-1 text-[10px] truncate translate-y-full group-hover:translate-y-0 transition-transform">
                        {file.filename}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>

          <TabsContent value="upload" className="flex-1 min-h-0 h-full items-center justify-center p-12 m-0 bg-muted/10 data-[state=active]:flex data-[state=active]:flex-col relative">
            <div 
              className={`w-full max-w-sm border-2 border-dashed rounded-xl p-12 flex flex-col items-center justify-center gap-4 hover:border-primary/50 hover:bg-accent/50 transition-all cursor-pointer group ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}
              onClick={() => !isUploading && fileInputRef.current?.click()}
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                 {isUploading ? (
                   <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                 ) : (
                   <UploadIcon className="w-8 h-8 text-primary" />
                 )}
              </div>
              <div className="text-center">
                <p className="font-semibold">{isUploading ? 'Uploading...' : 'Click to upload or drag and drop'}</p>
                <p className="text-sm text-muted-foreground mt-1">Images up to 10MB</p>
              </div>
              <Button type="button" disabled={isUploading}>
                {isUploading ? 'Please wait...' : 'Select File'}
              </Button>
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleUpload}
            />
          </TabsContent>
        </Tabs>

        <DialogFooter className="p-4 border-t bg-muted/20">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="button" disabled={!selectedFileUrl} onClick={handleConfirm}>Insert Image</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
