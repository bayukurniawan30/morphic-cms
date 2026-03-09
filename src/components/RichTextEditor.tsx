import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Toggle } from '@/components/ui/toggle'
import BubbleMenuExtension from '@tiptap/extension-bubble-menu'
import Image from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableRow } from '@tiptap/extension-table-row'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code,
  Undo,
  Redo,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  Heading4,
  Heading5,
  Table as TableIcon,
  Plus,
  Trash2,
  Columns,
  Rows,
  ImageIcon,
  Settings,
} from 'lucide-react'
import React, { useState, useEffect } from 'react'
import MediaPicker from './MediaPicker'

interface RichTextEditorProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
}

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
}: RichTextEditorProps) => {
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false)
  const [isImageSettingsOpen, setIsImageSettingsOpen] = useState(false)
  const [imageSettings, setImageSettings] = useState({ alt: '', width: '' })

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5],
        },
      }),
      BubbleMenuExtension,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Image.extend({
        renderHTML({ HTMLAttributes }) {
          const { style, ...rest } = HTMLAttributes
          return ['img', { ...rest, style: style }]
        },
        addAttributes() {
          return {
            ...this.parent?.(),
            width: {
              default: null,
              parseHTML: (element) =>
                element.style.width || element.getAttribute('width') || null,
              renderHTML: (attributes) => {
                if (!attributes.width) return {}
                return {
                  style: `width: ${attributes.width}; height: auto;`,
                }
              },
            },
          }
        },
      }).configure({
        allowBase64: true,
        HTMLAttributes: {
          class:
            'rounded-lg border shadow-sm max-w-full h-auto my-4 mx-auto block transition-all',
        },
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-sm dark:prose-invert max-w-none min-h-[150px] p-4 focus:outline-none',
      },
    },
  })

  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  if (!editor) {
    return null
  }

  const addImage = (url: string) => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run()
    }
  }

  const handleUpdateImage = () => {
    editor
      .chain()
      .focus()
      .updateAttributes('image', {
        alt: imageSettings.alt,
        width: imageSettings.width
          ? imageSettings.width.includes('%') ||
            imageSettings.width.includes('px')
            ? imageSettings.width
            : `${imageSettings.width}px`
          : null,
      })
      .run()
    setIsImageSettingsOpen(false)
  }

  const editImageSettings = () => {
    const attrs = editor.getAttributes('image')
    setImageSettings({
      alt: attrs.alt || '',
      width: attrs.width || '',
    })
    setIsImageSettingsOpen(true)
  }

  return (
    <div className='rounded-md border bg-card overflow-hidden focus-within:ring-1 focus-within:ring-ring'>
      <div className='flex flex-wrap items-center gap-1 border-b bg-muted/50 p-1 shrink-0'>
        <Toggle
          size='sm'
          pressed={editor.isActive('bold')}
          onPressedChange={() => editor.chain().focus().toggleBold().run()}
          aria-label='Toggle bold'
        >
          <Bold className='h-4 w-4' />
        </Toggle>
        <Toggle
          size='sm'
          pressed={editor.isActive('italic')}
          onPressedChange={() => editor.chain().focus().toggleItalic().run()}
          aria-label='Toggle italic'
        >
          <Italic className='h-4 w-4' />
        </Toggle>
        <Toggle
          size='sm'
          pressed={editor.isActive('strike')}
          onPressedChange={() => editor.chain().focus().toggleStrike().run()}
          aria-label='Toggle strikethrough'
        >
          <Strikethrough className='h-4 w-4' />
        </Toggle>

        <Separator orientation='vertical' className='mx-1 h-4' />

        <Toggle
          size='sm'
          pressed={editor.isActive('heading', { level: 1 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 1 }).run()
          }
          aria-label='Toggle heading 1'
        >
          <Heading1 className='h-4 w-4' />
        </Toggle>
        <Toggle
          size='sm'
          pressed={editor.isActive('heading', { level: 2 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 2 }).run()
          }
          aria-label='Toggle heading 2'
        >
          <Heading2 className='h-4 w-4' />
        </Toggle>
        <Toggle
          size='sm'
          pressed={editor.isActive('heading', { level: 3 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 3 }).run()
          }
          aria-label='Toggle heading 3'
        >
          <Heading3 className='h-4 w-4' />
        </Toggle>
        <Toggle
          size='sm'
          pressed={editor.isActive('heading', { level: 4 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 4 }).run()
          }
          aria-label='Toggle heading 4'
        >
          <Heading4 className='h-4 w-4' />
        </Toggle>
        <Toggle
          size='sm'
          pressed={editor.isActive('heading', { level: 5 })}
          onPressedChange={() =>
            editor.chain().focus().toggleHeading({ level: 5 }).run()
          }
          aria-label='Toggle heading 5'
        >
          <Heading5 className='h-4 w-4' />
        </Toggle>

        <Separator orientation='vertical' className='mx-1 h-4' />

        <Toggle
          size='sm'
          pressed={editor.isActive('bulletList')}
          onPressedChange={() =>
            editor.chain().focus().toggleBulletList().run()
          }
          aria-label='Toggle bullet list'
        >
          <List className='h-4 w-4' />
        </Toggle>
        <Toggle
          size='sm'
          pressed={editor.isActive('orderedList')}
          onPressedChange={() =>
            editor.chain().focus().toggleOrderedList().run()
          }
          aria-label='Toggle ordered list'
        >
          <ListOrdered className='h-4 w-4' />
        </Toggle>

        <Separator orientation='vertical' className='mx-1 h-4' />

        <Toggle
          size='sm'
          pressed={editor.isActive('blockquote')}
          onPressedChange={() =>
            editor.chain().focus().toggleBlockquote().run()
          }
          aria-label='Toggle blockquote'
        >
          <Quote className='h-4 w-4' />
        </Toggle>
        <Toggle
          size='sm'
          pressed={editor.isActive('codeBlock')}
          onPressedChange={() => editor.chain().focus().toggleCodeBlock().run()}
          aria-label='Toggle code block'
        >
          <Code className='h-4 w-4' />
        </Toggle>

        <Separator orientation='vertical' className='mx-1 h-4' />

        <Toggle
          size='sm'
          pressed={editor.isActive('image')}
          onPressedChange={() => setIsMediaPickerOpen(true)}
          aria-label='Insert image'
        >
          <ImageIcon className='h-4 w-4' />
        </Toggle>

        <Separator orientation='vertical' className='mx-1 h-4' />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Toggle
              size='sm'
              pressed={editor.isActive('table')}
              aria-label='Table Menu'
            >
              <TableIcon className='h-4 w-4' />
            </Toggle>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-56'>
            <DropdownMenuItem
              onClick={() =>
                editor
                  .chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
                  .run()
              }
            >
              <Plus className='mr-2 h-4 w-4' />
              <span>Insert Table</span>
            </DropdownMenuItem>
            <Separator className='my-1' />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnBefore().run()}
              disabled={!editor.isActive('table')}
            >
              <Columns className='mr-2 h-4 w-4' />
              <span>Add Column Before</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addColumnAfter().run()}
              disabled={!editor.isActive('table')}
            >
              <Columns className='mr-2 h-4 w-4' />
              <span>Add Column After</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteColumn().run()}
              disabled={!editor.isActive('table')}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              <span>Delete Column</span>
            </DropdownMenuItem>
            <Separator className='my-1' />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowBefore().run()}
              disabled={!editor.isActive('table')}
            >
              <Rows className='mr-2 h-4 w-4' />
              <span>Add Row Before</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().addRowAfter().run()}
              disabled={!editor.isActive('table')}
            >
              <Rows className='mr-2 h-4 w-4' />
              <span>Add Row After</span>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteRow().run()}
              disabled={!editor.isActive('table')}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              <span>Delete Row</span>
            </DropdownMenuItem>
            <Separator className='my-1' />
            <DropdownMenuItem
              onClick={() => editor.chain().focus().deleteTable().run()}
              disabled={!editor.isActive('table')}
              className='text-destructive focus:text-destructive'
            >
              <Trash2 className='mr-2 h-4 w-4' />
              <span>Delete Table</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className='flex-1' />

        <Toggle
          size='sm'
          onPressedChange={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          aria-label='Undo'
        >
          <Undo className='h-4 w-4' />
        </Toggle>
        <Toggle
          size='sm'
          onPressedChange={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          aria-label='Redo'
        >
          <Redo className='h-4 w-4' />
        </Toggle>
      </div>

      <BubbleMenu
        editor={editor}
        shouldShow={({ editor }) => editor.isActive('image')}
      >
        <div className='flex border bg-card shadow-md rounded-md overflow-hidden p-1 gap-1'>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={editImageSettings}
            className='h-8 px-2 flex items-center gap-2'
          >
            <Settings className='h-4 w-4' />
            <span className='text-xs'>Alt & Size</span>
          </Button>
          <Separator orientation='vertical' className='h-4 my-auto' />
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={() => editor.chain().focus().deleteSelection().run()}
            className='h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10'
          >
            <Trash2 className='h-4 w-4' />
          </Button>
        </div>
      </BubbleMenu>

      <EditorContent editor={editor} />

      <MediaPicker
        open={isMediaPickerOpen}
        onOpenChange={setIsMediaPickerOpen}
        onSelect={addImage}
      />

      <Dialog open={isImageSettingsOpen} onOpenChange={setIsImageSettingsOpen}>
        <DialogContent className='sm:max-w-md'>
          <DialogHeader>
            <DialogTitle>Image Settings</DialogTitle>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid gap-2'>
              <Label htmlFor='alt'>Alt Text</Label>
              <Input
                id='alt'
                value={imageSettings.alt}
                onChange={(e) =>
                  setImageSettings({ ...imageSettings, alt: e.target.value })
                }
                placeholder='Description for accessibility'
              />
            </div>
            <div className='grid gap-2'>
              <Label htmlFor='width'>Width</Label>
              <Input
                id='width'
                value={imageSettings.width}
                onChange={(e) =>
                  setImageSettings({ ...imageSettings, width: e.target.value })
                }
                placeholder='e.g. 100%, 300px, or 300'
              />
              <p className='text-[10px] text-muted-foreground'>
                Specify percentage (%) or pixels (px). Defaults to px if
                omitted.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => setIsImageSettingsOpen(false)}
            >
              Cancel
            </Button>
            <Button type='button' onClick={handleUpdateImage}>
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default RichTextEditor
