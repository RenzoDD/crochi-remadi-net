CREATE TABLE Productos (
	ProductoId integer NOT NULL CONSTRAINT Productos_pk PRIMARY KEY AUTOINCREMENT,

	Nombre varchar(50) NOT NULL,
	Precio decimal(8,2) NOT NULL,

	CreatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	UpdatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	IsDeleted boolean NOT NULL DEFAULT 0
);