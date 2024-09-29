CREATE TABLE coaches (
  username text NOT NULL UNIQUE,
  password text NOT NULL
);

CREATE TABLE clients (
  id serial PRIMARY KEY,
  name text NOT NULL UNIQUE,
  start_date date DEFAULT NOW(),
  notes text,
  coach_username text
    NOT NULL
    REFERENCES coaches(username)
    ON DELETE CASCADE
);

CREATE TABLE goals (
  id serial PRIMARY KEY,
  title text NOT NULL,
  notes text,
  created_on date DEFAULT CURRENT_DATE,
  done boolean DEFAULT false,
  client_id int
    NOT NULL
    REFERENCES clients(id)
    ON DELETE CASCADE,
  coach_username text
    NOT NULL
    REFERENCES coaches(username)
    ON DELETE CASCADE
);


