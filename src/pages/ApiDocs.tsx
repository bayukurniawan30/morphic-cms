import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Head } from '@inertiajs/react'
import {
  Check,
  Code2,
  Copy,
  FileCheck,
  Globe,
  Image as ImageIcon,
  LayoutGrid,
  ShieldCheck,
  Zap,
} from 'lucide-react'
import { toast } from 'sonner'
import React from 'react'

interface ApiDocsProps {
  user: any
}

const CodeBlock = ({
  code,
  id,
  copiedId,
  onCopy,
}: {
  code: string
  id: string
  copiedId: string | null
  onCopy: (text: string, id: string) => void
}) => (
  <div className='relative group mt-4'>
    <div className='absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity'>
      <Button
        variant='secondary'
        size='icon'
        className='h-8 w-8 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300'
        onClick={() => onCopy(code, id)}
      >
        {copiedId === id ? (
          <Check className='h-4 w-4' />
        ) : (
          <Copy className='h-4 w-4' />
        )}
      </Button>
    </div>
    <pre className='bg-zinc-950 text-zinc-300 p-6 rounded-xl overflow-x-auto font-mono text-sm border border-zinc-800 shadow-2xl'>
      <code>{code}</code>
    </pre>
  </div>
)

export default function ApiDocs({ user }: ApiDocsProps) {
  const [copied, setCopied] = React.useState<string | null>(null)
  const [baseUrl, setBaseUrl] = React.useState(
    typeof window !== 'undefined'
      ? window.location.origin
      : 'https://your-domain.tld'
  )

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin)
    }
  }, [])

  const copyToClipboard = (text: string, id: string) => {
    if (!navigator.clipboard) {
      toast.error('Clipboard API not available')
      return
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(id)
        toast.success('Copied to clipboard')
        setTimeout(() => setCopied(null), 2000)
      })
      .catch((err) => {
        console.error('Failed to copy!', err)
        toast.error('Failed to copy')
      })
  }

  return (
    <Layout user={user}>
      <Head title='API Documentation | Morphic CMS' />

      <div className='w-full space-y-12 pb-24'>
        {/* Header */}
        <div className='space-y-4'>
          <div className='inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'>
            <Zap className='w-3 h-3' />
            <span>Developer Reference</span>
          </div>
          <h1 className='text-4xl font-extrabold tracking-tight lg:text-5xl'>
            Morphic REST API
          </h1>
          <p className='text-xl text-muted-foreground max-w-3xl'>
            Everything you need to integrate Morphic CMS with your frontend
            applications, static site generators, or external tools.
          </p>
        </div>

        {/* Authentication Section */}
        <section id='authentication' className='space-y-6 scroll-mt-20'>
          <div className='flex items-center space-x-3'>
            <div className='bg-blue-500/10 p-2 rounded-lg'>
              <ShieldCheck className='w-6 h-6 text-blue-500' />
            </div>
            <h2 className='text-2xl font-bold'>Authentication</h2>
          </div>
          <div className='prose prose-zinc dark:prose-invert max-w-none'>
            <p className='text-muted-foreground leading-relaxed'>
              Most API requests require an API Key for authentication. You can
              manage your API keys and their permissions in the
              <a
                href='/api-key-abilities'
                className='text-primary font-medium hover:underline mx-1'
              >
                API Key Abilities
              </a>
              section.
            </p>
          </div>

          <Tabs defaultValue='header' className='w-full'>
            <TabsList className='bg-muted/50 p-1'>
              <TabsTrigger value='header'>
                Bearer Token (Recommended)
              </TabsTrigger>
              <TabsTrigger value='query'>Query Parameter</TabsTrigger>
            </TabsList>
            <TabsContent value='header' className='mt-4'>
              <CodeBlock
                id='auth-header'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X GET "${baseUrl}/api/collections" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </TabsContent>
            <TabsContent value='query' className='mt-4'>
              <CodeBlock
                id='auth-query'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X GET "${baseUrl}/api/collections?api_key=YOUR_API_KEY"`}
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Collections Section */}
        <section id='collections' className='space-y-6 scroll-mt-20'>
          <div className='flex items-center space-x-3'>
            <div className='bg-purple-500/10 p-2 rounded-lg'>
              <LayoutGrid className='w-6 h-6 text-purple-500' />
            </div>
            <h2 className='text-2xl font-bold'>Collections API</h2>
          </div>

          <div className='space-y-10'>
            {/* List Collections */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  GET
                </span>
                List Collections
              </h3>
              <p className='text-muted-foreground text-sm'>
                Retrieve a list of all your defined collections and their
                structures.
              </p>
              <CodeBlock
                id='get-collections'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X GET "${baseUrl}/api/collections" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </div>

            {/* List Entries */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  GET
                </span>
                Get Entries
              </h3>
              <p className='text-muted-foreground text-sm'>
                Fetch paginated entries for a specific collection using its ID
                or slug.
              </p>
              <CodeBlock
                id='get-entries'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`# Using slug
curl -X GET "${baseUrl}/api/collections/blog-posts/entries?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
              <CodeBlock
                id='get-entries-filtered'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`# Exact-match a single Select, Radio, or Boolean field
curl -G "${baseUrl}/api/collections/blog-posts/entries" \\
  --data-urlencode "filter[is_in_review]=Yes" \\
  --data-urlencode "filter[featured]=true" \\
  --data-urlencode "page=1" \\
  --data-urlencode "limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />

              <div className='bg-muted/50 border rounded-lg p-4 space-y-3'>
                <h4 className='text-xs font-bold uppercase tracking-wider text-muted-foreground'>
                  Query Parameters
                </h4>
                <div className='grid gap-3 text-sm'>
                  <div className='flex items-start gap-3'>
                    <code className='bg-muted px-1.5 py-0.5 rounded text-primary font-bold shrink-0'>
                      page
                    </code>
                    <span className='text-muted-foreground'>
                      The page number to retrieve. Default is{' '}
                      <code className='text-foreground'>1</code>.
                    </span>
                  </div>
                  <div className='flex items-start gap-3'>
                    <code className='bg-muted px-1.5 py-0.5 rounded text-primary font-bold shrink-0'>
                      limit
                    </code>
                    <span className='text-muted-foreground'>
                      Number of items per page. Default is{' '}
                      <code className='text-foreground'>10</code>.
                    </span>
                  </div>
                  <div className='flex items-start gap-3'>
                    <code className='bg-muted px-1.5 py-0.5 rounded text-primary font-bold shrink-0'>
                      locale
                    </code>
                    <span className='text-muted-foreground'>
                      Filter by language code (e.g.{' '}
                      <code className='text-foreground'>en</code>,{' '}
                      <code className='text-foreground'>id</code>). Set to{' '}
                      <code className='text-foreground'>_all</code> to retrieve
                      all localized versions.
                    </span>
                  </div>
                  <div className='flex items-start gap-3'>
                    <code className='bg-muted px-1.5 py-0.5 rounded text-primary font-bold shrink-0'>
                      trash
                    </code>
                    <span className='text-muted-foreground'>
                      Set to <code className='text-foreground'>true</code> to
                      retrieve deleted items (only if trash is enabled for the
                      collection).
                    </span>
                  </div>
                  <div className='flex items-start gap-3'>
                    <code className='bg-muted px-1.5 py-0.5 rounded text-primary font-bold shrink-0'>
                      filter[fieldName]
                    </code>
                    <span className='text-muted-foreground'>
                      Exact-match a top-level Text, Textarea, Date, Relation, Select, Radio, or Boolean field.
                    Text equality is case-sensitive. Use <code>filter[title][eq]=Hello</code>
                    {' '}or case-insensitive contains with <code>filter[title][icontains]=hello</code>.
                    Contains treats %, _ and backslashes literally.{' '}
                    Date fields use valid YYYY-MM-DD dates: <code>filter[publish_date]=2026-10-25</code>.
                    For an inclusive range, combine <code>filter[publish_date][gte]=2026-10-01</code>
                    {' '}and <code>filter[publish_date][lte]=2026-10-31</code>.
                    Either boundary can be omitted. Reversed ranges are rejected.
                    Missing or empty dates do not match. No time or timezone conversion is applied.{' '}
                    Relation fields match a connected entry ID: <code>filter[category]=42</code>
                    {' '}or <code>filter[category][eq]=42</code>. Use the relation field name, not the connected collection slug.
                    IDs must be positive integers. Matching uses the stored reference, even if the connected entry is unpublished or deleted.
                    Filtering by connected entry titles/slugs or multiple IDs is not supported.
                      Select and Radio values must match a configured option;
                      Boolean values must be{' '}
                      <code className='text-foreground'>true</code> or{' '}
                      <code className='text-foreground'>false</code>. You can
                      combine filters, and pagination is calculated from the
                      matching entries.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Get Single Entry */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  GET
                </span>
                Get Single Entry
              </h3>
              <p className='text-muted-foreground text-sm'>
                Fetch a specific entry by its unique numeric ID.
              </p>
              <CodeBlock
                id='get-single-entry'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X GET "${baseUrl}/api/entries/123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </div>

            {/* Create Entry */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  POST
                </span>
                Create Entry
              </h3>
              <p className='text-muted-foreground text-sm'>
                Add a new entry to a collection using its ID or slug. Fields
                must match the collection schema.
              </p>
              <CodeBlock
                id='post-entry'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X POST "${baseUrl}/api/collections/blog-posts/entries" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My New Post",
    "content": "Hello World",
    "status": "published"
  }'`}
              />
            </div>

            {/* Update Entry */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-amber-500/10 text-amber-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  PUT
                </span>
                Update Entry
              </h3>
              <p className='text-muted-foreground text-sm'>
                Update an existing entry by its ID. You only need to send the
                fields you want to change.
              </p>
              <CodeBlock
                id='put-entry'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X PUT "${baseUrl}/api/entries/123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Updated Title"
  }'`}
              />
            </div>

            {/* Delete Entry */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-red-500/10 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  DELETE
                </span>
                Delete Entry
              </h3>
              <p className='text-muted-foreground text-sm'>
                Permanently remove an entry from the database by its ID.
              </p>
              <CodeBlock
                id='delete-entry'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X DELETE "${baseUrl}/api/entries/123" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </div>
          </div>
        </section>

        {/* Globals Section */}
        <section id='globals' className='space-y-6 scroll-mt-20'>
          <div className='flex items-center space-x-3'>
            <div className='bg-orange-500/10 p-2 rounded-lg'>
              <Globe className='w-6 h-6 text-orange-500' />
            </div>
            <h2 className='text-2xl font-bold'>Globals API</h2>
          </div>
          <p className='text-muted-foreground'>
            Globals are single-entry collections (e.g., site settings). Use the
            same entries endpoint to manage them.
          </p>
          <CodeBlock
            id='get-global'
            copiedId={copied}
            onCopy={copyToClipboard}
            code={`# Get global site settings
curl -X GET "${baseUrl}/api/collections/site-settings/entries" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </section>

        {/* Forms Section */}
        <section id='forms' className='space-y-6 scroll-mt-20'>
          <div className='flex items-center space-x-3'>
            <div className='bg-emerald-500/10 p-2 rounded-lg'>
              <FileCheck className='w-6 h-6 text-emerald-500' />
            </div>
            <h2 className='text-2xl font-bold'>Form Submissions</h2>
          </div>
          <p className='text-muted-foreground'>
            Submit data from your frontend forms directly into Morphic. This
            endpoint is public if configured with Allowed Origins.
          </p>
          <div className='bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-start space-x-3'>
            <Zap className='w-5 h-5 text-amber-500 mt-0.5' />
            <div className='text-sm'>
              <p className='font-bold text-amber-700 dark:text-amber-400'>
                Public Access
              </p>
              <p className='text-amber-600 dark:text-amber-500/80'>
                No API Key is required for this endpoint. Make sure to set
                "Allowed Origins" in the Form Builder settings for security.
              </p>
            </div>
          </div>
          <CodeBlock
            id='post-form'
            copiedId={copied}
            onCopy={copyToClipboard}
            code={`curl -X POST "${baseUrl}/api/forms/your-tenant-slug/contact-us/submit" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hi, I love your CMS!"
  }'`}
          />
        </section>

        {/* Assets Section */}
        <section id='assets' className='space-y-6 scroll-mt-20'>
          <div className='flex items-center space-x-3'>
            <div className='bg-pink-500/10 p-2 rounded-lg'>
              <ImageIcon className='w-6 h-6 text-pink-500' />
            </div>
            <h2 className='text-2xl font-bold'>Media & Documents API</h2>
          </div>

          <div className='space-y-10'>
            {/* Media Library */}
            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  GET
                </span>
                List Media Assets
              </h3>
              <p className='text-muted-foreground text-sm'>
                Retrieve list of folders and media files for a tenant. Pass{' '}
                <code>folderId=null</code> or omit it to fetch the root folder.
              </p>
              <CodeBlock
                id='get-media'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X GET "${baseUrl}/api/media?folderId=123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Tenant-ID: YOUR_TENANT_ID"`}
              />
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  POST
                </span>
                Upload Media File
              </h3>
              <p className='text-muted-foreground text-sm'>
                Upload a new image or video asset. Requires an API key with a
                super_admin or tenant owner role.
              </p>
              <CodeBlock
                id='upload-media'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X POST "${baseUrl}/api/media/upload" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Tenant-ID: YOUR_TENANT_ID" \\
  -F "file=@/path/to/image.jpg" \\
  -F "folderId=123"`}
              />
            </div>

            <div className='space-y-4 border-t border-border/30 pt-6'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  POST
                </span>
                Create Media Folder
              </h3>
              <p className='text-muted-foreground text-sm'>
                Create a new media folder. Requires an API key with a
                super_admin or tenant owner role.
              </p>
              <CodeBlock
                id='create-folder'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X POST "${baseUrl}/api/media/folders" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Tenant-ID: YOUR_TENANT_ID" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "New Folder",
    "parentId": 123
  }'`}
              />
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-red-500/10 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  DELETE
                </span>
                Delete Media Folder
              </h3>
              <p className='text-muted-foreground text-sm'>
                Permanently delete a folder by its ID. The folder must be empty;
                if it contains subfolders or files, the API returns a{' '}
                <code>400 Bad Request</code> with{' '}
                <code>
                  {
                    '{ "error": "Cannot delete folder because it is not empty" }'
                  }
                </code>
                . Requires an API key with a super_admin or tenant owner role.
              </p>
              <CodeBlock
                id='delete-folder'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X DELETE "${baseUrl}/api/media/folders/123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Tenant-ID: YOUR_TENANT_ID"`}
              />
            </div>

            {/* Document Library */}
            <div className='space-y-4 border-t border-border/30 pt-6'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  GET
                </span>
                List Documents
              </h3>
              <p className='text-muted-foreground text-sm'>
                Fetch a paginated list of uploaded documents, with optional
                search and sorting capabilities.
              </p>
              <CodeBlock
                id='get-docs'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X GET "${baseUrl}/api/documents?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Tenant-ID: YOUR_TENANT_ID"`}
              />
            </div>

            <div className='space-y-4'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  POST
                </span>
                Upload Document File
              </h3>
              <p className='text-muted-foreground text-sm'>
                Upload a document file (PDF, Word, Excel, PPT, TXT). Requires an
                API key with a super_admin or tenant owner role.
              </p>
              <CodeBlock
                id='upload-document'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X POST "${baseUrl}/api/documents/upload" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Tenant-ID: YOUR_TENANT_ID" \\
  -F "file=@/path/to/document.pdf"`}
              />
            </div>

            <div className='space-y-4 border-t border-border/30 pt-6'>
              <h3 className='text-lg font-semibold flex items-center gap-2'>
                <span className='bg-red-500/10 text-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase'>
                  DELETE
                </span>
                Delete Document
              </h3>
              <p className='text-muted-foreground text-sm'>
                Permanently delete a document by its ID. Requires an API key
                with a super_admin or tenant owner role.
              </p>
              <CodeBlock
                id='delete-document'
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X DELETE "${baseUrl}/api/documents/123" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Tenant-ID: YOUR_TENANT_ID"`}
              />
            </div>
          </div>
        </section>

        <section id='graphql' className='space-y-6'>
          <h2 className='text-2xl font-bold'>GraphQL Entry Filters</h2>
          <div className='space-y-3'>
            <h3 className='font-bold'>API Preview filter controls</h3>
            <p className='text-sm text-muted-foreground'>
              Open a collection&apos;s Entries → API Preview → REST Preview or GraphQL Preview.
              Choose Add filter, select a field and match type, enter a value, then Apply filters.
              All filters must match; applying resets pagination to page 1. Dates offer single dates
              and inclusive ranges with optional boundaries; Relation fields accept connected entry IDs.
              Filters are shared between tabs and included in copied URLs, cURL, GraphQL queries,
              and live responses. Edits take effect after applying. Clear filters removes all immediately.
            </p>
            <h3 className='font-bold'>Sorting entries</h3>
            <p className='text-sm text-muted-foreground'>
              REST: <code>?sortBy=price&amp;sortDir=asc</code>.
              GraphQL: <code>sortBy: &quot;price&quot;, sortDir: &quot;asc&quot;</code> on
              {' '}<code>entriesPage</code> or the legacy <code>entries</code> query.
              Use a top-level schema field name, not its label. Only Number, Text, Email, Date,
              and Boolean schema fields support sorting. Number sorts numerically; Text and Email
              alphabetically ignoring case; Date chronologically using valid YYYY-MM-DD values;
              Boolean false-to-true ascending. Other types, multi-value fields and nested paths are unsupported.
            </p>
            <p className='text-sm text-muted-foreground'>
              System fields <code>id</code> and <code>createdAt</code> remain supported and take precedence
              over schema fields with those names. Defaults: <code>sortBy=createdAt</code> and
              {' '}<code>sortDir=desc</code>. Use <code>asc</code> or <code>desc</code>.
              Missing, null, empty-string, invalidly typed values and invalid dates go last in either direction.
              Equal values use ID ascending as a tie-breaker. Filters and sorting apply before pagination.
              Unknown/unsupported fields or invalid directions return REST HTTP 400 or GraphQL
              {' '}<code>BAD_USER_INPUT</code>.
            </p>
          </div>

            <p className='text-sm text-muted-foreground'>
              POST to <code>/api/graphql</code> with <code>Authorization: Bearer YOUR_API_KEY</code>,
              {' '}<code>X-Tenant-ID: YOUR_TENANT_ID</code>, and <code>Content-Type: application/json</code>.
              Send the query in the JSON body&apos;s <code>query</code> property.
              The <code>filters</code> argument is a JSON scalar. Filters combine with AND before pagination.
            </p>
          <CodeBlock
            id='graphql-entry-filters'
            copiedId={copied}
            onCopy={copyToClipboard}
            code={`query FilteredPosts {
  entriesPage(
    collectionSlug: "posts"
    page: 1
    limit: 10
    sortBy: "publish_date"
    sortDir: "desc"
    filters: {
      title: { icontains: "hello" }
      publish_date: { gte: "2026-10-01", lte: "2026-10-31" }
      category: { eq: 42 }
    }
  ) {
    entries { id content }
    pagination { currentPage totalPages totalCount limit }
  }
}`}
          />
            <p className='text-sm text-muted-foreground'>
              Replace the example field names with your collection&apos;s schema field names.
              Here <code>category</code> is the relation field inside Posts, and <code>42</code> is the
              connected Categories entry ID, not its title or slug. If the field is named
              {' '}<code>post_category</code>, use that name instead. Relation IDs must be positive integers;
              matching uses stored references even for unpublished or deleted targets.
              Multi-ID and related title/slug filters are unsupported.
            </p>
            <ul className='list-disc pl-5 space-y-2 text-sm text-muted-foreground'>
              <li>Text equality: <code>{'filters: { title: "Hello" }'}</code> or <code>{'filters: { title: { eq: "Hello" } }'}</code>. Equality is case-sensitive; <code>icontains</code> ignores case and treats %, _ and backslashes literally.</li>
              <li>Single date: <code>{'filters: { publish_date: "2026-10-25" }'}</code> or <code>{'filters: { publish_date: { eq: "2026-10-25" } }'}</code>. Dates must be valid YYYY-MM-DD values.</li>
              <li>Date ranges use inclusive <code>gte</code>/<code>lte</code> boundaries; either can be omitted. Reversed ranges are rejected. Missing or empty dates do not match. Time/Datetime fields and timezone conversion are not supported.</li>
              <li>Relation equality also accepts <code>{'filters: { category: 42 }'}</code>.</li>
              <li>Select/Radio values must match configured options; Boolean filters use true or false. Example: <code>{'filters: { priority: "high", featured: true }'}</code>.</li>
            </ul>
            <p className='text-sm text-muted-foreground'>
              Invalid filters return a GraphQL error with code <code>BAD_USER_INPUT</code>.
              The legacy <code>entries</code> query also accepts filters; use <code>entriesPage</code> for pagination metadata.
            </p>
        </section>

        {/* SDK/Code Examples */}
        <section
          id='examples'
          className='space-y-8 bg-zinc-900 rounded-3xl p-8 lg:p-12 text-zinc-100 shadow-2xl ring-1 ring-zinc-800'
        >
          <div className='space-y-2'>
            <div className='inline-flex items-center space-x-2 bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider'>
              <Code2 className='w-3 h-3' />
              <span>JavaScript / TypeScript SDK</span>
            </div>
            <h2 className='text-3xl font-bold'>Connect your frontend</h2>
            <p className='text-zinc-400'>
              Use the official SDK for typed entries, pagination, tenant
              headers, and exact field filters. Keep API keys in server-side
              environment variables.
            </p>
          </div>

          <CodeBlock
            id='js-example'
            copiedId={copied}
            onCopy={copyToClipboard}
            code={`pnpm add @morphic-cms/sdk

import { createMorphicClient } from '@morphic-cms/sdk'

const cms = createMorphicClient({
  baseUrl: '${baseUrl}',
  apiKey: process.env.MORPHIC_API_KEY,
  tenantId: process.env.MORPHIC_TENANT_ID,
})

const posts = await cms.entries.list('blog-posts', {
  page: 1,
  limit: 10,
  filters: { is_in_review: 'Yes' },
})

if (posts.type === 'collection') {
  console.log(posts.entries, posts.pagination.totalCount)
}`}
          />
        </section>
      </div>
    </Layout>
  )
}
