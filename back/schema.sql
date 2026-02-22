    
# tasksdb



  CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    done BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );