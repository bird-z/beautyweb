import { describe, it, expect } from 'vitest'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'

describe('lexical → html', () => {
  it('notes 的 blocks 数组可以转成 Lexical root 并渲染为 HTML', () => {
    // 与 seed-content.ts 的 simpleLexical 等价的样例
    const lexical = {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        children: [
          { type: 'paragraph', format: '', indent: 0, version: 1, children: [{ type: 'text', text: '首段', version: 1 }] },
          { type: 'heading', tag: 'h2', format: '', indent: 0, version: 1, children: [{ type: 'text', text: '小节', version: 1 }] },
          {
            type: 'list', listType: 'bullet', tag: 'ul', start: 1, format: '', indent: 0, version: 1,
            children: [{
              type: 'listitem', value: 1, format: '', indent: 0, version: 1,
              children: [{ type: 'text', text: '条目', version: 1 }],
            }],
          },
        ],
      },
    }
    const html = convertLexicalToHTML({ data: lexical as any })
    expect(html).toContain('首段')
    expect(html).toContain('<h2')
    expect(html).toContain('<li')
  })
})
