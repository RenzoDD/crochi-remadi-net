CREATE TABLE Usuarios (
	UsuarioId integer NOT NULL CONSTRAINT Usuarios_pk PRIMARY KEY AUTOINCREMENT,

	Usuario varchar(50) NOT NULL,
	Clave varchar(64) NULL,
	Salt varchar(64) NULL,

	CreatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	UpdatedAt integer NOT NULL DEFAULT (unixepoch() * 1000),
	IsDeleted boolean NOT NULL DEFAULT 0
);