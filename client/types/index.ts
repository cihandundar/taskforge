// Re-export all types
export * from './comment';
export * from './mention';

// Workspace Types
export interface Workspace {
  id: string;
  name: string;
  icon: string | null;
  description: string | null;
  ownerId: string;
  owner?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
  members?: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
  joinedAt: string;
  user?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
}

export interface CreateWorkspaceInput {
  name: string;
  icon?: string;
  description?: string;
}

export interface UpdateWorkspaceInput {
  name?: string;
  icon?: string;
  description?: string;
}

// Page Types
export interface Page {
  id: string;
  title: string;
  icon: string | null;
  cover: string | null;
  isPublic: boolean;
  workspaceId: string | null;
  parentId: string | null;
  authorId: string;
  author?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
  workspace?: Workspace;
  parent?: Page;
  children?: Page[];
  blocks?: Block[];
  comments?: Comment[];
  lastEditedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePageInput {
  title: string;
  icon?: string;
  workspaceId?: string;
  parentId?: string;
}

export interface UpdatePageInput {
  title?: string;
  icon?: string;
  cover?: string;
  isPublic?: boolean;
}

// Block Types
export type BlockType =
  | 'PARAGRAPH'
  | 'HEADING_1'
  | 'HEADING_2'
  | 'HEADING_3'
  | 'QUOTE'
  | 'CODE'
  | 'CALLOUT'
  | 'BULLETED_LIST'
  | 'NUMBERED_LIST'
  | 'TO_DO'
  | 'IMAGE'
  | 'VIDEO'
  | 'FILE'
  | 'EMBED'
  | 'DIVIDER'
  | 'COLUMN'
  | 'COLUMN_LIST'
  | 'TABLE_VIEW'
  | 'BOARD_VIEW'
  | 'CALENDAR_VIEW'
  | 'GALLERY_VIEW'
  | 'LIST_VIEW'
  | 'TOGGLE'
  | 'SYNCED_BLOCK'
  | 'BOOKMARK';

export interface Block {
  id: string;
  type: BlockType;
  content: string | null;
  props: Record<string, any> | null;
  pageId: string;
  parentId: string | null;
  position: number;
  authorId: string | null;
  author?: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
  children?: Block[];
  page?: Page;
  parent?: Block;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBlockInput {
  type: BlockType;
  content?: string;
  props?: Record<string, any>;
  pageId: string;
  parentId?: string | null;
  position?: number;
}

export interface UpdateBlockInput {
  content?: string;
  props?: Record<string, any>;
  position?: number;
  parentId?: string | null;
}

export interface ReorderBlocksInput {
  blockIds: string[];
  parentId?: string | null;
}

// Site & Calendar Types
export interface Site {
  id: string;
  name: string;
  url: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  isActive: boolean;
  userId: string;
  notes?: CalendarNote[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSiteInput {
  name: string;
  url: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  isActive?: boolean;
}

export interface UpdateSiteInput {
  name?: string;
  url?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  isActive?: boolean;
}

export interface CalendarNote {
  id: string;
  date: string; // YYYY-MM-DD format
  note: string;
  color: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  userId: string;
  siteId: string | null;
  site?: Site;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCalendarNoteInput {
  date: string;
  note: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  siteId?: string | null;
}

export interface UpdateCalendarNoteInput {
  note?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  status?: 'todo' | 'in_progress' | 'completed' | 'cancelled';
  siteId?: string | null;
}

// File Types
export interface FileAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  uploadProgress?: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
  userId: string;
  createdAt: string;
}

// User Types (re-export from api-client for convenience)
export interface User {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Comment Types (re-export from comment.ts)
export type { Comment, CreateCommentInput, UpdateCommentInput, CommentFilters } from './comment';

// Mention Types (re-export from mention.ts)
export type { Mention, MentionWithDetails, MentionUser, MentionNotification } from './mention';

// WebSocket Types
export interface BlockUpdateEvent {
  id: string;
  type: BlockType;
  content?: string;
  props?: Record<string, any>;
  updatedBy: string;
  updatedByName: string;
  updatedByAvatar: string | null;
  timestamp: string;
  previousContent?: string;
}

export interface TypingIndicatorEvent {
  pageId: string;
  userId: string;
  userName: string;
  blockId: string | null;
  timestamp: string;
}

export interface UserPresenceEvent {
  pageId: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    avatar: string | null;
  };
  timestamp: string;
}
