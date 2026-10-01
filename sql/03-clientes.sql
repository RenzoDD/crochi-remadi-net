CREATE TABLE Clientes (
	ClienteId integer NOT NULL CONSTRAINT Clientes_pk PRIMARY KEY AUTOINCREMENT,

	Nombre varchar(50) NOT NULL,
	WhatsApp varchar(50),
	Celular varchar(50),

	CreatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	UpdatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	IsDeleted boolean NOT NULL DEFAULT 0
);