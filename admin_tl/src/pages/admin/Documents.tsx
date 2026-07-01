import { useEffect, useMemo, useState } from "react"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Spinner from "@/components/ui/Spinner"
import { toast } from "@/components/ui/Toast"
import { 
  Folder, 
  File, 
  Download, 
  Trash2, 
  Plus, 
  Search, 
  AlertCircle, 
  X, 
  ExternalLink 
} from "lucide-react"
import { documentService, type DocumentRecord } from "@/services/documentService"
import { clientService } from "@/services/clientService"
import { employeeService } from "@/services/employeeService"
import { type Client } from "@/data/clients"
import { type Employee } from "@/data/employees"

export default function AdminDocuments() {
  const [documents, setDocuments] = useState<DocumentRecord[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Search & Filtering
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null)

  // Upload Form State
  const [uploadOpen, setUploadOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [clientId, setClientId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadMode, setUploadMode] = useState<'DOCUMENT' | 'CSV'>('DOCUMENT')

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [docs, clis, emps] = await Promise.all([
        documentService.getDocuments(1, 1000),
        clientService.getClients(),
        employeeService.getEmployees()
      ])
      setDocuments(docs)
      setClients(clis)
      setEmployees(emps)
    } catch (err: any) {
      setError(err.message || 'Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const filteredDocuments = useMemo(() => {
    let result = documents
    if (categoryFilter) {
      result = result.filter(d => d.documentType === categoryFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(d => 
        d.fileName.toLowerCase().includes(q) ||
        d.client?.companyName.toLowerCase().includes(q) ||
        d.uploadedBy?.toLowerCase().includes(q)
      )
    }
    return result
  }, [documents, categoryFilter, search])

  // Category counts
  const gstCount = useMemo(() => documents.filter(d => d.documentType === 'GST').length, [documents])
  const mcaCount = useMemo(() => documents.filter(d => d.documentType === 'MCA').length, [documents])
  const otherCount = useMemo(() => documents.filter(d => d.documentType === 'OTHER').length, [documents])

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      await documentService.deleteDocument(id)
      toast({ type: 'success', message: 'Document deleted successfully' })
      loadData()
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Failed to delete document' })
    }
  }

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedFile) {
      toast({ type: 'error', message: 'Please select a file' })
      return
    }

    if (uploadMode === 'CSV' && !selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast({ type: 'error', message: 'Please select a CSV file for bulk upload' })
      return
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({ type: 'error', message: 'File size exceeds maximum 10MB limit' })
      return
    }

    setUploading(true)
    try {
      // 1. Upload to Cloudinary
      const uploadRes = await documentService.uploadFile(selectedFile)
      
      // 2. Create document record in database
      await documentService.createDocumentRecord({
        fileName: uploadRes.fileName,
        fileUrl: uploadRes.secure_url,
        clientId: clientId ? Number(clientId) : undefined,
        employeeId: employeeId ? Number(employeeId) : undefined
      })

      toast({ type: 'success', message: uploadMode === 'CSV' ? 'CSV uploaded successfully' : 'Document uploaded successfully' })
      setUploadOpen(false)
      setSelectedFile(null)
      setClientId('')
      setEmployeeId('')
      loadData()
    } catch (err: any) {
      toast({ type: 'error', message: err.message || 'Failed to upload document' })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="px-3 md:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-ink">Document Repository</h1>
          <p className="mt-1 text-sm text-ink-soft">Repository management and file details.</p>
        </div>
        <Button 
          variant="primary" 
          icon={<Plus className="h-4 w-4" />} 
          onClick={() => setUploadOpen(true)}
        >
          Upload Document
        </Button>
      </div>

      {error && (
        <div className="mb-6 flex items-center justify-between gap-4 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm font-semibold">{error}</span>
          </div>
          <Button variant="outline" onClick={loadData}>Retry</Button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={32} />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4 items-start">
          
          {/* Left panel: Categories */}
          <div className="space-y-4 lg:col-span-1">
            <Card>
              <div className="p-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-muted mb-3">Categories</h3>
                <div className="space-y-1">
                  <button
                    onClick={() => setCategoryFilter(null)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg font-medium transition-colors ${!categoryFilter ? 'bg-amber-50 text-gold-dark' : 'text-ink hover:bg-surface-muted'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>All Documents</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface border border-line">{documents.length}</span>
                  </button>

                  <button
                    onClick={() => setCategoryFilter('GST')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg font-medium transition-colors ${categoryFilter === 'GST' ? 'bg-amber-50 text-gold-dark' : 'text-ink hover:bg-surface-muted'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>GST Filings</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface border border-line">{gstCount}</span>
                  </button>

                  <button
                    onClick={() => setCategoryFilter('MCA')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg font-medium transition-colors ${categoryFilter === 'MCA' ? 'bg-amber-50 text-gold-dark' : 'text-ink hover:bg-surface-muted'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>MCA Filings</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface border border-line">{mcaCount}</span>
                  </button>

                  <button
                    onClick={() => setCategoryFilter('OTHER')}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg font-medium transition-colors ${categoryFilter === 'OTHER' ? 'bg-amber-50 text-gold-dark' : 'text-ink hover:bg-surface-muted'}`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4" />
                      <span>Other Proofs</span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded bg-surface border border-line">{otherCount}</span>
                  </button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right panel: Files list */}
          <div className="lg:col-span-3">
            <Card>
              <div className="p-4 border-b border-line">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-ink-muted" />
                  <input
                    type="text"
                    placeholder="Search documents by name, client, or uploader..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    maxLength={100}
                    className="h-10 w-full pl-10 pr-4 rounded-lg border border-line bg-surface text-sm text-ink focus:outline-none focus:border-amber"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {filteredDocuments.length === 0 ? (
                  <div className="text-center text-ink-soft py-16 bg-white">
                    <File className="h-12 w-12 text-ink-soft/40 mx-auto mb-3" />
                    <p className="text-base font-semibold">No documents found</p>
                    <p className="text-xs mt-1">Upload a document to get started.</p>
                  </div>
                ) : (
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-line bg-surface-muted text-xs font-semibold uppercase tracking-wider text-ink-muted">
                        <th className="px-4 py-3">Document Name</th>
                        <th className="px-4 py-3">Client</th>
                        <th className="px-4 py-3">Category</th>
                        <th className="px-4 py-3">Uploaded Date</th>
                        <th className="px-4 py-3">Uploaded By</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="border-b border-line-soft hover:bg-surface-muted transition-colors">
                          <td className="px-4 py-3.5 font-medium text-ink max-w-[200px] truncate">
                            <a 
                              href={doc.fileUrl || doc.filePath} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 hover:text-gold-dark"
                            >
                              <File className="h-4 w-4 flex-shrink-0 text-amber-500" />
                              <span className="truncate">{doc.fileName}</span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0 text-ink-soft/50" />
                            </a>
                          </td>
                          <td className="px-4 py-3.5 text-ink-soft max-w-[150px] truncate">
                            {doc.client?.companyName || 'General'}
                          </td>
                          <td className="px-4 py-3.5">
                            <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${doc.documentType === 'GST' ? 'bg-green-50 text-success' : doc.documentType === 'MCA' ? 'bg-amber-50 text-gold-dark' : 'bg-line-soft text-ink-soft'}`}>
                              {doc.documentType}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-xs text-ink-soft">
                            {new Date(doc.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3.5 text-ink-soft max-w-[120px] truncate">
                            {doc.uploadedBy || 'System'}
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <a 
                                href={doc.fileUrl || doc.filePath} 
                                download 
                                className="p-1.5 rounded-md hover:bg-line-soft text-ink-soft hover:text-ink transition-colors"
                                title="Download File"
                              >
                                <Download className="h-4 w-4" />
                              </a>
                              <button
                                onClick={() => handleDelete(doc.id)}
                                className="p-1.5 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors"
                                title="Delete File"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Upload Modal (inline fallback overlay to prevent UI libraries import) */}
      {uploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-lg font-bold text-ink">Upload Document</h2>
              <button 
                onClick={() => { if (!uploading) setUploadOpen(false) }}
                className="rounded-lg p-1 text-ink-soft hover:bg-surface-muted hover:text-ink"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Upload Type
                </label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setUploadMode('DOCUMENT')} className={`rounded-lg border px-3 py-2 text-sm ${uploadMode === 'DOCUMENT' ? 'border-amber bg-amber-50 text-gold-dark' : 'border-line bg-white text-ink'}`}>Document</button>
                  <button type="button" onClick={() => setUploadMode('CSV')} className={`rounded-lg border px-3 py-2 text-sm ${uploadMode === 'CSV' ? 'border-amber bg-amber-50 text-gold-dark' : 'border-line bg-white text-ink'}`}>CSV</button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Select File (Max 10MB)
                </label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  required
                  disabled={uploading}
                  className="w-full rounded-lg border border-line bg-surface p-2.5 text-sm text-ink focus:outline-none focus:border-amber"
                  accept={uploadMode === 'CSV' ? '.csv' : '.pdf,.doc,.docx,.jpg,.jpeg,.png'}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Associate Client (Optional)
                </label>
                <select
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  disabled={uploading}
                  className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:outline-none focus:border-amber"
                >
                  <option value="">-- General / No Client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.company}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-ink-muted mb-1">
                  Associate Staff (Optional)
                </label>
                <select
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  disabled={uploading}
                  className="w-full rounded-lg border border-line bg-white p-2.5 text-sm text-ink focus:outline-none focus:border-amber"
                >
                  <option value="">-- No Staff Assignment --</option>
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-line">
                <Button 
                  variant="outline" 
                  onClick={() => setUploadOpen(false)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  loading={uploading}
                  loadingText="Uploading..."
                >
                  Upload
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
