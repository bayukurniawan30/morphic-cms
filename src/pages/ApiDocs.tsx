import React from 'react';
import { Head } from '@inertiajs/react';
import Layout from '@/components/Layout';
import { 
  Database, 
  LayoutGrid, 
  FileCheck, 
  Image as ImageIcon, 
  Copy,
  Check,
  Zap,
  ShieldCheck,
  Code2,
  Globe
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

interface ApiDocsProps {
  user: any;
}

const CodeBlock = ({ 
  code, 
  id, 
  copiedId, 
  onCopy 
}: { 
  code: string; 
  id: string; 
  copiedId: string | null; 
  onCopy: (text: string, id: string) => void;
}) => (
  <div className="relative group mt-4">
    <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-opacity">
      <Button 
        variant="secondary" 
        size="icon" 
        className="h-8 w-8 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300"
        onClick={() => onCopy(code, id)}
      >
        {copiedId === id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
    <pre className="bg-zinc-950 text-zinc-300 p-6 rounded-xl overflow-x-auto font-mono text-sm border border-zinc-800 shadow-2xl">
      <code>{code}</code>
    </pre>
  </div>
);

export default function ApiDocs({ user }: ApiDocsProps) {
  const [copied, setCopied] = React.useState<string | null>(null);
  const [baseUrl, setBaseUrl] = React.useState('https://your-morphic-cms.vercel.app');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      setBaseUrl(window.location.origin);
    }
  }, []);

  const copyToClipboard = (text: string, id: string) => {
    if (!navigator.clipboard) {
      toast.error('Clipboard API not available');
      return;
    }
    navigator.clipboard.writeText(text).then(() => {
      setCopied(id);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(null), 2000);
    }).catch(err => {
      console.error('Failed to copy!', err);
      toast.error('Failed to copy');
    });
  };

  return (
    <Layout user={user}>
      <Head title="API Documentation | Morphic CMS" />
      
      <div className="w-full space-y-12 pb-24">
        {/* Header */}
        <div className="space-y-4">
          <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            <Zap className="w-3 h-3" />
            <span>Developer Reference</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">Morphic REST API</h1>
          <p className="text-xl text-muted-foreground max-w-3xl">
            Everything you need to integrate Morphic CMS with your frontend applications, static site generators, or external tools.
          </p>
        </div>

        {/* Authentication Section */}
        <section id="authentication" className="space-y-6 scroll-mt-20">
          <div className="flex items-center space-x-3">
             <div className="bg-blue-500/10 p-2 rounded-lg">
                <ShieldCheck className="w-6 h-6 text-blue-500" />
             </div>
             <h2 className="text-2xl font-bold">Authentication</h2>
          </div>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              Most API requests require an API Key for authentication. You can manage your API keys and their permissions in the 
              <a href="/api-key-abilities" className="text-primary font-medium hover:underline mx-1">API Key Abilities</a> 
              section.
            </p>
          </div>
          
          <Tabs defaultValue="header" className="w-full">
            <TabsList className="bg-muted/50 p-1">
              <TabsTrigger value="header">Bearer Token (Recommended)</TabsTrigger>
              <TabsTrigger value="query">Query Parameter</TabsTrigger>
            </TabsList>
            <TabsContent value="header" className="mt-4">
              <CodeBlock 
                id="auth-header"
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X GET "${baseUrl}/api/collections" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </TabsContent>
            <TabsContent value="query" className="mt-4">
              <CodeBlock 
                id="auth-query"
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X GET "${baseUrl}/api/collections?api_key=YOUR_API_KEY"`}
              />
            </TabsContent>
          </Tabs>
        </section>

        {/* Collections Section */}
        <section id="collections" className="space-y-6 scroll-mt-20">
          <div className="flex items-center space-x-3">
             <div className="bg-purple-500/10 p-2 rounded-lg">
                <LayoutGrid className="w-6 h-6 text-purple-500" />
             </div>
             <h2 className="text-2xl font-bold">Collections API</h2>
          </div>
          
          <div className="space-y-10">
            {/* List Collections */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">GET</span>
                List Collections
              </h3>
              <p className="text-muted-foreground text-sm">Retrieve a list of all your defined collections and their structures.</p>
              <CodeBlock 
                id="get-collections"
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X GET "${baseUrl}/api/collections" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </div>

            {/* List Entries */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-green-500/10 text-green-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">GET</span>
                Get Entries
              </h3>
              <p className="text-muted-foreground text-sm">Fetch paginated entries for a specific collection using its ID or slug.</p>
              <CodeBlock 
                id="get-entries"
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`# Using slug
curl -X GET "${baseUrl}/api/collections/blog-posts/entries?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
              />
            </div>

            {/* Create Entry */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <span className="bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">POST</span>
                Create Entry
              </h3>
              <p className="text-muted-foreground text-sm">Add a new entry to a collection. Fields must match the collection schema.</p>
              <CodeBlock 
                id="post-entry"
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl -X POST "${baseUrl}/api/collections/1/entries" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "My New Post",
    "content": "Hello World",
    "status": "published"
  }'`}
              />
            </div>
          </div>
        </section>

        {/* Globals Section */}
        <section id="globals" className="space-y-6 scroll-mt-20">
          <div className="flex items-center space-x-3">
             <div className="bg-orange-500/10 p-2 rounded-lg">
                <Globe className="w-6 h-6 text-orange-500" />
             </div>
             <h2 className="text-2xl font-bold">Globals API</h2>
          </div>
          <p className="text-muted-foreground">Globals are single-entry collections (e.g., site settings). Use the same entries endpoint to manage them.</p>
          <CodeBlock 
            id="get-global"
            copiedId={copied}
            onCopy={copyToClipboard}
            code={`# Get global site settings
curl -X GET "${baseUrl}/api/collections/site-settings/entries" \\
  -H "Authorization: Bearer YOUR_API_KEY"`}
          />
        </section>

        {/* Forms Section */}
        <section id="forms" className="space-y-6 scroll-mt-20">
          <div className="flex items-center space-x-3">
             <div className="bg-emerald-500/10 p-2 rounded-lg">
                <FileCheck className="w-6 h-6 text-emerald-500" />
             </div>
             <h2 className="text-2xl font-bold">Form Submissions</h2>
          </div>
          <p className="text-muted-foreground">Submit data from your frontend forms directly into Morphic. This endpoint is public if configured with Allowed Origins.</p>
          <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl flex items-start space-x-3">
            <Zap className="w-5 h-5 text-amber-500 mt-0.5" />
            <div className="text-sm">
              <p className="font-bold text-amber-700 dark:text-amber-400">Public Access</p>
              <p className="text-amber-600 dark:text-amber-500/80">No API Key is required for this endpoint. Make sure to set "Allowed Origins" in the Form Builder settings for security.</p>
            </div>
          </div>
          <CodeBlock 
            id="post-form"
            copiedId={copied}
            onCopy={copyToClipboard}
            code={`curl -X POST "${baseUrl}/api/forms/contact-us/submit" \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "Hi, I love your CMS!"
  }'`}
          />
        </section>

        {/* Assets Section */}
        <section id="assets" className="space-y-6 scroll-mt-20">
          <div className="flex items-center space-x-3">
             <div className="bg-pink-500/10 p-2 rounded-lg">
                <ImageIcon className="w-6 h-6 text-pink-500" />
             </div>
             <h2 className="text-2xl font-bold">Media & Documents</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="font-semibold text-sm">Media Library</p>
              <CodeBlock 
                id="get-media"
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl "${baseUrl}/api/media"`}
              />
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm">Document Library</p>
              <CodeBlock 
                id="get-docs"
                copiedId={copied}
                onCopy={copyToClipboard}
                code={`curl "${baseUrl}/api/documents"`}
              />
            </div>
          </div>
        </section>

        {/* SDK/Code Examples */}
        <section id="examples" className="space-y-8 bg-zinc-900 rounded-3xl p-8 lg:p-12 text-zinc-100 shadow-2xl ring-1 ring-zinc-800">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-zinc-800 text-zinc-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
              <Code2 className="w-3 h-3" />
              <span>Javascript Example</span>
            </div>
            <h2 className="text-3xl font-bold">Connect your frontend</h2>
            <p className="text-zinc-400">Fetch your content in a few lines of code using the native Fetch API.</p>
          </div>
          
          <CodeBlock 
            id="js-example"
            copiedId={copied}
            onCopy={copyToClipboard}
            code={`const MORPHIC_API_URL = "${baseUrl}/api";
const API_KEY = "your_secret_api_key";

async function getBlogPosts() {
  const response = await fetch(\`\${MORPHIC_API_URL}/collections/blog-posts/entries\`, {
    headers: {
      'Authorization': \`Bearer \${API_KEY}\`
    }
  });
  
  const data = await response.json();
  return data.entries;
}`}
          />
        </section>
      </div>
    </Layout>
  );
}
