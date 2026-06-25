import {
  BashIcon,
  DotNetIcon,
  GoIcon,
  JavascriptIcon,
  Logo,
  PhpIcon,
  PhytonIcon,
  RustIcon,
} from '@/components/icons'
import Macbook from '@/components/mockup/Macbook'
import { Button } from '@/components/ui/button'
import { APP_VERSION } from '@/lib/version'
import { Head, Link } from '@inertiajs/react'
import {
  ArrowRight,
  Check,
  CheckCircle2,
  CheckSquare,
  Cloud,
  Copy,
  Database,
  FileCode,
  Globe,
  History,
  Key,
  Languages,
  Layers,
  Lock,
  Flame,
  Menu,
  RefreshCw,
  Rocket,
  Server,
  Sparkles,
  Terminal,
  TerminalIcon,
  Users,
  Webhook,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'

const languageSnippets = {
  js: `// Fetching collection entries in JavaScript / Node.js
const fetchEntries = async () => {
  const response = await fetch('https://morphic-cms.app/api/collections/posts/entries?page=1&limit=10', {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'X-Tenant-ID': '1' // tenant scope header
    }
  });
  
  if (!response.ok) {
    throw new Error(\`HTTP error! status: \${response.status}\`);
  }
  
  const data = await response.json();
  console.log('Morphic Entries:', data.entries);
};

fetchEntries();`,

  python: `# Fetching collection entries in Python using requests
import requests

url = "https://morphic-cms.app/api/collections/posts/entries"
params = {
    "page": 1,
    "limit": 10
}
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "X-Tenant-ID": "1" # tenant scope header
}

try:
    response = requests.get(url, headers=headers, params=params)
    response.raise_for_status()
    data = response.json()
    print("Morphic Entries:", data["entries"])
except requests.exceptions.RequestException as e:
    print("Error fetching entries:", e)`,

  php: `<?php
// Fetching collection entries in PHP using cURL
$ch = curl_init();

$url = "https://morphic-cms.app/api/collections/posts/entries?page=1&limit=10";

curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Bearer YOUR_API_KEY",
    "X-Tenant-ID: 1" // tenant scope header
]);

$response = curl_exec($ch);

if (curl_errno($ch)) {
    echo 'Error:' . curl_error($ch);
} else {
    $data = json_decode($response, true);
    print_r($data['entries']);
}

curl_close($ch);`,

  go: `package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

func main() {
	url := "https://morphic-cms.app/api/collections/posts/entries?page=1&limit=10"
	req, _ := http.NewRequest("GET", url, nil)
	
	// Headers
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("X-Tenant-ID", "1") // tenant scope header

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Println("Error:", err)
		return
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var result map[string]interface{}
	json.Unmarshal(body, &result)

	fmt.Println("Morphic Entries:", result["entries"])
}`,

  rust: `// Fetching collection entries in Rust using reqwest
use serde_json::Value;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let response = client
        .get("https://morphic-cms.app/api/collections/posts/entries")
        .query(&[("page", "1"), ("limit", "10")])
        .header("Authorization", "Bearer YOUR_API_KEY")
        .header("X-Tenant-ID", "1") // tenant scope header
        .send()
        .await?;

    if response.status().is_success() {
        let data: Value = response.json().await?;
        println!("Morphic Entries: {:?}", data["entries"]);
    } else {
        println!("HTTP Error: {}", response.status());
    }

    Ok(())
}`,

  dotnet: `// Fetching collection entries in C# using HttpClient
using System;
using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    static async Task Main(string[] args)
    {
        using var client = new HttpClient();
        
        var request = new HttpRequestMessage(HttpMethod.Get, 
            "https://morphic-cms.app/api/collections/posts/entries?page=1&limit=10");
            
        request.Headers.Add("Authorization", "Bearer YOUR_API_KEY");
        request.Headers.Add("X-Tenant-ID", "1"); // tenant scope header

        try
        {
            var response = await client.SendAsync(request);
            response.EnsureSuccessStatusCode();
            
            var jsonString = await response.Content.ReadAsStringAsync();
            Console.WriteLine($"Morphic Entries: {jsonString}");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error: {ex.Message}");
        }
    }
}`,

  curl: `# Fetching collection entries using raw cURL
curl -X GET "https://morphic-cms.app/api/collections/posts/entries?page=1&limit=10" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Tenant-ID: 1"`,
}

export default function Home({
  isSimpleHomepage,
}: {
  isSimpleHomepage?: boolean
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Sandbox states
  const [activeSandboxTab, setActiveSandboxTab] = useState<
    'api' | 'schema' | 'webhook'
  >('api')
  const [selectedFields, setSelectedFields] = useState<string[]>([
    'content',
    'category',
  ])
  const [activeTenant, setActiveTenant] = useState<'tenant_a' | 'tenant_b'>(
    'tenant_a'
  )
  const [webhookSecret, setWebhookSecret] = useState('morphic_secret_here')
  const [copiedText, setCopiedText] = useState<
    'npm' | 'db' | 'api' | 'schema' | 'webhook' | 'snippet' | null
  >(null)
  const [activeLang, setActiveLang] = useState<
    'js' | 'python' | 'php' | 'go' | 'rust' | 'dotnet' | 'curl'
  >('js')

  // Copy helper
  const handleCopy = (
    text: string,
    type: 'npm' | 'db' | 'api' | 'schema' | 'webhook' | 'snippet'
  ) => {
    navigator.clipboard.writeText(text)
    setCopiedText(type)
    setTimeout(() => setCopiedText(null), 2000)
  }

  // Toggle dynamic fields
  const toggleField = (field: string) => {
    if (selectedFields.includes(field)) {
      setSelectedFields(selectedFields.filter((f) => f !== field))
    } else {
      setSelectedFields([...selectedFields, field])
    }
  }

  // Generate dynamic mockup entry JSON
  const getMockupEntry = () => {
    const baseContentA = {
      title: 'The Rise of Edge-Native Architecture',
      slug: 'the-rise-of-edge-native-architecture',
    }
    const baseContentB = {
      title: 'Scaling Postgres on Serverless Clusters',
      slug: 'scaling-postgres-on-serverless',
    }

    const content = activeTenant === 'tenant_a' ? baseContentA : baseContentB

    const extraFields: Record<string, any> = {
      content:
        activeTenant === 'tenant_a'
          ? '<p>The cloud is moving closer to the user...</p>'
          : '<p>Serverless Postgres scales down to zero dynamically...</p>',
      category:
        activeTenant === 'tenant_a'
          ? { id: 32, name: 'Tech News', slug: 'tech-news' }
          : { id: 11, name: 'Database', slug: 'database' },
      read_time: activeTenant === 'tenant_a' ? 8 : 5,
      is_active: activeTenant === 'tenant_a' ? true : false,
      tags:
        activeTenant === 'tenant_a'
          ? [{ name: 'Edge' }, { name: 'Web' }]
          : [{ name: 'Postgres' }, { name: 'Serverless' }],
    }

    const finalContent: Record<string, any> = { ...content }
    selectedFields.forEach((f) => {
      if (extraFields[f] !== undefined) {
        finalContent[f] = extraFields[f]
      }
    })

    return {
      id: activeTenant === 'tenant_a' ? 1042 : 2085,
      tenantId: activeTenant === 'tenant_a' ? 1 : 2,
      collection: 'posts',
      status: 'published',
      locale: 'en',
      content: finalContent,
      createdAt: '2026-06-19T08:00:00.000Z',
      updatedAt: '2026-06-19T08:15:00.000Z',
    }
  }

  // Simple string hashing helper to simulate live webhook signature changes
  const getSimulatedSignature = (secret: string) => {
    let hash = 0
    const str = JSON.stringify(getMockupEntry()) + secret
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = (hash << 5) - hash + char
      hash = hash & hash
    }
    return Math.abs(hash).toString(16).padStart(8, '0') + 'bcf3d84a7e91d0e5'
  }

  if (isSimpleHomepage) {
    const domain =
      typeof window !== 'undefined' ? window.location.hostname : 'morphic-cms'

    return (
      <div className='min-h-screen bg-deep-mocha-950 text-white flex flex-col items-center justify-between p-6 selection:bg-primary/30'>
        <Head title='Powered by Morphic CMS'>
          <meta
            name='description'
            content={`Powered by Morphic CMS - Dynamic, high-performance headless content delivery for ${domain}.`}
          />
          <meta
            name='keywords'
            content={`morphic cms, headless cms, ${domain}, instant apis, dynamic schemas, modern content management, edge-ready cms`}
          />
          <meta name='robots' content='index, follow' />

          {/* Open Graph / Facebook */}
          <meta property='og:type' content='website' />
          <meta
            property='og:title'
            content={`Powered by Morphic CMS - ${domain}`}
          />
          <meta
            property='og:description'
            content={`Morphic CMS powers dynamic, high-performance headless content delivery for ${domain}.`}
          />
          <meta property='og:site_name' content='Morphic CMS' />

          {/* Twitter */}
          <meta property='twitter:card' content='summary_large_image' />
          <meta
            property='twitter:title'
            content={`Powered by Morphic CMS - ${domain}`}
          />
          <meta
            property='twitter:description'
            content={`Morphic CMS powers dynamic, high-performance headless content delivery for ${domain}.`}
          />
        </Head>

        {/* Background Glow */}
        <div className='fixed inset-0 overflow-hidden pointer-events-none'>
          <div className='absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/40 rounded-full blur-[160px] animate-pulse duration-[10s]' />
          <div className='absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-green-500/10 rounded-full blur-[160px] animate-pulse duration-[15s]' />
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40%] h-[40%] bg-primary/20 rounded-full blur-[140px]' />
        </div>

        <div />

        <div className='relative z-10 text-center space-y-6'>
          <div className='flex flex-col items-center mt-4'>
            <h1 className='text-5xl md:text-7xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-l from-primary to-deep-mocha-200'>
              {domain.toLowerCase()}
            </h1>
            <div className='flex flex-wrap justify-center gap-x-6 gap-y-2 text-deep-mocha-400 text-sm font-medium mt-6 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300'>
              <div className='flex items-center'>
                <span className='w-1 h-1 bg-primary/40 rounded-full mr-2'></span>
                Dynamic Schemas
              </div>
              <div className='flex items-center'>
                <span className='w-1 h-1 bg-primary/40 rounded-full mr-2'></span>
                Instant APIs
              </div>
              <div className='flex items-center'>
                <span className='w-1 h-1 bg-primary/40 rounded-full mr-2'></span>
                Flexible Field Types
              </div>
            </div>
            <div className='inline-flex items-center bg-deep-mocha-800/30 border border-deep-mocha-700/50 px-4 py-2 rounded-full text-[0.85rem] text-deep-mocha-200 mb-12 animate-in fade-in zoom-in duration-700 mt-6'>
              <span className='relative flex h-2 w-2 mr-3'>
                <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
                <span className='relative inline-flex rounded-full h-2 w-2 bg-primary'></span>
              </span>
              Powered by Morphic CMS
            </div>
          </div>
        </div>

        <footer className='relative z-10 py-8 text-deep-mocha-500 text-xs opacity-50'>
          &copy; {new Date().getFullYear()} {domain}. All rights reserved.
        </footer>
      </div>
    )
  }

  const mockEntry = getMockupEntry()
  const apiCollectionResponse = {
    type: 'collection',
    entries: [
      {
        id: mockEntry.id,
        tenantId: mockEntry.tenantId,
        collectionId: 12,
        content: mockEntry.content,
        updatedById: 1,
        status: mockEntry.status,
        locale: mockEntry.locale,
        translationGroupId:
          mockEntry.tenantId === 1
            ? 'a6e2e240-0535-4b5b-adf2-8d95574b5c4e'
            : '3d7258f9-1147-4ddc-b212-6eb30d5110fe',
        createdAt: mockEntry.createdAt,
        updatedAt: mockEntry.updatedAt,
        deletedAt: null,
        updatedBy: {
          id: 1,
          name: 'Bayu Kurniawan',
        },
      },
    ],
    pagination: {
      currentPage: 1,
      totalPages: 1,
      totalCount: 1,
      limit: 10,
    },
  }

  const generatedResponseCode = JSON.stringify(apiCollectionResponse, null, 2)

  const generatedSchemaCode = JSON.stringify(
    {
      name: 'Posts',
      slug: 'posts',
      fields: [
        { name: 'title', type: 'text', required: true },
        {
          name: 'slug',
          type: 'slug',
          required: true,
          slugSourceField: 'title',
        },
        ...selectedFields.map((f) => {
          const fieldTypesMap: Record<string, string> = {
            content: 'rich-text',
            category: 'relation',
            read_time: 'number',
            is_active: 'boolean',
            tags: 'array',
          }
          return {
            name: f,
            type: fieldTypesMap[f] || 'text',
            required: false,
          }
        }),
      ],
    },
    null,
    2
  )

  const quickStartCmds = `git clone https://github.com/bayukurniawan30/morphic-cms\ncd morphic-cms && pnpm install\npnpm db:push && pnpm db:seed\npnpm dev`

  return (
    <div className='min-h-screen bg-deep-mocha-950 text-slate-100 selection:bg-primary/30 overflow-x-hidden font-sans relative antialiased'>
      <Head title='Morphic CMS - Modern, Edge-Ready Headless CMS'>
        <meta
          name='description'
          content='Morphic CMS is a high-performance, database-first headless CMS built for serverless PostgreSQL and edge functions. Fast, secure, and multi-tenant by default.'
        />
        <meta
          name='keywords'
          content='headless cms, edge-ready, serverless, database-first, multi-tenant, hono, drizzle, neon, react, api cms'
        />
        <link rel='icon' type='image/png' href='/favicon.png' />
      </Head>

      <style>{`
        .neon-glow-purple {
          box-shadow: 0 0 40px -5px rgba(139, 92, 246, 0.25);
        }
        .neon-glow-green {
          box-shadow: 0 0 40px -5px rgba(16, 185, 129, 0.25);
        }
        .neon-glow-blue {
          box-shadow: 0 0 40px -5px rgba(59, 130, 246, 0.25);
        }
        .neon-border-grid {
          background-image: 
            radial-gradient(circle at 50% 0%, rgba(135, 120, 122, 0.15), transparent 60%),
            radial-gradient(circle at 100% 100%, rgba(59, 130, 246, 0.05), transparent 50%),
            radial-gradient(circle at 0% 50%, rgba(16, 185, 129, 0.05), transparent 50%),
            linear-gradient(to right, rgba(255, 255, 255, 0.015) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255, 255, 255, 0.015) 1px, transparent 1px);
          background-size: 100% 100%, 100% 100%, 100% 100%, 48px 48px, 48px 48px;
        }
        .gradient-text-neon {
          background: linear-gradient(135deg, #fff 30%, #cfc9ca 70%, #87787a 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
      `}</style>

      {/* Decorative Blur Backgrounds */}
      <div className='absolute top-0 inset-x-0 h-[60rem] neon-border-grid pointer-events-none z-0' />
      <div className='absolute top-[10%] left-[-15%] w-[45rem] h-[45rem] bg-purple-900/5 rounded-full blur-[140px] pointer-events-none' />
      <div className='absolute top-[25%] right-[-15%] w-[40rem] h-[40rem] bg-blue-900/5 rounded-full blur-[140px] pointer-events-none' />
      <div className='absolute top-[60%] left-[20%] w-[35rem] h-[35rem] bg-emerald-950/5 rounded-full blur-[130px] pointer-events-none' />

      {/* Top Banner */}
      <div className='relative z-50 bg-deep-mocha-900/80 backdrop-blur-md border-b border-white/5 text-center py-2.5 px-4 text-xs font-semibold tracking-wide flex items-center justify-center gap-2 text-deep-mocha-300'>
        <span className='bg-deep-mocha-700/30 text-deep-mocha-100 px-2 py-0.5 rounded-full text-[10px] font-black border border-deep-mocha-700/40 uppercase'>
          v{APP_VERSION}
        </span>
        <span>
          Introducing Morphic CMS: Database-first headless platform built for
          Neon PostgreSQL.
        </span>
        <Link
          href='/docs'
          className='underline hover:text-white transition-colors flex items-center ml-2 group'
        >
          Read Docs{' '}
          <ArrowRight className='w-3.5 h-3.5 ml-1 transition-transform group-hover:translate-x-0.5' />
        </Link>
      </div>

      {/* Navigation */}
      <nav className='sticky top-0 z-50 border-b border-white/5 bg-deep-mocha-950/60 backdrop-blur-xl'>
        <div className='max-w-7xl mx-auto px-6 h-20 flex items-center justify-between'>
          <Link href='/' className='flex items-center space-x-3 group'>
            <Logo className='scale-150 group-hover:scale-[1.55] transition-transform duration-300' />
            <span className='text-2xl font-black tracking-tighter text-white uppercase bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400'>
              MORPHIC
            </span>
          </Link>

          <div className='hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400'>
            <a href='#features' className='hover:text-white transition-colors'>
              Features
            </a>
            <a
              href='#architecture'
              className='hover:text-white transition-colors'
            >
              Architecture
            </a>
            <a
              href='#comparison'
              className='hover:text-white transition-colors'
            >
              Compare
            </a>
            <a
              href='#deployment'
              className='hover:text-white transition-colors'
            >
              Deployment
            </a>
            <Link
              href='/pricing'
              className='hover:text-white transition-colors'
            >
              Pricing
            </Link>
            <Link href='/docs' className='hover:text-white transition-colors'>
              Docs
            </Link>
          </div>

          <div className='hidden md:flex items-center space-x-4'>
            <Button
              asChild
              variant='outline'
              className='rounded-full border-white/10 bg-deep-mocha-900/40 text-slate-300 hover:text-white hover:bg-deep-mocha-800'
            >
              <Link href='/login'>Sign in</Link>
            </Button>
            <Button
              asChild
              className='rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl shadow-primary/10'
            >
              <Link href='/signup'>Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <div className='md:hidden flex items-center'>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className='p-2 text-slate-400 hover:text-white transition-colors focus:outline-none'
            >
              {isMenuOpen ? (
                <X className='w-6 h-6' />
              ) : (
                <Menu className='w-6 h-6' />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMenuOpen && (
          <div className='md:hidden absolute top-20 left-0 w-full bg-deep-mocha-950 border-b border-white/5 py-8 px-6 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300 z-50'>
            <a
              href='#features'
              onClick={() => setIsMenuOpen(false)}
              className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
            >
              Features
            </a>
            <a
              href='#architecture'
              onClick={() => setIsMenuOpen(false)}
              className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
            >
              Architecture
            </a>
            <a
              href='#comparison'
              onClick={() => setIsMenuOpen(false)}
              className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
            >
              Compare
            </a>
            <a
              href='#deployment'
              onClick={() => setIsMenuOpen(false)}
              className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
            >
              Deploy
            </a>
            <Link
              href='/docs'
              className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
            >
              Documentation
            </Link>
            <Link
              href='/pricing'
              onClick={() => setIsMenuOpen(false)}
              className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
            >
              Pricing
            </Link>
            <Link
              href='/changelog'
              onClick={() => setIsMenuOpen(false)}
              className='block text-lg font-medium text-slate-300 hover:text-white transition-colors'
            >
              Changelog
            </Link>
            <div className='pt-6 space-y-4'>
              <Button
                asChild
                variant='outline'
                className='w-full rounded-full border-white/10 bg-deep-mocha-900/40 text-slate-300 hover:text-white'
              >
                <Link href='/login'>Sign in</Link>
              </Button>
              <Button
                asChild
                className='w-full rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg'
              >
                <Link href='/signup'>Get Started</Link>
              </Button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Container */}
      <main className='relative z-10 max-w-7xl mx-auto px-6'>
        {/* Hero Section */}
        <section className='pt-24 pb-20 text-center flex flex-col items-center justify-center relative'>
          {/* Badge */}
          <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-8 backdrop-blur-sm shadow-[0_0_20px_rgba(135,120,122,0.05)] animate-in fade-in slide-in-from-bottom-4 duration-700'>
            <Sparkles className='w-3 h-3 text-deep-mocha-400' />
            <span>Database-first Serverless Headless CMS</span>
          </div>

          {/* Heading */}
          <h1 className='text-5xl md:text-8xl font-extrabold tracking-tight mb-8 leading-tight animate-in fade-in slide-in-from-bottom-6 duration-1000'>
            Content Scoping. <br />
            <span className='gradient-text-neon'>Instant Edge APIs.</span>
          </h1>

          {/* Subheading */}
          <p className='text-lg md:text-xl text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000'>
            Morphic CMS couples modern serverless schemas with high-performance
            data architecture. Define database fields on the fly, secure
            endpoints with tenant-level isolation, and stream content from
            serverless Postgres at the edge.
          </p>

          {/* CTA Buttons */}
          <div className='flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-1000'>
            <Button
              asChild
              size='lg'
              className='h-14 px-8 rounded-full bg-primary text-primary-foreground font-bold hover:bg-primary/90 shadow-2xl shadow-primary/20 group border-none transition-all'
            >
              <Link href='/signup' className='flex items-center'>
                Get Started
                <ArrowRight className='ml-2 w-5 h-5 group-hover:translate-x-0.5 transition-transform' />
              </Link>
            </Button>
            <Button
              onClick={() => {
                const element = document.getElementById('playground')
                element?.scrollIntoView({ behavior: 'smooth' })
              }}
              variant='outline'
              size='lg'
              className='h-14 px-8 rounded-full border-white/10 bg-deep-mocha-900/30 text-slate-300 hover:text-white hover:bg-deep-mocha-800/60 hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)] font-semibold transition-all duration-300'
            >
              Try Playground
            </Button>
          </div>

          {/* Hero Terminal Setup */}
          <div className='mt-20 w-full max-w-3xl bg-[#1b1818]/90 border border-white/10 rounded-2xl shadow-2xl p-6 text-left relative overflow-hidden group backdrop-blur-xl animate-in zoom-in-95 duration-1000'>
            <div className='absolute top-0 right-0 w-48 h-48 bg-deep-mocha-700/5 rounded-full blur-[60px] pointer-events-none' />
            <div className='flex items-center justify-between pb-4 border-b border-white/5 mb-4'>
              <div className='flex items-center space-x-2'>
                <div className='w-3 h-3 rounded-full bg-red-500/70' />
                <div className='w-3 h-3 rounded-full bg-yellow-500/70' />
                <div className='w-3 h-3 rounded-full bg-green-500/70' />
                <span className='text-xs text-slate-500 font-mono pl-3'>
                  quick-start.sh
                </span>
              </div>
              <button
                onClick={() => handleCopy(quickStartCmds, 'npm')}
                className='text-slate-500 hover:text-slate-200 transition-colors p-1.5 rounded hover:bg-white/5'
                title='Copy install scripts'
              >
                {copiedText === 'npm' ? (
                  <Check className='w-4 h-4 text-emerald-400' />
                ) : (
                  <Copy className='w-4 h-4' />
                )}
              </button>
            </div>
            <pre className='font-mono text-sm leading-relaxed text-deep-mocha-300 overflow-x-auto selection:bg-primary/20'>
              <code>
                <span className='text-slate-500'>
                  # 1. Clone & install repository
                </span>
                <br />
                <span className='text-emerald-400'>$</span> git clone
                https://github.com/bayukurniawan30/morphic-cms.git
                <br />
                <span className='text-emerald-400'>$</span> cd morphic-cms &&
                pnpm install
                <br />
                <span className='text-slate-500'>
                  # 2. Push database schema & seed admin panel
                </span>
                <br />
                <span className='text-emerald-400'>$</span> pnpm db:push && pnpm
                db:seed
                <br />
                <span className='text-slate-500'>
                  # 3. Start development server
                </span>
                <br />
                <span className='text-emerald-400'>$</span> pnpm dev
              </code>
            </pre>
          </div>
        </section>

        {/* Showcase Video Section */}
        <section className='pb-28 pt-28 -mx-6 flex flex-col items-center justify-center relative animate-in fade-in zoom-in-95 duration-1000 delay-300 overflow-hidden'>
          {/* Gradient Pattern Background with Radial Fade */}
          <div
            className='absolute inset-0 pointer-events-none'
            style={{
              backgroundImage: 'url("/gradient-pattern.webp")',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              maskImage: 'radial-gradient(circle, black, transparent 90%)',
              WebkitMaskImage:
                'radial-gradient(circle, black, transparent 90%)',
            }}
          />
          <div className='flex items-center justify-center w-full py-12 scale-[0.7] sm:scale-[0.8] md:scale-[1.35] lg:scale-[1.5] origin-center my-8 relative z-10'>
            <Macbook>
              <video
                src='/morphic-cms-showcase.mp4'
                autoPlay
                loop
                muted
                playsInline
                className='w-full h-full object-cover'
              />
            </Macbook>
          </div>
        </section>

        {/* Playground Sandbox Section */}
        <section
          id='playground'
          className='py-28 border-t border-white/5 scroll-mt-24'
        >
          <div className='text-center max-w-3xl mx-auto mb-16'>
            <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-6'>
              <Terminal className='w-3 h-3 text-deep-mocha-400' />
              <span>Interactive Sandbox</span>
            </div>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white'>
              Build Schema, Inspect API
            </h2>
            <p className='text-slate-400'>
              Select fields in the builder to see the live JSON schema adjust,
              switch tenants to test organization scoping, and examine HMAC
              webhooks signatures.
            </p>
          </div>

          <div className='grid lg:grid-cols-12 gap-8 items-stretch'>
            {/* Sandbox Sidebar Controls: 5 cols */}
            <div className='lg:col-span-5 bg-[#1b1818]/50 border border-white/5 rounded-2xl p-6 lg:p-8 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden'>
              <div className='absolute top-0 left-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[60px] pointer-events-none' />

              <div>
                <h3 className='text-lg font-bold text-white mb-2 flex items-center gap-2'>
                  <Layers className='w-4 h-4 text-deep-mocha-300' /> Schema
                  Configuration
                </h3>
                <p className='text-xs text-slate-400 mb-6'>
                  Define fields to dynamically build the PostgreSQL-backed
                  collection model.
                </p>

                <div className='space-y-4'>
                  <div className='p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between opacity-60 cursor-not-allowed'>
                    <div className='flex items-center space-x-3'>
                      <CheckCircle2 className='w-4.5 h-4.5 text-deep-mocha-400 shrink-0' />
                      <div>
                        <div className='text-sm font-semibold text-slate-200'>
                          title
                        </div>
                        <div className='text-[10px] font-mono text-slate-400'>
                          type: "text" (Required)
                        </div>
                      </div>
                    </div>
                    <Lock className='w-3.5 h-3.5 text-slate-500' />
                  </div>

                  <div className='p-3 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between opacity-60 cursor-not-allowed'>
                    <div className='flex items-center space-x-3'>
                      <CheckCircle2 className='w-4.5 h-4.5 text-deep-mocha-400 shrink-0' />
                      <div>
                        <div className='text-sm font-semibold text-slate-200'>
                          slug
                        </div>
                        <div className='text-[10px] font-mono text-slate-400'>
                          type: "slug" (Required)
                        </div>
                      </div>
                    </div>
                    <Lock className='w-3.5 h-3.5 text-slate-500' />
                  </div>

                  {/* Toggleable fields */}
                  {[
                    { key: 'content', label: 'content', type: 'rich-text' },
                    {
                      key: 'category',
                      label: 'category',
                      type: 'relation (Posts -> Category)',
                    },
                    {
                      key: 'read_time',
                      label: 'read_time',
                      type: 'number (reading minutes)',
                    },
                    { key: 'is_active', label: 'is_active', type: 'boolean' },
                    { key: 'tags', label: 'tags', type: 'array (nested tags)' },
                  ].map((f) => {
                    const isChecked = selectedFields.includes(f.key)
                    return (
                      <button
                        key={f.key}
                        onClick={() => toggleField(f.key)}
                        className={`w-full text-left p-3 border rounded-xl flex items-center justify-between transition-all group ${
                          isChecked
                            ? 'bg-deep-mocha-900/20 border-primary/40 text-white'
                            : 'bg-transparent border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/5'
                        }`}
                      >
                        <div className='flex items-center space-x-3'>
                          <div
                            className={`w-4.5 h-4.5 rounded border flex items-center justify-center transition-all ${
                              isChecked
                                ? 'bg-primary border-primary text-primary-foreground'
                                : 'bg-transparent border-slate-600 group-hover:border-slate-500'
                            }`}
                          >
                            {isChecked && (
                              <Check className='w-3 h-3 stroke-[3px]' />
                            )}
                          </div>
                          <div>
                            <div
                              className={`text-sm font-semibold transition-colors ${
                                isChecked ? 'text-white' : 'text-slate-300'
                              }`}
                            >
                              {f.label}
                            </div>
                            <div className='text-[10px] font-mono text-slate-500'>
                              type: "{f.type}"
                            </div>
                          </div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Tenant Switcher at Bottom */}
              <div className='mt-8 pt-6 border-t border-white/5'>
                <h4 className='text-xs font-bold uppercase tracking-wider text-slate-400 mb-3'>
                  Multi-Tenant Scoping Header
                </h4>
                <div className='grid grid-cols-2 gap-2 p-1 bg-deep-mocha-950 border border-white/5 rounded-xl'>
                  <button
                    onClick={() => setActiveTenant('tenant_a')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition-all ${
                      activeTenant === 'tenant_a'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    X-Tenant-ID: 1 (Client A)
                  </button>
                  <button
                    onClick={() => setActiveTenant('tenant_b')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold tracking-tight transition-all ${
                      activeTenant === 'tenant_b'
                        ? 'bg-primary text-primary-foreground shadow-md shadow-primary/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    X-Tenant-ID: 2 (Client B)
                  </button>
                </div>
              </div>
            </div>

            {/* Sandbox Output Panel: 7 cols */}
            <div className='lg:col-span-7 bg-[#1b1818]/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between backdrop-blur-xl relative'>
              {/* Header Tabs */}
              <div className='flex items-center justify-between border-b border-white/5 bg-deep-mocha-950 px-6 py-4'>
                <div className='flex items-center space-x-1.5'>
                  <button
                    onClick={() => setActiveSandboxTab('api')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeSandboxTab === 'api'
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Instant API Endpoint
                  </button>
                  <button
                    onClick={() => setActiveSandboxTab('schema')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeSandboxTab === 'schema'
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Postgres Schema JSON
                  </button>
                  <button
                    onClick={() => setActiveSandboxTab('webhook')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      activeSandboxTab === 'webhook'
                        ? 'bg-white/10 text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Signed Webhook
                  </button>
                </div>

                <button
                  onClick={() => {
                    const text =
                      activeSandboxTab === 'api'
                        ? generatedResponseCode
                        : activeSandboxTab === 'schema'
                          ? generatedSchemaCode
                          : getSimulatedSignature(webhookSecret)
                    handleCopy(text, activeSandboxTab)
                  }}
                  className='text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded hover:bg-white/5'
                  title='Copy source'
                >
                  {copiedText === activeSandboxTab ? (
                    <Check className='w-3.5 h-3.5 text-emerald-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5' />
                  )}
                </button>
              </div>

              {/* Main Panel Content */}
              <div className='flex-1 p-6 font-mono text-[13px] leading-relaxed text-slate-300 overflow-x-auto min-h-[380px] flex flex-col justify-between bg-[#131111]/30'>
                {activeSandboxTab === 'api' && (
                  <div className='space-y-4'>
                    <div className='pb-3 border-b border-white/5 space-y-1.5 text-xs text-slate-400'>
                      <div className='flex items-center gap-2'>
                        <span className='text-emerald-400 font-bold'>GET</span>
                        <span className='text-slate-200 font-semibold'>
                          https://morphic-cms.app/api/collections/posts/entries
                        </span>
                      </div>
                      <div>
                        Authorization: Bearer{' '}
                        <span className='text-deep-mocha-300'>
                          morphic_api_key_02847a912e...
                        </span>
                      </div>
                      <div className='flex items-center gap-1'>
                        X-Tenant-ID:{' '}
                        <span className='text-amber-400 font-bold'>
                          {activeTenant === 'tenant_a' ? '1' : '2'}
                        </span>
                        <span className='italic opacity-60'>
                          (
                          {activeTenant === 'tenant_a'
                            ? 'Client A namespace scope'
                            : 'Client B namespace scope'}
                          )
                        </span>
                      </div>
                    </div>
                    <pre className='text-deep-mocha-200 max-h-[500px] overflow-y-auto'>
                      <code>{generatedResponseCode}</code>
                    </pre>
                  </div>
                )}

                {activeSandboxTab === 'schema' && (
                  <div className='space-y-4'>
                    <div className='pb-3 border-b border-white/5 text-xs text-slate-400'>
                      <span>
                        Drizzle migration target schema configuration generated
                        instantly:
                      </span>
                    </div>
                    <pre className='text-blue-300 max-h-[320px] overflow-y-auto'>
                      <code>{generatedSchemaCode}</code>
                    </pre>
                  </div>
                )}

                {activeSandboxTab === 'webhook' && (
                  <div className='space-y-4'>
                    <div className='pb-3 border-b border-white/5 space-y-1 text-xs text-slate-400'>
                      <div className='flex items-center gap-2'>
                        <span className='text-amber-500 font-bold'>POST</span>
                        <span className='text-slate-200 font-semibold'>
                          https://api.yourdomain.com/webhook-listener
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        <span>X-Morphic-Signature:</span>
                        <span className='text-emerald-400 font-mono text-[11px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20'>
                          {getSimulatedSignature(webhookSecret)}
                        </span>
                      </div>
                    </div>

                    <div className='space-y-3'>
                      <label className='block text-xs font-bold uppercase tracking-wider text-slate-500'>
                        Webhook Secret Key (HMAC SHA-256)
                      </label>
                      <div className='flex items-center space-x-2 bg-deep-mocha-950 border border-white/10 rounded-xl px-3 py-2'>
                        <Key className='w-4 h-4 text-slate-500' />
                        <input
                          type='text'
                          value={webhookSecret}
                          onChange={(e) => setWebhookSecret(e.target.value)}
                          className='bg-transparent border-none text-slate-200 focus:outline-none w-full font-mono text-xs'
                          placeholder='Set webhook signature secret...'
                        />
                      </div>
                      <p className='text-[10px] text-slate-500 leading-normal'>
                        When saving entries, Morphic signs the body payload
                        using HMAC SHA256 with this secret key. Your receiver
                        can verify the `X-Morphic-Signature` header matches the
                        payload hash to guarantee origins.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status Indicator */}
              <div className='bg-[#131111]/70 border-t border-white/5 py-3 px-6 flex items-center justify-between text-xs text-slate-500'>
                <div className='flex items-center space-x-2'>
                  <span className='w-2 h-2 rounded-full bg-emerald-500 animate-pulse' />
                  <span>
                    Drizzle Schema synchronized with Serverless Postgres
                  </span>
                </div>
                <span>REST generated in 0.8ms</span>
              </div>
            </div>
          </div>
        </section>

        {/* Language SDK Snippets Section */}
        <section
          id='sdk-fetch'
          className='py-24 border-t border-white/5 scroll-mt-24 relative'
        >
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-900/5 rounded-full blur-[120px] pointer-events-none' />

          <div className='text-center max-w-3xl mx-auto mb-16'>
            <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-6'>
              <Globe className='w-3 h-3 text-deep-mocha-400' />
              <span>Omnichannel Delivery</span>
            </div>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white'>
              Fetch Content in Any Language
            </h2>
            <p className='text-slate-400'>
              Since Morphic CMS generates clean, standard REST APIs, you can
              fetch your collection entries from any frontend or backend
              language. No heavy SDK dependencies required.
            </p>
          </div>

          <div className='grid lg:grid-cols-12 gap-8 items-stretch'>
            {/* Language Selector Left Side: 4 cols */}
            <div className='lg:col-span-4 flex flex-col gap-2 justify-center'>
              {[
                {
                  id: 'js',
                  name: 'JavaScript / Node.js',
                  icon: JavascriptIcon,
                },
                { id: 'python', name: 'Python Requests', icon: PhytonIcon },
                { id: 'php', name: 'PHP cURL', icon: PhpIcon },
                { id: 'go', name: 'Go Standard Library', icon: GoIcon },
                { id: 'rust', name: 'Rust Reqwest', icon: RustIcon },
                { id: 'dotnet', name: '.NET HttpClient', icon: DotNetIcon },
                { id: 'curl', name: 'cURL Command', icon: BashIcon },
              ].map((lang) => {
                const isActive = activeLang === lang.id
                return (
                  <button
                    key={lang.id}
                    onClick={() => setActiveLang(lang.id as any)}
                    className={`flex items-center space-x-4 px-4 py-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary/20 shadow-md shadow-primary/10'
                        : 'bg-transparent border-white/5 text-slate-400 hover:border-white/10 hover:bg-white/5'
                    }`}
                  >
                    <lang.icon className='w-5 h-5 shrink-0' />
                    <span className='text-sm font-semibold'>{lang.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Code Block Display Right Side: 8 cols */}
            <div className='lg:col-span-8 bg-[#1b1818]/50 border border-white/5 rounded-2xl overflow-hidden flex flex-col justify-between backdrop-blur-xl relative'>
              <div className='flex items-center justify-between border-b border-white/5 bg-[#131111]/80 px-6 py-4'>
                <div className='flex items-center space-x-2 text-xs text-slate-400 font-mono'>
                  <span className='w-2.5 h-2.5 rounded-full bg-primary' />
                  <span>
                    fetch-posts.
                    {activeLang === 'js'
                      ? 'js'
                      : activeLang === 'python'
                        ? 'py'
                        : activeLang === 'php'
                          ? 'php'
                          : activeLang === 'go'
                            ? 'go'
                            : activeLang === 'rust'
                              ? 'rs'
                              : activeLang === 'dotnet'
                                ? 'cs'
                                : 'sh'}
                  </span>
                </div>

                <button
                  onClick={() =>
                    handleCopy(languageSnippets[activeLang], 'snippet')
                  }
                  className='text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded hover:bg-white/5'
                  title='Copy code snippet'
                >
                  {copiedText === 'snippet' ? (
                    <Check className='w-3.5 h-3.5 text-emerald-400' />
                  ) : (
                    <Copy className='w-3.5 h-3.5' />
                  )}
                </button>
              </div>

              <div className='flex-1 p-6 font-mono text-[13px] leading-relaxed text-slate-300 overflow-x-auto min-h-[280px] bg-[#131111]/30'>
                <pre className='text-deep-mocha-300 max-h-[350px] overflow-y-auto'>
                  <code>{languageSnippets[activeLang]}</code>
                </pre>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture flow section */}
        <section
          id='architecture'
          className='py-24 border-t border-white/5 scroll-mt-24 relative'
        >
          <div className='absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-900/5 rounded-full blur-[120px] pointer-events-none' />

          <div className='text-center max-w-3xl mx-auto mb-20'>
            <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-6'>
              <RefreshCw className='w-3 h-3 text-deep-mocha-400' />
              <span>Edge-First Pipelines</span>
            </div>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white'>
              Request Architecture Lifecycle
            </h2>
            <p className='text-slate-400'>
              Morphic is designed for massive performance at the edge, scaling
              from API key verification down to direct PostgreSQL connection
              routing.
            </p>
          </div>

          {/* Diagram Flow */}
          <div className='grid md:grid-cols-4 gap-6 relative items-stretch'>
            {/* Step 1 */}
            <div className='p-6 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-purple-500/30 transition-all flex flex-col justify-between backdrop-blur-xl group'>
              <div>
                <div className='w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform'>
                  <Terminal className='w-5 h-5' />
                </div>
                <h3 className='text-sm font-black tracking-widest text-slate-400 uppercase mb-2'>
                  01 / Scoped Origin
                </h3>
                <p className='text-xs text-slate-300 leading-relaxed'>
                  Client application sends standard HTTPS cURL request,
                  containing authorization tokens and client tenant scopes
                  (`X-Tenant-ID`).
                </p>
              </div>
              <div className='text-[10px] font-mono text-deep-mocha-300 mt-6 bg-deep-mocha-800/40 py-1 px-2.5 rounded border border-deep-mocha-700/20 self-start'>
                Header Isolation
              </div>
            </div>

            {/* Step 2 */}
            <div className='p-6 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-indigo-500/30 transition-all flex flex-col justify-between backdrop-blur-xl group'>
              <div>
                <div className='w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform'>
                  <Server className='w-5 h-5' />
                </div>
                <h3 className='text-sm font-black tracking-widest text-slate-400 uppercase mb-2'>
                  02 / Hono Routing
                </h3>
                <p className='text-xs text-slate-300 leading-relaxed'>
                  Hono routes operations inside serverless edge runtime. Checks
                  API key validation, verifies Turnstile bot protection, and
                  scopes tenant contexts.
                </p>
              </div>
              <div className='text-[10px] font-mono text-deep-mocha-300 mt-6 bg-deep-mocha-800/40 py-1 px-2.5 rounded border border-deep-mocha-700/20 self-start'>
                1.2ms Edge Execution
              </div>
            </div>

            {/* Step 3 */}
            <div className='p-6 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-emerald-500/30 transition-all flex flex-col justify-between backdrop-blur-xl group'>
              <div>
                <div className='w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform'>
                  <Layers className='w-5 h-5' />
                </div>
                <h3 className='text-sm font-black tracking-widest text-slate-400 uppercase mb-2'>
                  03 / Drizzle ORM
                </h3>
                <p className='text-xs text-slate-300 leading-relaxed'>
                  Compiles schema models dynamically. Handles collection
                  relationships, content versions, and localization without
                  complex migrations.
                </p>
              </div>
              <div className='text-[10px] font-mono text-deep-mocha-300 mt-6 bg-deep-mocha-800/40 py-1 px-2.5 rounded border border-deep-mocha-700/20 self-start'>
                Type-safe SQL Compilation
              </div>
            </div>

            {/* Step 4 */}
            <div className='p-6 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-amber-500/30 transition-all flex flex-col justify-between backdrop-blur-xl group'>
              <div>
                <div className='w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform'>
                  <Database className='w-5 h-5' />
                </div>
                <h3 className='text-sm font-black tracking-widest text-slate-400 uppercase mb-2'>
                  04 / Neon Postgres
                </h3>
                <p className='text-xs text-slate-300 leading-relaxed'>
                  Queries serverless database clusters with connection pooling.
                  Strict data scoping yields isolated organization structures.
                </p>
              </div>
              <div className='text-[10px] font-mono text-deep-mocha-300 mt-6 bg-deep-mocha-800/40 py-1 px-2.5 rounded border border-deep-mocha-700/20 self-start'>
                Serverless Autoscaling
              </div>
            </div>
          </div>
        </section>

        {/* Feature Deck: 6 cards detailing properties */}
        <section
          id='features'
          className='py-24 border-t border-white/5 scroll-mt-24'
        >
          <div className='text-center max-w-3xl mx-auto mb-20'>
            <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-6'>
              <Zap className='w-3 h-3 text-deep-mocha-400' />
              <span>Full-Stack Capabilities</span>
            </div>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white'>
              Engineered for Modern Delivery
            </h2>
            <p className='text-slate-400'>
              All core CMS capabilities are engineered around strict
              multi-tenancy, extreme performance, and custom integration
              channels.
            </p>
          </div>

          <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-8'>
            {/* Card 1: Multi-tenancy */}
            <div className='p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[60px] pointer-events-none' />
              <div className='w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform'>
                <Users className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-white mb-3'>
                Strict Multi-Tenancy
              </h3>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Manage isolation boundaries with a single database deployment.
                Users, media folders, schemas, and api entries are automatically
                scoped inside tenant namespaces. Switch organization nodes in
                super admin.
              </p>
            </div>

            {/* Card 2: Webhooks with HMAC signing */}
            <div className='p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[60px] pointer-events-none' />
              <div className='w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform'>
                <Webhook className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-white mb-3'>
                HMAC Signed Webhooks
              </h3>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Trigger webhooks upon publishing content, uploading media, or
                receiving form submissions. Protect recipient server endpoints
                by verifying signatures computed with custom shared secret keys.
              </p>
            </div>

            {/* Card 3: Form builder */}
            <div className='p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[60px] pointer-events-none' />
              <div className='w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform'>
                <CheckSquare className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-white mb-3'>
                Branded Form Builder
              </h3>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Create public forms without backend configuration. Tailor forms
                with 8 curated HSL color schemes, custom images, Turnstile bot
                protection, and IP rate limiting (5 entries per 15 minutes).
              </p>
            </div>

            {/* Card 4: Media API */}
            <div className='p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[60px] pointer-events-none' />
              <div className='w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform'>
                <Cloud className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-white mb-3'>
                Asset Storage CDNs
              </h3>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Upload media and document types dynamically. Morphic defaults to
                Cloudinary integration for optimized image delivery
                transformations, but is configurable for 100% AWS S3 buckets.
              </p>
            </div>

            {/* Card 5: Versioning */}
            <div className='p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[60px] pointer-events-none' />
              <div className='w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform'>
                <History className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-white mb-3'>
                History Versioning
              </h3>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Maintain comprehensive audit trails for edited entries. Save
                document versions automatically, review modifications
                side-by-side, and restore past document layouts with a click.
              </p>
            </div>

            {/* Card 6: Languages */}
            <div className='p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-primary/30 hover:shadow-2xl hover:shadow-primary/5 transition-all group relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[60px] pointer-events-none' />
              <div className='w-12 h-12 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform'>
                <Languages className='w-6 h-6' />
              </div>
              <h3 className='text-lg font-bold text-white mb-3'>
                Localized Translations
              </h3>
              <p className='text-xs text-slate-400 leading-relaxed'>
                Target global user bases. Author content translation sets linked
                through grouping systems, and filter REST API entries
                dynamically with `?locale=[code]` parameters.
              </p>
            </div>
          </div>
        </section>

        {/* Competitor Comparison Section */}
        <section
          id='comparison'
          className='py-24 border-t border-white/5 scroll-mt-24'
        >
          <div className='text-center max-w-3xl mx-auto mb-20'>
            <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-6'>
              <Layers className='w-3 h-3 text-deep-mocha-400' />
              <span>Platform Comparison</span>
            </div>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white'>
              Morphic vs The Enterprise
            </h2>
            <p className='text-slate-400'>
              See how Morphic's database-first, serverless design patterns
              compare to monolithic and costly proprietary SaaS headless CMS
              alternatives.
            </p>
          </div>

          {/* Table Matrix */}
          <div className='overflow-x-auto rounded-2xl border border-white/5 bg-deep-mocha-900/30 backdrop-blur-xl shadow-2xl'>
            <table className='w-full text-left border-collapse text-xs md:text-sm'>
              <thead>
                <tr className='border-b border-white/5 bg-deep-mocha-900/80 text-white font-semibold'>
                  <th className='p-6 font-bold text-slate-400'>Capability</th>
                  <th className='p-6 font-extrabold text-primary-foreground bg-primary/20 border-x border-white/5'>
                    Morphic CMS
                  </th>
                  <th className='p-6 font-semibold text-slate-400'>Strapi</th>
                  <th className='p-6 font-semibold text-slate-400'>
                    Contentful
                  </th>
                  <th className='p-6 font-semibold text-slate-400'>Sanity</th>
                </tr>
              </thead>
              <tbody className='divide-y divide-white/5 text-slate-300'>
                <tr className='hover:bg-white/[0.02] transition-colors'>
                  <td className='p-6 font-semibold text-white'>
                    Pricing & License
                  </td>
                  <td className='p-6 text-white font-bold bg-primary/10 border-x border-white/5'>
                    Free Self-Host or Cloud (Free / Pro)
                  </td>
                  <td className='p-6'>Open Source (Limits / Enterprise Pay)</td>
                  <td className='p-6'>
                    Proprietary SaaS (Free tier/high costs)
                  </td>
                  <td className='p-6'>
                    Proprietary Studio (SaaS quotas & limits)
                  </td>
                </tr>
                <tr className='hover:bg-white/[0.02] transition-colors'>
                  <td className='p-6 font-semibold text-white'>
                    Database Model
                  </td>
                  <td className='p-6 text-white font-bold bg-primary/10 border-x border-white/5'>
                    Database-First (Drizzle / Postgres native)
                  </td>
                  <td className='p-6'>Abstract ORM (Heavy Node translation)</td>
                  <td className='p-6'>Proprietary DB (No direct access)</td>
                  <td className='p-6'>Document Store (GROQ / JSON-based)</td>
                </tr>
                <tr className='hover:bg-white/[0.02] transition-colors'>
                  <td className='p-6 font-semibold text-white'>
                    Native Multi-Tenancy
                  </td>
                  <td className='p-6 text-white font-bold bg-primary/10 border-x border-white/5'>
                    Built-in (Isolated scope native)
                  </td>
                  <td className='p-6'>
                    Enterprise tier only (Expensive add-on)
                  </td>
                  <td className='p-6'>
                    Enterprise tier only (Large contracts)
                  </td>
                  <td className='p-6'>Enterprise tier only (Paid)</td>
                </tr>
                <tr className='hover:bg-white/[0.02] transition-colors'>
                  <td className='p-6 font-semibold text-white'>
                    Edge & Compute Support
                  </td>
                  <td className='p-6 text-white font-bold bg-primary/10 border-x border-white/5'>
                    Full Edge Runtime compatible (Hono Engine)
                  </td>
                  <td className='p-6'>Node.js heavy servers only</td>
                  <td className='p-6'>SaaS Hosted Only</td>
                  <td className='p-6'>SaaS Hosted Only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Field Types Showcase Section */}
        <section
          id='field-types'
          className='py-28 border-t border-white/5 scroll-mt-24 relative'
        >
          <div className='absolute top-[30%] right-[10%] w-[25rem] h-[25rem] bg-deep-mocha-700/5 rounded-full blur-[100px] pointer-events-none' />

          <div className='grid lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto'>
            {/* Content (Left) */}
            <div className='lg:col-span-6 space-y-8'>
              <div>
                <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-4'>
                  <Layers className='w-3 h-3 text-deep-mocha-400' />
                  <span>Rich Schema Architecture</span>
                </div>
                <h2 className='text-3xl md:text-5xl font-bold tracking-tight text-white mb-4'>
                  Built-in Field Types for Every Use Case
                </h2>
                <p className='text-slate-400 leading-relaxed'>
                  Design schemas that exactly model your content. From simple
                  inputs to complex relationships and nested repeaters, Morphic
                  CMS supports a comprehensive set of fields.
                </p>
              </div>

              <div className='grid grid-cols-2 gap-6'>
                {/* Basic Fields */}
                <div className='space-y-3 bg-[#131111]/25 border border-white/5 rounded-2xl p-5 backdrop-blur-sm'>
                  <h4 className='text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2'>
                    Basic Fields
                  </h4>
                  <ul className='space-y-2 text-xs text-slate-400'>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Text
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Textarea
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Email
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Number
                    </li>
                  </ul>
                </div>

                {/* Selection Fields */}
                <div className='space-y-3 bg-[#131111]/25 border border-white/5 rounded-2xl p-5 backdrop-blur-sm'>
                  <h4 className='text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2'>
                    Selection Fields
                  </h4>
                  <ul className='space-y-2 text-xs text-slate-400'>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Select
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Checkbox
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Radio
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Boolean
                    </li>
                  </ul>
                </div>

                {/* Media & Files */}
                <div className='space-y-3 bg-[#131111]/25 border border-white/5 rounded-2xl p-5 backdrop-blur-sm'>
                  <h4 className='text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2'>
                    Media & Files
                  </h4>
                  <ul className='space-y-2 text-xs text-slate-400'>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Media
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Documents
                    </li>
                  </ul>
                </div>

                {/* Advanced Fields */}
                <div className='space-y-3 bg-[#131111]/25 border border-white/5 rounded-2xl p-5 backdrop-blur-sm'>
                  <h4 className='text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2'>
                    Advanced Fields
                  </h4>
                  <ul className='space-y-2 text-xs text-slate-400'>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Date, Datetime & Time
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Rich Text & Relation
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Slug & Repeater
                    </li>
                    <li className='flex items-center gap-2'>
                      <span className='w-1.5 h-1.5 rounded-full bg-primary' />{' '}
                      Group
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Image (Right) */}
            <div className='lg:col-span-6 relative rounded-2xl border border-white/10 bg-[#1b1818]/60 p-2 shadow-2xl backdrop-blur-xl group overflow-hidden'>
              {/* Ambient background glow behind the image */}
              <div className='absolute -inset-1 bg-gradient-to-r from-primary/20 via-deep-mocha-800/10 to-primary/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none' />
              <div className='relative rounded-xl overflow-hidden border border-white/5 bg-black/40'>
                <img
                  src='/field-types.png'
                  alt='Built-in Field Types'
                  className='w-full h-auto object-cover'
                />
              </div>
            </div>
          </div>
        </section>

        {/* API Playground Section */}
        <section
          id='api-playground'
          className='py-24 border-t border-white/5 scroll-mt-24 relative'
        >
          <div className='absolute top-[10%] left-[10%] w-[30rem] h-[30rem] bg-primary/5 rounded-full blur-[120px] pointer-events-none' />

          <div className='grid lg:grid-cols-12 gap-12 items-center max-w-6xl mx-auto'>
            {/* Image (Left) */}
            <div className='lg:col-span-7 relative rounded-2xl border border-white/10 bg-[#1b1818]/60 p-2 shadow-2xl backdrop-blur-xl group overflow-hidden'>
              {/* Ambient background glow behind the image */}
              <div className='absolute -inset-1 bg-gradient-to-r from-primary/20 via-deep-mocha-800/10 to-primary/20 rounded-2xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-700 pointer-events-none' />
              <div className='relative rounded-xl overflow-hidden border border-white/5 bg-black/40'>
                <img
                  src='/morphic-cms-api-playground.webp'
                  alt='Morphic CMS API Playground'
                  className='w-full h-auto object-cover'
                />
              </div>
            </div>

            {/* Content (Right) */}
            <div className='lg:col-span-5 text-left flex flex-col items-start'>
              <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-6'>
                <TerminalIcon className='w-3 h-3 text-deep-mocha-400' />
                <span>Interactive Developer Environment</span>
              </div>
              <h2 className='text-3xl md:text-4xl font-bold mb-4 tracking-tight text-white leading-tight'>
                Explore APIs with REST Playground
              </h2>
              <p className='text-slate-400 mb-8 leading-relaxed'>
                Test your endpoints, explore dynamic resource schemas, and debug
                database queries directly within the embedded developer
                workspace.
              </p>

              <ul className='space-y-4 text-sm text-slate-300'>
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='w-5 h-5 text-primary shrink-0 mt-0.5' />
                  <div>
                    <strong className='text-white block'>
                      Instant API Testing
                    </strong>
                    Test raw queries and JSON endpoints without leaving the
                    console.
                  </div>
                </li>
                <li className='flex items-start gap-3'>
                  <CheckCircle2 className='w-5 h-5 text-primary shrink-0 mt-0.5' />
                  <div>
                    <strong className='text-white block'>
                      Dynamic Schema Shapes
                    </strong>
                    Browse automatically generated OpenAPI-compliant resource
                    schemas.
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Deployment Paths Section */}
        <section
          id='deployment'
          className='py-28 border-t border-white/5 scroll-mt-24 relative'
        >
          <div className='absolute bottom-[10%] right-[10%] w-[30rem] h-[30rem] bg-emerald-955/5 rounded-full blur-[120px] pointer-events-none' />

          <div className='text-center max-w-3xl mx-auto mb-20'>
            <div className='inline-flex items-center space-x-2 px-3 py-1 bg-deep-mocha-900/40 border border-deep-mocha-700/25 rounded-full text-xs font-semibold text-deep-mocha-300 mb-6'>
              <Rocket className='w-3 h-3 text-deep-mocha-400' />
              <span>Production Infrastructure</span>
            </div>
            <h2 className='text-3xl md:text-5xl font-bold mb-4 tracking-tight text-white'>
              Host Globally in Minutes
            </h2>
            <p className='text-slate-400'>
              Morphic compiles to lightweight serverless builds. Deploy on
              global edge CDNs, run containerized on a VPS, or provision AWS
              lambda instances.
            </p>
          </div>

          <div className='grid lg:grid-cols-3 gap-8'>
            {/* Vercel */}
            <div className='p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between backdrop-blur-xl group relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[50px] pointer-events-none' />
              <div>
                <div className='w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform'>
                  <svg
                    className='w-6 h-6'
                    viewBox='0 0 76 65'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <path
                      d='M37.5274 0L75.0548 65H0L37.5274 0Z'
                      fill='currentColor'
                    />
                  </svg>
                </div>
                <h3 className='text-xl font-bold text-white mb-2'>
                  Vercel Edge
                </h3>
                <p className='text-xs text-slate-400 mb-6 leading-relaxed'>
                  Optimized global CDN execution with automated Git CI/CD. Ideal
                  for lightweight edge responses.
                </p>
                <ul className='space-y-3.5 text-xs text-slate-300 border-t border-white/5 pt-6'>
                  <li className='flex items-center'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-400 mr-2.5 shrink-0' />{' '}
                    Serverless API routing
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-400 mr-2.5 shrink-0' />{' '}
                    Automatic Edge SSL configuration
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-400 mr-2.5 shrink-0' />{' '}
                    Environment parameters verification
                  </li>
                </ul>
              </div>
              <div className='mt-8 text-[11px] font-mono text-deep-mocha-300 bg-deep-mocha-800/40 py-2 px-3.5 rounded border border-deep-mocha-700/20 text-center'>
                Deploy button compatible
              </div>
            </div>

            {/* Docker */}
            <div className='p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between backdrop-blur-xl group relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[50px] pointer-events-none' />
              <div>
                <div className='w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform'>
                  <FileCode className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold text-white mb-2'>
                  Docker VPS
                </h3>
                <p className='text-xs text-slate-400 mb-6 leading-relaxed'>
                  Self-host on DigitalOcean, Hetzner, or AWS EC2 instances with
                  native file compilation.
                </p>
                <ul className='space-y-3.5 text-xs text-slate-300 border-t border-white/5 pt-6'>
                  <li className='flex items-center'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-400 mr-2.5 shrink-0' />{' '}
                    Preconfigured `docker-compose.yml`
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-400 mr-2.5 shrink-0' />{' '}
                    Persistent node container clusters
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-400 mr-2.5 shrink-0' />{' '}
                    Custom reverse proxy settings
                  </li>
                </ul>
              </div>
              <div className='mt-8 text-[11px] font-mono text-emerald-400 bg-emerald-500/5 py-2 px-3.5 rounded border border-emerald-500/10 text-center'>
                docker compose up -d
              </div>
            </div>

            {/* AWS */}
            <div className='p-8 rounded-2xl bg-[#1b1818]/50 border border-white/5 hover:border-primary/30 transition-all flex flex-col justify-between backdrop-blur-xl group relative overflow-hidden'>
              <div className='absolute top-0 right-0 w-32 h-32 bg-deep-mocha-700/5 rounded-full blur-[50px] pointer-events-none' />
              <div>
                <div className='w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-6 group-hover:scale-105 transition-transform'>
                  <Server className='w-6 h-6' />
                </div>
                <h3 className='text-xl font-bold text-white mb-2'>
                  AWS Serverless
                </h3>
                <p className='text-xs text-slate-400 mb-6 leading-relaxed'>
                  Deploy to zero-maintenance AWS infrastructure with
                  Dynamo/Aurora, SES, S3, and Lambda.
                </p>
                <ul className='space-y-3.5 text-xs text-slate-300 border-t border-white/5 pt-6'>
                  <li className='flex items-center'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-400 mr-2.5 shrink-0' />{' '}
                    Lambda wrappers for Hono Router
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-400 mr-2.5 shrink-0' />{' '}
                    Aurora serverless PG scaling
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='w-4 h-4 text-emerald-400 mr-2.5 shrink-0' />{' '}
                    Native S3 storage and SES gateways
                  </li>
                </ul>
              </div>
              <div className='mt-8 text-[11px] font-mono text-indigo-400 bg-indigo-500/5 py-2 px-3.5 rounded border border-indigo-500/10 text-center'>
                100% Serverless AWS CDK
              </div>
            </div>
          </div>
        </section>

        {/* Cloud Callout Section */}
        <section
          id='cloud'
          className='py-28 border-t border-white/5 scroll-mt-24 relative overflow-hidden'
        >
          {/* Subtle background glow */}
          <div className='absolute top-[20%] left-[-10%] w-[35rem] h-[35rem] bg-indigo-500/5 rounded-full blur-[130px] pointer-events-none' />
          <div className='absolute bottom-0 right-[-10%] w-[35rem] h-[35rem] bg-purple-500/5 rounded-full blur-[130px] pointer-events-none' />

          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10'>
            <div className='grid lg:grid-cols-12 gap-12 items-center'>
              
              {/* Left Column: Copy */}
              <div className='lg:col-span-5 space-y-6'>
                <div className='inline-flex items-center space-x-2 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary mb-2'>
                  <Flame className='w-3.5 h-3.5 text-primary animate-pulse mr-1' />
                  <span>Introducing Morphic Cloud</span>
                </div>
                <h2 className='text-3xl md:text-5xl font-black text-white tracking-tight leading-tight'>
                  Get Started Without the{' '}
                  <span className='text-transparent bg-clip-text bg-gradient-to-r from-primary to-indigo-400'>
                    Server Hassle
                  </span>
                </h2>
                <p className='text-slate-400 text-sm md:text-base leading-relaxed'>
                  Love Morphic CMS but want to skip database provisioning, SSL setups, edge deployment, and ongoing maintenance? Morphic Cloud gets your content projects online instantly on fully managed, high-performance global cloud infrastructure.
                </p>
                <div className='pt-4 flex flex-wrap gap-4'>
                  <Button
                    asChild
                    className='h-12 px-6 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5'
                  >
                    <Link href='/signup'>Create Free Account</Link>
                  </Button>
                  <Button
                    asChild
                    variant='outline'
                    className='h-12 px-6 rounded-full border-white/10 bg-white/5 text-white hover:bg-white/10 transition-all hover:-translate-y-0.5'
                  >
                    <Link href='/pricing'>View Pricing & Plans</Link>
                  </Button>
                </div>
              </div>

              {/* Right Column: Features Grid */}
              <div className='lg:col-span-7 grid sm:grid-cols-2 gap-6'>
                {/* Zero Setup */}
                <div className='p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all duration-300 backdrop-blur-xl group'>
                  <div className='w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform'>
                    <Zap className='w-5 h-5' />
                  </div>
                  <h3 className='text-lg font-bold text-white mb-2'>Zero-Config Setup</h3>
                  <p className='text-xs text-slate-400 leading-relaxed'>
                    Deploy a production-ready workspace in 3 seconds. We manage the database clusters, caching layers, and security updates under the hood.
                  </p>
                </div>

                {/* Team Collaboration */}
                <div className='p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all duration-300 backdrop-blur-xl group'>
                  <div className='w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform'>
                    <Users className='w-5 h-5' />
                  </div>
                  <h3 className='text-lg font-bold text-white mb-2'>Multi-User Workspaces</h3>
                  <p className='text-xs text-slate-400 leading-relaxed'>
                    Add up to 3 active users per tenant on our PRO plan. Invite content writers, editors, and administrators with secure role privileges.
                  </p>
                </div>

                {/* Built-in Localization */}
                <div className='p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all duration-300 backdrop-blur-xl group'>
                  <div className='w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform'>
                    <Globe className='w-5 h-5' />
                  </div>
                  <h3 className='text-lg font-bold text-white mb-2'>Global Localization</h3>
                  <p className='text-xs text-slate-400 leading-relaxed'>
                    Reach global audiences. Build localized content schema structures and serve multi-regional api payloads seamlessly at the edge.
                  </p>
                </div>

                {/* Custom Webhooks & Forms */}
                <div className='p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all duration-300 backdrop-blur-xl group'>
                  <div className='w-10 h-10 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform'>
                    <Webhook className='w-5 h-5' />
                  </div>
                  <h3 className='text-lg font-bold text-white mb-2'>Webhooks & Forms</h3>
                  <p className='text-xs text-slate-400 leading-relaxed'>
                    Trigger builds automatically on Netlify/Vercel with webhook hooks, and collect frontend user submissions directly via Form Builder.
                  </p>
                </div>

              </div>
              
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className='py-28 text-center relative overflow-hidden'>
          <div className='absolute inset-0 bg-gradient-to-tr from-deep-mocha-900/40 to-transparent border border-white/5 rounded-3xl mx-2' />
          <div className='absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-deep-mocha-700/5 rounded-full blur-[100px] pointer-events-none' />
          <div className='relative z-10 max-w-3xl mx-auto flex flex-col items-center justify-center px-4'>
            <h2 className='text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-white leading-tight'>
              Get Started with <br />
              <span className='gradient-text-neon'>Morphic CMS today</span>
            </h2>
            <p className='text-slate-400 mb-10 text-sm md:text-base leading-relaxed'>
              Build lightning-fast headless systems scoped perfectly to your
              tenants. Launch on Vercel and Neon in less than 2 minutes.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center gap-4'>
              <Button
                asChild
                className='h-12 px-8 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20'
              >
                <Link href='/docs'>Read Documentation</Link>
              </Button>
              <Button
                asChild
                variant='outline'
                className='h-12 px-8 rounded-full border-white/10 bg-deep-mocha-900/40 text-slate-300 hover:text-white hover:bg-deep-mocha-800'
              >
                <a
                  href='https://github.com/bayukurniawan30/morphic-cms'
                  target='_blank'
                  rel='noopener noreferrer'
                >
                  GitHub Repository
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className='py-16 border-t border-white/5 text-slate-500 text-xs mt-12 bg-deep-mocha-900/20'>
          <div className='max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6'>
            <div className='flex items-center space-x-2.5'>
              <Logo stroke='#ffffff' />
              <span className='font-black text-white tracking-tighter uppercase'>
                MORPHIC
              </span>
            </div>
            <div className='flex flex-wrap items-center justify-center gap-x-8 gap-y-4'>
              <a
                href='#features'
                className='hover:text-slate-300 transition-colors'
              >
                Features
              </a>
              <a
                href='#architecture'
                className='hover:text-slate-300 transition-colors'
              >
                Architecture
              </a>
              <a
                href='#comparison'
                className='hover:text-slate-300 transition-colors'
              >
                Comparison
              </a>
              <Link
                href='/docs'
                className='hover:text-slate-300 transition-colors'
              >
                Docs
              </Link>
              <Link
                href='/changelog'
                className='hover:text-slate-300 transition-colors'
              >
                Changelog
              </Link>
              <Link
                href='/terms'
                className='hover:text-slate-300 transition-colors'
              >
                Terms
              </Link>
            </div>
            <div className='opacity-50 text-center md:text-right italic'>
              &copy; {new Date().getFullYear()} Morphic CMS. Released under the
              MIT License.
            </div>
          </div>
        </footer>
      </main>
    </div>
  )
}
