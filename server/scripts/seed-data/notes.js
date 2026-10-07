// 知识普及：标题与主题取自现站，正文为精简版
// block: ['h', text] | ['p', text] | ['code', text] | ['ul', [items]]
export const NOTES = [
  {
    id: 'gdb', cat: '调试', title: 'GDB 调试速查', date: '2025-11-02',
    lede: '调试前必须加上 -g 参数生成调试信息，建议加上 -O0 关闭优化。',
    blocks: [
      ['code', 'gcc -g -O0 main.c -o main\ngdb ./main'],
      ['h', '断点与执行'],
      ['ul', ['break 行号/函数：设置断点', 'delete 断点编号：删除断点', 'run / continue：运行与继续', 'next / step：单步跳过与单步进入']],
      ['h', '查看数据'],
      ['ul', ['print 变量：打印一次', 'display 变量：每步自动打印', 'disassemble 函数名：查看汇编']],
    ],
  },
  {
    id: 'vim', cat: '编辑器', title: 'Vim 光标移动与跳转速查', date: '2025-11-09',
    lede: '少按方向键，多用动作 + 范围，编辑速度会快上一截。',
    blocks: [
      ['h', '基础移动'],
      ['ul', ['h j k l：左下上右', 'w / b：下一个 / 上一个单词', '0 / $：行首 / 行尾', 'gg / G：文件首 / 文件尾']],
      ['h', '文本对象'],
      ['p', 'd（删除）、c（修改）、y（复制）配合 i（inner，不含边界）或 a 使用，例如 ciw 修改当前单词，di" 删除引号内内容。'],
      ['h', '标记'],
      ['p', 'ma 在当前位置打标记 a，`a 瞬间跳回标记 a。'],
    ],
  },
  {
    id: 'cmake', cat: '工具链', title: 'CMake：理解与实践', date: '2025-11-16',
    lede: 'CMake 不直接编译代码，它生成构建系统，再由构建系统去编译。',
    blocks: [
      ['code', 'cmake_minimum_required(VERSION 3.16)\nproject(demo C)\nadd_executable(demo main.c)'],
      ['code', 'cmake -S . -B build\ncmake --build build'],
      ['p', '把源码目录和构建目录分开（out-of-source build），删掉 build 文件夹即可回到干净状态。'],
    ],
  },
  {
    id: 'asm', cat: '底层', title: '汇编基础指令（AT&T 语法）', date: '2025-11-23',
    lede: '寄存器带 %，立即数带 $，目标操作数在右边。',
    blocks: [
      ['h', '数据传送与栈'],
      ['ul', ['mov src, dest：数据传送', 'lea src, dest：加载有效地址', 'push / pop：压栈与出栈']],
      ['h', '运算'],
      ['ul', ['add / sub：加减', 'imul / idiv：有符号乘除', 'xor %rax, %rax：快速清零']],
    ],
  },
  {
    id: 'regex', cat: '基础', title: '正则表达式入门', date: '2025-12-01',
    lede: '用一行模式描述一类字符串。',
    blocks: [
      ['ul', ['. 任意字符，\\d 数字，\\w 单词字符', '* 零次或多次，+ 一次或多次，? 零或一次', '^ 行首，$ 行尾', '( ) 分组，| 或']],
      ['code', '^1[3-9]\\d{9}$'],
      ['p', '上例匹配一个 11 位手机号格式。'],
    ],
  },
  {
    id: 'concurrency', cat: '底层', title: '并发与同步', date: '2025-12-10',
    lede: '多个线程读写同一份数据时，结果取决于谁先谁后，这就是竞态。',
    blocks: [
      ['h', '常见工具'],
      ['ul', ['互斥锁：同一时刻只允许一个线程进入临界区', '条件变量：等待某个条件成立再继续', '原子操作：不可分割的读改写']],
      ['p', '加锁的顺序要固定，否则两个线程互相等待对方的锁，就会死锁。'],
    ],
  },
  {
    id: 'shell', cat: '工具链', title: 'Shell 脚本参数与引号', date: '2025-12-18',
    lede: '"$@" 传入所有脚本参数，并保持每个参数原样。',
    blocks: [
      ['code', 'for f in "$@"; do\n  echo "-> $f"\ndone'],
      ['p', '给变量加双引号，确保文件名中有空格时也被当作一个整体；用 -- 结束选项解析，即使文件名以 - 开头也安全。'],
    ],
  },
];

export const NOTE_CATS = [...new Set(NOTES.map((n) => n.cat))];
