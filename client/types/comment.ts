// Comment Types
export interface Comment {
  id: string;
  content: string;
  resolved: boolean;
  pageId: string;
  authorId: string;
  author: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCommentInput {
  content: string;
  pageId: string;
}

export interface UpdateCommentInput {
  content: string;
}

export interface CommentFilters {
  pageId?: string;
  resolved?: boolean;
}
