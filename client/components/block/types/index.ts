// Block Type Enum - matches backend BlockType
export enum BlockType {
  // Text blocks
  PARAGRAPH = 'PARAGRAPH',
  HEADING_1 = 'HEADING_1',
  HEADING_2 = 'HEADING_2',
  HEADING_3 = 'HEADING_3',
  QUOTE = 'QUOTE',
  CODE = 'CODE',
  CALLOUT = 'CALLOUT',

  // List blocks
  BULLETED_LIST = 'BULLETED_LIST',
  NUMBERED_LIST = 'NUMBERED_LIST',
  TO_DO = 'TO_DO',

  // Media blocks
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  FILE = 'FILE',
  EMBED = 'EMBED',

  // Layout blocks
  DIVIDER = 'DIVIDER',
  COLUMN = 'COLUMN',
  COLUMN_LIST = 'COLUMN_LIST',
}

// Block Author
export interface BlockAuthor {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

// Block Interface
export interface Block {
  id: string;
  type: BlockType;
  content: Record<string, any> | null;
  props: Record<string, any> | null;
  pageId: string;
  parentId: string | null;
  position: number;
  authorId: string;
  author: BlockAuthor;
  createdAt: string;
  updatedAt: string;
  children?: Block[];
}

// Content types for different block types
export interface ParagraphContent {
  text: string;
}

export interface HeadingContent {
  text: string;
}

export interface QuoteContent {
  text: string;
  author?: string;
}

export interface CodeContent {
  code: string;
  language?: string;
}

export interface TodoContent {
  text: string;
  checked: boolean;
}

export interface CalloutContent {
  text: string;
  emoji?: string;
}

export interface ListContent {
  items: string[];
}

// Create Block Data
export interface CreateBlockData {
  type: BlockType;
  content?: Record<string, any>;
  props?: Record<string, any>;
  pageId: string;
  parentId?: string;
}

// Update Block Data
export interface UpdateBlockData {
  type?: BlockType;
  content?: Record<string, any>;
  props?: Record<string, any>;
}
