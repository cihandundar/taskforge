// Mention Types
export interface Mention {
  id: string;
  read: boolean;
  commentId: string;
  mentionedUserId: string;
  mentionedUser: {
    id: string;
    email: string;
    name: string | null;
    avatar: string | null;
  };
  createdAt: string;
}

export interface MentionWithDetails extends Mention {
  comment: {
    id: string;
    content: string;
    author: {
      id: string;
      email: string;
      name: string | null;
      avatar: string | null;
    };
    page: {
      id: string;
      title: string;
      workspaceId: string;
    };
  };
}

export interface MentionUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

export interface MentionNotification {
  id: string;
  commentId: string;
  comment: {
    content: string;
    author: {
      id: string;
      name: string | null;
    };
  };
  page: {
    id: string;
    title: string;
    workspaceId: string;
  };
  mentionedBy: {
    id: string;
    name: string | null;
  };
  createdAt: string;
}
