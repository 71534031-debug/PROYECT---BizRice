USE BizRiseDB;
GO

-- Categorías iniciales
INSERT INTO Categorias (nombre, descripcion) VALUES
('Gastronomía',             'Restaurantes, cafeterías y comida típica'),
('Textilería y Moda',       'Ropa, telas, confecciones y accesorios'),
('Artesanía',               'Productos artesanales y arte tradicional'),
('Servicios Profesionales', 'Consultoría, diseño y contabilidad'),
('Turismo',                 'Agencias y experiencias turísticas'),
('Tecnología',              'Soluciones digitales y desarrollo');

-- Administrador inicial (contraseña: Admin123! — cambiar en producción)
-- Hash generado con bcrypt del password Admin123!
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Admin', 'BizRise', 'admin@bizrise.pe',
 '$2b$12$OhIry1VsJ6IMSi2g13Rx1.Caq4g0JX.c2Egwn4h.d7sYfR0Lo27KG',
 'administrador');
GO

-- Usuarios de prueba (contraseñas documentadas en README.md)
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Demo', 'Emprendedor', 'emprendedor@bizrise.pe',
 '$2b$12$06vPY4xP.Jhak93JWMztOeP2GWZAFpxb/R98KzF5DSmjPgfHfx8wC',
 'emprendedor');
GO

INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Demo', 'Cliente', 'cliente@bizrise.pe',
 '$2b$12$my8GvV2aU0UckjJNcsHu.eOItrGJaa9Qdtaz0m20GDgNVbZIhouZ2',
 'cliente');
GO
