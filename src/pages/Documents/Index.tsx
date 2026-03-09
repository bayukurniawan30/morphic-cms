import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { LoadingState } from '@/components/ui/loader'
import { Head } from '@inertiajs/react'
import {
  FileTextIcon,
  UploadIcon,
  TrashIcon,
  CopyIcon,
  DownloadIcon,
  SearchIcon,
  FileIcon,
  ExternalLinkIcon,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { toast } from 'sonner'
import React, { useState, useEffect, useRef } from 'react'

interface DocumentFile {
  id: number
  filename: string
  secureUrl: string
  format: string | null
  mimeType: string | null
  size: number | null
  createdAt: string
}

interface Pagination {
  currentPage: number
  totalPages: number
  totalCount: number
  limit: number
}

export default function DocumentsIndex({ user }: { user: any }) {
  const [files, setFiles] = useState<DocumentFile[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fetchDocuments = async (page = 1, search = '') => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/documents?page=${page}&limit=10&search=${encodeURIComponent(search)}`
      )
      if (!res.ok) throw new Error('Failed to fetch documents')
      const data = await res.json()
      setFiles(data.files || [])
      setPagination(data.pagination)
    } catch (err) {
      toast.error('Failed to load documents.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchDocuments(currentPage, searchQuery)
    }, 300) // Debounce search

    return () => clearTimeout(timer)
  }, [currentPage, searchQuery])

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const formData = new FormData()
    formData.append('file', file)

    setLoading(true)
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      })

      if (!res.ok) throw new Error('Upload failed')

      const data = await res.json()
      setFiles([data.document, ...files])
      toast.success('Document uploaded successfully.')
    } catch (err) {
      toast.error('Failed to upload document.')
      console.error(err)
    } finally {
      setLoading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleDeleteDocument = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      const res = await fetch(`/api/documents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete document')

      setFiles(files.filter((f) => f.id !== id))
      toast.success('Document deleted.')
    } catch (err) {
      toast.error('Could not delete document.')
      console.error(err)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard
      .writeText(text)
      .then(() => {
        toast.success('URL copied to clipboard')
      })
      .catch((err) => {
        toast.error('Failed to copy URL')
      })
  }

  const formatBytes = (bytes: number | null, decimals = 2) => {
    if (!bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
  }

  // No longer using local filtering
  const filteredFiles = files

  return (
    <Layout user={user}>
      <Head title='Documents | Morphic' />

      <div className='flex flex-col space-y-6'>
        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0'>
          <div>
            <div className='flex items-center space-x-2 mb-1'>
              <FileTextIcon className='w-5 h-5 text-primary' />
              <h1 className='text-3xl font-bold tracking-tight'>Documents</h1>
            </div>
            <p className='text-muted-foreground text-sm'>
              Manage your documents.
            </p>
          </div>
          <div className='flex space-x-2'>
            <Button onClick={handleUploadClick}>
              <UploadIcon className='w-4 h-4 mr-2' />
              Upload Document
            </Button>
          </div>
        </div>

        <div className='bg-card border rounded-xl shadow-sm overflow-hidden'>
          <div className='p-4 border-b bg-muted/20 flex flex-col md:flex-row gap-4 items-center justify-between'>
            <div className='relative w-full md:w-72'>
              <SearchIcon className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground' />
              <Input
                placeholder='Search documents...'
                className='pl-9 bg-background'
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value)
                  setCurrentPage(1)
                }}
              />
            </div>
            <div className='text-xs text-muted-foreground'>
              Showing {filteredFiles.length} of {pagination?.totalCount || 0}{' '}
              documents
            </div>
          </div>

          <div className='overflow-x-auto'>
            <table className='w-full text-sm text-left'>
              <thead className='text-xs text-muted-foreground uppercase bg-muted/50 border-b'>
                <tr>
                  <th className='px-6 py-4 font-medium'>Filename</th>
                  <th className='px-6 py-4 font-medium'>Type</th>
                  <th className='px-6 py-4 font-medium'>Size</th>
                  <th className='px-6 py-4 font-medium'>Uploaded At</th>
                  <th className='px-6 py-4 font-medium text-right'>Actions</th>
                </tr>
              </thead>
              <tbody className='divide-y'>
                {loading ? (
                  <tr>
                    <td colSpan={6} className='h-64 text-center px-6 py-4'>
                      <LoadingState text='Fetching documents...' />
                    </td>
                  </tr>
                ) : filteredFiles.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className='h-64 text-center text-muted-foreground italic px-6 py-4'
                    >
                      No documents found.
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file) => (
                    <tr
                      key={file.id}
                      className='group hover:bg-muted/50 transition-colors border-b'
                    >
                      <td className='px-6 py-4 align-middle font-medium'>
                        <div className='flex flex-col'>
                          <span className='text-foreground'>
                            {file.filename}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 align-middle'>
                        <span className='text-xs uppercase px-2 py-0.5 bg-muted rounded border font-semibold'>
                          {file.format || 'unknown'}
                        </span>
                      </td>
                      <td className='px-6 py-4 align-middle text-muted-foreground text-xs'>
                        {formatBytes(file.size)}
                      </td>
                      <td className='px-6 py-4 align-middle text-muted-foreground text-xs'>
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 align-middle text-right'>
                        <div className='flex justify-end space-x-1'>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            title='Copy URL'
                            onClick={() => copyToClipboard(file.secureUrl)}
                          >
                            <CopyIcon className='w-4 h-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                            title='Open/Download'
                            asChild
                          >
                            <a
                              href={file.secureUrl}
                              target='_blank'
                              rel='noopener noreferrer'
                            >
                              <ExternalLinkIcon className='w-4 h-4' />
                            </a>
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10'
                            title='Delete'
                            onClick={() => handleDeleteDocument(file.id)}
                          >
                            <TrashIcon className='w-4 h-4' />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {pagination && pagination.totalPages > 1 && (
            <div className='px-6 py-4 bg-muted/30 border-t flex items-center justify-between'>
              <div className='text-xs text-muted-foreground'>
                Showing {(currentPage - 1) * 10 + 1} to{' '}
                {Math.min(currentPage * 10, pagination.totalCount)} of{' '}
                {pagination.totalCount} documents
              </div>
              <div className='flex items-center space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage <= 1 || loading}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  <ChevronLeft className='h-4 w-4 mr-1' />
                  Previous
                </Button>
                <div className='text-xs font-medium'>
                  Page {currentPage} of {pagination.totalPages}
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={currentPage >= pagination.totalPages || loading}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                  <ChevronRight className='h-4 w-4 ml-1' />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <input
        type='file'
        ref={fileInputRef}
        onChange={handleFileChange}
        className='hidden'
        accept='.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt'
      />
    </Layout>
  )
}
