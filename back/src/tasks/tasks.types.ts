export type Task = {
  id: number;
  title: string;
  description: string;
  done: boolean;
  createdAt: Date;
};

export type CreateTaskInput = {
  title: string;
  description: string;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  done?: boolean;
};
