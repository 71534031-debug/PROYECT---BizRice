-- Seed básico de arranque para PostgreSQL
-- Ejecutar: psql $DATABASE_URL -f seeds.sql

-- Categorías iniciales
INSERT INTO Categorias (nombre, descripcion) VALUES
('Gastronomía',             'Restaurantes, cafeterías y comida típica'),
('Textilería y Moda',       'Ropa, telas, confecciones y accesorios'),
('Artesanía',               'Productos artesanales y arte tradicional'),
('Servicios',               'Servicios profesionales y personales'),
('Turismo',                 'Agencias y experiencias turísticas'),
('Tecnología',              'Soluciones digitales y desarrollo'),
('Belleza',                 'Cuidado personal, estética y cosmética'),
('Agricultura',             'Productos agrícolas y derivados'),
('Hogar',                   'Decoración, muebles y artículos para el hogar');

-- Administrador inicial (contraseña: BizRise2024!)
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Admin', 'BizRise', 'admin@bizrise.pe',
 '$2b$12$OhIry1VsJ6IMSi2g13Rx1.Caq4g0JX.c2Egwn4h.d7sYfR0Lo27KG',
 'administrador');

-- Usuarios demo
INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Pedro', 'Huamán', 'emprendedor@bizrise.pe',
 '$2b$12$06vPY4xP.Jhak93JWMztOeP2GWZAFpxb/R98KzF5DSmjPgfHfx8wC',
 'emprendedor');

INSERT INTO Usuarios (nombre, apellido, correo, contrasena_hash, rol) VALUES
('Lucía', 'Mendoza', 'cliente@bizrise.pe',
 '$2b$12$my8GvV2aU0UckjJNcsHu.eOItrGJaa9Qdtaz0m20GDgNVbZIhouZ2',
 'cliente');

-- NOTA: Para generar datos completos (+350 ventas, +150 productos, +30 emprendimientos),
-- ejecutar: python seed_full.py
